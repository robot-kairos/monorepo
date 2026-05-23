"""Deep learning inference — live YOLO person detection + ResNet18 injury classification + patch localization."""

from __future__ import annotations

import threading
import time
import logging
from typing import TYPE_CHECKING

import cv2
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from ultralytics import YOLO
from PIL import Image

if TYPE_CHECKING:
    from video import CameraCapture

logger = logging.getLogger("uvicorn.error")

# =====================================================
# Live performance settings
# =====================================================

_INFERENCE_FPS = 10
MAX_STREAM_WIDTH = 640

# Patch scan is expensive, so we do not run it every cycle.
PATCH_EVERY_N_CYCLES = 3

_DrawCmd = dict  # {x1, y1, x2, y2, color, text}


# =====================================================
# Configuration
# =====================================================

YOLO_MODEL_PATH = "../../multi-label_classifier/yolov8n.pt"
INJURY_MODEL_PATH = "../../multi-label_classifier/best_injury_multilabel_resnet18.pth"

PERSON_CLASS_ID = 0
PERSON_CONF_THRESHOLD = 0.50

MIN_W = 40
MIN_H = 60

# Ignore tiny background people/posters/reflections/screens.
MIN_PERSON_AREA_RATIO = 0.08

LABEL_COLS = [
    "open_wound",
    "swelling",
    "trapped_limb",
    "unclear",
    "visible_blood",
]

# Thresholds for full-person crops.
PERSON_CROP_THRESHOLDS = {
    "open_wound": 0.75,
    "swelling": 0.75,
    "trapped_limb": 0.85,
    "unclear": 0.80,
    "visible_blood": 0.80,
}

# Thresholds for patch scanning.
# Keep these stricter because patch scanning can create false positives.
PATCH_CONF_THRESHOLDS = {
    "open_wound": 0.72,
    "swelling": 0.88,
    "trapped_limb": 0.95,
    "unclear": 0.98,
    "visible_blood": 0.72,
}

DISPLAY_LABELS = {
    "open_wound": "Open Wound",
    "swelling": "Swelling Detected",
    "trapped_limb": "Limb Trapped",
    "unclear": "Person",
    "visible_blood": "Visible Blood",
}

ENABLE_PERSON_DETECTION = True
ENABLE_PATCH_SCAN = True

# Fewer windows = faster live feed.
# Add 0.25 if you have a strong GPU.
WINDOW_SCALES = [0.35]
WINDOW_STEP_RATIO = 0.75

KEEP_ONLY_BEST_PATCH = True
MAX_PATCH_RESULTS = 1


# =====================================================
# Device selection: GPU if available, otherwise CPU
# =====================================================

if torch.cuda.is_available():
    device = torch.device("cuda")
    yolo_device = 0  # Ultralytics prefers GPU index for CUDA
    logger.info("CUDA GPU detected: using GPU acceleration.")
    logger.info("GPU name: %s", torch.cuda.get_device_name(0))

elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
    device = torch.device("mps")
    yolo_device = "mps"
    logger.info("Apple MPS detected: using MPS acceleration.")

else:
    device = torch.device("cpu")
    yolo_device = "cpu"
    logger.warning("No GPU/MPS found: running inference on CPU. Expect reduced performance.")

logger.info("Torch device: %s", device)
logger.info("YOLO device: %s", yolo_device)


# =====================================================
# Load Models
# =====================================================

try:
    person_model = YOLO(YOLO_MODEL_PATH)
except Exception as exc:
    logger.critical("Failed to load YOLO model from %s: %s", YOLO_MODEL_PATH, exc)
    raise SystemExit(1) from exc

try:
    injury_model = models.resnet18(weights=None)

    in_features = injury_model.fc.in_features
    injury_model.fc = nn.Linear(in_features, len(LABEL_COLS))

    injury_model.load_state_dict(
        torch.load(INJURY_MODEL_PATH, map_location=device)
    )

    injury_model = injury_model.to(device)
    injury_model.eval()

except Exception as exc:
    logger.critical("Failed to load injury model from %s: %s", INJURY_MODEL_PATH, exc)
    raise SystemExit(1) from exc

logger.info("DL models loaded successfully.")


# =====================================================
# Transform
# =====================================================

inference_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


# =====================================================
# Prediction
# =====================================================

