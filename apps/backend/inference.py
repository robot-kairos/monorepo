"""Deep learning inference — YOLO person detection + ResNet18 injury classification + patch localization."""
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

_INFERENCE_FPS = 5
MAX_STREAM_WIDTH = 640

_DrawCmd = dict  # {x1, y1, x2, y2, color (BGR tuple), text}


# =====================================================
# Configuration
# =====================================================

YOLO_MODEL_PATH = "../../multi-label_classifier/yolov8n.pt"
INJURY_MODEL_PATH = "../../multi-label_classifier/best_injury_multilabel_resnet18.pth"

PERSON_CLASS_ID = 0
PERSON_CONF_THRESHOLD = 0.5

MIN_W = 40
MIN_H = 60

# Ignore tiny background people, posters, reflections, screen images, etc.
MIN_PERSON_AREA_RATIO = 0.08

LABEL_COLS = [
    "open_wound",
    "swelling",
    "trapped_limb",
    "unclear",
    "visible_blood",
]

# Used for full detected person crops
PERSON_CROP_THRESHOLDS = {
    "open_wound": 0.75,
    "swelling": 0.75,
    "trapped_limb": 0.85,
    "unclear": 0.80,
    "visible_blood": 0.80,
}

# Used for patch scanning.
# Keep stricter thresholds here because patches can create false positives.
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

# Smaller windows localize injury better.
WINDOW_SCALES = [0.20, 0.30, 0.40]
WINDOW_STEP_RATIO = 0.35

# Reduce clutter in live feed.
KEEP_ONLY_BEST_PATCH = True
MAX_PATCH_RESULTS = 1


# =====================================================
# Load Models
# =====================================================

if torch.cuda.is_available():
    device = torch.device("cuda")
elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
    device = torch.device("mps")
else:
    device = torch.device("cpu")
    logger.warning("No GPU/MPS found: running inference on CPU, expect reduced performance")

logger.info("Torch inference will use %s device", device)

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
        probabilities = torch.sigmoid(outputs).cpu().numpy()[0]

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

    # If unclear is predicted, display it as Person - P1 only.
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
# Priority / display logic
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

    # Prefer medically important labels over weaker labels.
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
# Patch helpers
# =====================================================

def box_iou(box_a, box_b):
    ax1, ay1, ax2, ay2 = box_a
    bx1, by1, bx2, by2 = box_b

    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)

    inter_w = max(0, inter_x2 - inter_x1)
    inter_h = max(0, inter_y2 - inter_y1)

    inter_area = inter_w * inter_h

    area_a = max(0, ax2 - ax1) * max(0, ay2 - ay1)
    area_b = max(0, bx2 - bx1) * max(0, by2 - by1)

    union = area_a + area_b - inter_area

    if union == 0:
        return 0.0

    return inter_area / union


def generate_sliding_windows(frame_w, frame_h):
    windows = []

    for scale in WINDOW_SCALES:
        win_w = int(frame_w * scale)
        win_h = int(frame_h * scale)

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
# Main inference
# =====================================================

def compute_detections(frame) -> list[_DrawCmd]:
    """
    Hybrid inference:
    1. Detect large visible persons and label them as Person - P1 or injury label.
    2. Scan frame patches to localize partial-body / close-up injuries.
    3. Avoid tiny background people.
    """

    frame_h, frame_w = frame.shape[:2]
    commands: list[_DrawCmd] = []
    person_boxes: list[list[int]] = []
    patch_commands: list[_DrawCmd] = []

    # =====================================================
    # 1. Person detection path
    # =====================================================

    if ENABLE_PERSON_DETECTION:
        results = person_model(
            frame,
            conf=PERSON_CONF_THRESHOLD,
            verbose=False,
            device=device,
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

                person_boxes.append([x1, y1, x2, y2])

                crop = frame[y1:y2, x1:x2]

                if crop.size == 0:
                    continue

                detected_labels, _ = predict_person_crop(crop)

                urgency = calculate_urgency(detected_labels)
                display_text = build_display_text(detected_labels, urgency)
                box_color = get_box_color(urgency)

                commands.append({
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
    # 2. Patch scan path for injury localization
    # =====================================================

    if ENABLE_PATCH_SCAN:
        windows = generate_sliding_windows(frame_w, frame_h)

        for patch_box in windows:
            x1, y1, x2, y2 = patch_box

            patch = frame[y1:y2, x1:x2]

            if patch.size == 0:
                continue

            detected_labels, _ = predict_patch_crop(patch)

            # Patch scan should only display actual injury-like findings.
            # Do not show Person - P1 from patches.
            detected_labels = [
                item for item in detected_labels
                if item["label"] not in ["unclear"]
            ]

            if len(detected_labels) == 0:
                continue

            urgency = calculate_urgency(detected_labels)

            # Patch scan should not draw P1.
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

        commands.extend(patch_commands)

    return commands


# ---------------------------------------------------------------------------
# Inference worker — runs compute_detections in a dedicated thread so the
# async generator never blocks on ML inference.
# ---------------------------------------------------------------------------

class InferenceWorker:
    def __init__(self, camera: "CameraCapture") -> None:
        self._camera = camera
        self._commands: list[_DrawCmd] = []
        self._lock = threading.Lock()
        self._running = False

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
                time.sleep(0.033)
                continue

            h, w = frame.shape[:2]

            if w > MAX_STREAM_WIDTH:
                scale = MAX_STREAM_WIDTH / w
                frame = cv2.resize(
                    frame,
                    (MAX_STREAM_WIDTH, int(h * scale)),
                    interpolation=cv2.INTER_AREA,
                )

            cmds = compute_detections(frame)

            with self._lock:
                self._commands = cmds

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