def predict_injury_from_crop_with_thresholds(crop_bgr, thresholds):
    crop_rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
    image = Image.fromarray(crop_rgb).convert("RGB")

    input_tensor = inference_transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = injury_model(input_tensor)
        probabilities = torch.sigmoid(outputs).detach().cpu().numpy()[0]

    all_results = {}

    for label, probability in zip(LABEL_COLS, probabilities):
        threshold = thresholds[label]

        all_results[label] = {
            "confidence": round(float(probability), 3),
            "threshold": threshold,
            "predicted": bool(probability >= threshold),
        }

    predicted_labels = [
        label for label, data in all_results.items()
        if data["predicted"]
    ]

    # If unclear is predicted, show only Person - P1.
    if "unclear" in predicted_labels:
        predicted_labels = ["unclear"]

    detected_labels = [
        {
            "label": label,
            "confidence": all_results[label]["confidence"],
        }
        for label in predicted_labels
    ]

    return detected_labels, all_results


def predict_person_crop(crop_bgr):
    return predict_injury_from_crop_with_thresholds(
        crop_bgr,
        PERSON_CROP_THRESHOLDS,
    )


def predict_patch_crop(crop_bgr):
    return predict_injury_from_crop_with_thresholds(
        crop_bgr,
        PATCH_CONF_THRESHOLDS,
    )


# =====================================================
# Priority and display logic
# =====================================================

def calculate_urgency(detected_labels):
    label_names = [item["label"] for item in detected_labels]

    if "trapped_limb" in label_names:
        return "P3"

    if "open_wound" in label_names:
        return "P2"

    if "visible_blood" in label_names:
        return "P2"

    return "P1"


def build_display_text(detected_labels, urgency):
    if len(detected_labels) == 0:
        return "Person - P1"

    priority_order = {
        "trapped_limb": 5,
        "open_wound": 4,
        "visible_blood": 3,
        "swelling": 2,
        "unclear": 1,
    }

    top_label = max(
        detected_labels,
        key=lambda item: (
            priority_order.get(item["label"], 0),
            item["confidence"],
        )
    )

    internal_label = top_label["label"]
    display_label = DISPLAY_LABELS.get(internal_label, internal_label)

    return f"{display_label} - {urgency}"


def get_box_color(urgency):
    if urgency == "P3":
        return (0, 0, 255)      # red
    elif urgency == "P2":
        return (0, 165, 255)    # orange
    else:
        return (0, 255, 0)      # green


# =====================================================
# Sliding-window patch helpers
# =====================================================

def generate_sliding_windows(frame_w, frame_h):
    windows = []

    for scale in WINDOW_SCALES:
        win_w = int(frame_w * scale)
        win_h = int(frame_h * scale)

        if win_w < 80 or win_h < 80:
            continue

        step_x = max(1, int(win_w * WINDOW_STEP_RATIO))
        step_y = max(1, int(win_h * WINDOW_STEP_RATIO))

        y = 0
        while y <= frame_h - win_h:
            x = 0
            while x <= frame_w - win_w:
                windows.append([x, y, x + win_w, y + win_h])
                x += step_x
            y += step_y

    return windows


def command_score(cmd):
    labels = cmd.get("labels", [])

    if len(labels) == 0:
        return 0.0

    text = cmd.get("text", "")

    if "P3" in text:
        priority_score = 3
    elif "P2" in text:
        priority_score = 2
    else:
        priority_score = 1

    max_confidence = max(item["confidence"] for item in labels)

    source_bonus = {
        "patch_scan": 0.30,
        "person_detection": 0.10,
    }.get(cmd.get("source", ""), 0.0)

    return priority_score + max_confidence + source_bonus


# =====================================================
# Main live inference
# =====================================================

def compute_detections(frame, run_patch_scan: bool = True) -> list[_DrawCmd]:
    """
    Live hybrid inference:
    1. Detect large full people using YOLO and label them.
    2. Ignore tiny background people.
    3. Scan patches periodically to localize partial-body injuries.
    4. Return draw commands for the live MJPEG stream.
    """

    frame_h, frame_w = frame.shape[:2]

    person_commands: list[_DrawCmd] = []
    patch_commands: list[_DrawCmd] = []

    # =====================================================
    # 1. Person detection path
    # =====================================================

    if ENABLE_PERSON_DETECTION:
        results = person_model(
            frame,
            conf=PERSON_CONF_THRESHOLD,
            verbose=False,
            device=yolo_device,
        )

        for result in results:
            boxes = result.boxes

            if boxes is None:
                continue

            for box in boxes:
                if int(box.cls[0].item()) != PERSON_CLASS_ID:
                    continue

                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())

                x1 = max(0, x1)
                y1 = max(0, y1)
                x2 = min(frame_w, x2)
                y2 = min(frame_h, y2)

                w = x2 - x1
                h = y2 - y1

                if w < MIN_W or h < MIN_H:
                    continue

                area_ratio = (w * h) / max(1, frame_w * frame_h)

                # Ignore tiny background people/posters/screens.
                if area_ratio < MIN_PERSON_AREA_RATIO:
                    continue

                crop = frame[y1:y2, x1:x2]

                if crop.size == 0:
                    continue

                detected_labels, _ = predict_person_crop(crop)

                urgency = calculate_urgency(detected_labels)
                display_text = build_display_text(detected_labels, urgency)
                box_color = get_box_color(urgency)

                person_commands.append({
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2,
                    "color": box_color,
                    "text": display_text,
                    "source": "person_detection",
                    "labels": detected_labels,
                })

    # =====================================================
    # 2. Patch scan path
    # =====================================================

    if ENABLE_PATCH_SCAN and run_patch_scan:
        windows = generate_sliding_windows(frame_w, frame_h)

        for x1, y1, x2, y2 in windows:
            patch = frame[y1:y2, x1:x2]

            if patch.size == 0:
                continue

            detected_labels, _ = predict_patch_crop(patch)

            # Patch mode should only show clear injury findings.
            # Do not draw Person - P1 from patches.
            detected_labels = [
                item for item in detected_labels
                if item["label"] != "unclear"
            ]

            if len(detected_labels) == 0:
                continue

            urgency = calculate_urgency(detected_labels)

            # Do not draw P1 patch findings.
            if urgency == "P1":
                continue

            display_text = build_display_text(detected_labels, urgency)
            box_color = get_box_color(urgency)

            patch_commands.append({
                "x1": x1,
                "y1": y1,
                "x2": x2,
                "y2": y2,
                "color": box_color,
                "text": display_text,
                "source": "patch_scan",
                "labels": detected_labels,
            })

        if KEEP_ONLY_BEST_PATCH and len(patch_commands) > 0:
            patch_commands = sorted(
                patch_commands,
                key=command_score,
                reverse=True,
            )
            patch_commands = patch_commands[:MAX_PATCH_RESULTS]

    return person_commands + patch_commands


# ---------------------------------------------------------------------------
# Inference worker
# ---------------------------------------------------------------------------

class InferenceWorker:
    def __init__(self, camera: "CameraCapture") -> None:
        self._camera = camera
        self._commands: list[_DrawCmd] = []
        self._last_patch_commands: list[_DrawCmd] = []
        self._lock = threading.Lock()
        self._running = False
        self._cycle = 0

    def start(self) -> None:
        self._running = True
        threading.Thread(target=self._loop, daemon=True).start()

    def stop(self) -> None:
        self._running = False

    def _loop(self) -> None:
        interval = 1.0 / _INFERENCE_FPS

        while self._running:
            t0 = time.monotonic()

            frame = self._camera.raw_frame()

            if frame is None:
                time.sleep(0.01)
                continue

            h, w = frame.shape[:2]

            if w > MAX_STREAM_WIDTH:
                scale = MAX_STREAM_WIDTH / w
                frame = cv2.resize(
                    frame,
                    (MAX_STREAM_WIDTH, int(h * scale)),
                    interpolation=cv2.INTER_AREA,
                )

            run_patch_scan = (self._cycle % PATCH_EVERY_N_CYCLES == 0)

            cmds = compute_detections(
                frame,
                run_patch_scan=run_patch_scan,
            )

            # Keep previous patch command between patch cycles, so labels do not disappear.
            person_cmds = [
                cmd for cmd in cmds
                if cmd.get("source") == "person_detection"
            ]

            patch_cmds = [
                cmd for cmd in cmds
                if cmd.get("source") == "patch_scan"
            ]

            if run_patch_scan:
                self._last_patch_commands = patch_cmds
            else:
                patch_cmds = self._last_patch_commands

            final_cmds = person_cmds + patch_cmds

            with self._lock:
                self._commands = final_cmds

            self._cycle += 1

            remaining = interval - (time.monotonic() - t0)

            if remaining > 0:
                time.sleep(remaining)

    def get_commands(self) -> list[_DrawCmd]:
        with self._lock:
            return list(self._commands)


def start_inference_worker(camera: "CameraCapture") -> InferenceWorker:
    worker = InferenceWorker(camera)
    worker.start()
    return worker