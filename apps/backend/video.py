"""Video capture and frame processing module."""
from __future__ import annotations

import threading
import time
from typing import Optional

import logging

import cv2
import numpy as np

logger = logging.getLogger("uvicorn.error")

import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from ultralytics import YOLO
from PIL import Image


# =====================================================
# Configuration
# =====================================================

YOLO_MODEL_PATH = "../../multi-label_classifier/yolov8n.pt"
INJURY_MODEL_PATH = "../../multi-label_classifier/best_injury_multilabel_resnet18.pth"

PERSON_CLASS_ID = 0
PERSON_CONF_THRESHOLD = 0.5

MIN_W = 40
MIN_H = 60

MAX_STREAM_WIDTH = 640   # resize before encode + inference (saves bandwidth and CPU)
JPEG_QUALITY     = 55    # down from 75 — acceptable for monitoring, ~35% smaller frames

LABEL_COLS = [
    "open_wound",
    "swelling",
    "trapped_limb",
    "unclear",
    "visible_blood",
]

CLASS_THRESHOLDS = {
    "open_wound": 0.30,
    "swelling": 0.35,
    "trapped_limb": 0.50,
    "unclear": 0.40,
    "visible_blood": 0.35,
}


# =====================================================
# Load Models
# =====================================================

if torch.cuda.is_available():
    device = torch.device("cuda")
elif torch.backends.mps.is_available():
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
# Injury Prediction
# =====================================================

def predict_injury_from_crop(crop_bgr):
    crop_rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
    image = Image.fromarray(crop_rgb).convert("RGB")

    input_tensor = inference_transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = injury_model(input_tensor)
        probabilities = torch.sigmoid(outputs).cpu().numpy()[0]

    all_results = {}

    for label, probability in zip(LABEL_COLS, probabilities):
        threshold = CLASS_THRESHOLDS[label]

        all_results[label] = {
            "confidence": round(float(probability), 3),
            "threshold": threshold,
            "predicted": bool(probability >= threshold),
        }

    predicted_labels = [
        label for label, data in all_results.items()
        if data["predicted"]
    ]

    # Keep unclear exclusive
    clear_labels = [
        label for label in predicted_labels
        if label != "unclear"
    ]

    if len(clear_labels) > 0:
        predicted_labels = clear_labels
        all_results["unclear"]["predicted"] = False

    detected_labels = [
        {
            "label": label,
            "confidence": all_results[label]["confidence"],
        }
        for label in predicted_labels
    ]

    return detected_labels, all_results


# =====================================================
# Priority Logic
# =====================================================

def calculate_urgency(detected_labels):
    label_names = [item["label"] for item in detected_labels]

    # P3 = Critical
    if "trapped_limb" in label_names:
        return "P3"

    # P2 = High
    if "open_wound" in label_names:
        return "P2"

    if "visible_blood" in label_names:
        return "P2"

    # P1 = Rest
    return "P1"


def build_display_text(detected_labels, urgency):
    if len(detected_labels) == 0:
        return f"no_clear_injury | {urgency}"

    label_parts = []

    for item in detected_labels:
        label_parts.append(
            f"{item['label']} {item['confidence']:.2f}"
        )

    return f"{', '.join(label_parts)} | {urgency}"


def get_box_color(urgency):
    if urgency == "P3":
        return (0, 0, 255)      # red
    elif urgency == "P2":
        return (0, 165, 255)    # orange
    else:
        return (0, 255, 0)      # green


_DrawCmd = dict  # {x1, y1, x2, y2, color, text}


def compute_detections(frame) -> list[_DrawCmd]:
    """Run YOLO + injury inference. Returns draw commands; safe to call from any thread."""
    frame_h, frame_w = frame.shape[:2]
    commands: list[_DrawCmd] = []

    results = person_model(frame, conf=PERSON_CONF_THRESHOLD, verbose=False, device=device)

    for result in results:
        boxes = result.boxes
        if boxes is None:
            continue

        for box in boxes:
            if int(box.cls[0].item()) != PERSON_CLASS_ID:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(frame_w, x2), min(frame_h, y2)

            if (x2 - x1) < MIN_W or (y2 - y1) < MIN_H:
                continue

            crop = frame[y1:y2, x1:x2]
            if crop.size == 0:
                continue

            detected_labels, _ = predict_injury_from_crop(crop)
            urgency      = calculate_urgency(detected_labels)
            display_text = build_display_text(detected_labels, urgency)
            box_color    = get_box_color(urgency)

            commands.append({'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2,
                             'color': box_color, 'text': display_text})
    return commands


def apply_detections(frame, commands: list[_DrawCmd]) -> None:
    """Overlay pre-computed detection boxes onto frame in-place (fast, no ML)."""
    for cmd in commands:
        cv2.rectangle(frame, (cmd['x1'], cmd['y1']), (cmd['x2'], cmd['y2']), cmd['color'], 2)
        cv2.putText(frame, cmd['text'], (cmd['x1'], max(25, cmd['y1'] - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, cmd['color'], 2)


# ---------------------------------------------------------------------------
# Inference worker — runs compute_detections in a dedicated thread so the
# async generator never blocks on ML inference.
# ---------------------------------------------------------------------------

class InferenceWorker:
    def __init__(self, camera: "CameraCapture") -> None:
        self._camera   = camera
        self._commands: list[_DrawCmd] = []
        self._lock     = threading.Lock()
        self._running  = False

    def start(self) -> None:
        self._running = True
        threading.Thread(target=self._loop, daemon=True).start()

    def stop(self) -> None:
        self._running = False

    def _loop(self) -> None:
        _interval = 1.0 / _INFERENCE_FPS
        while self._running:
            t0 = time.monotonic()
            frame = self._camera.raw_frame()
            if frame is None:
                time.sleep(0.033)
                continue
            h, w = frame.shape[:2]
            if w > MAX_STREAM_WIDTH:
                scale = MAX_STREAM_WIDTH / w
                frame = cv2.resize(frame, (MAX_STREAM_WIDTH, int(h * scale)),
                                   interpolation=cv2.INTER_AREA)
            cmds = compute_detections(frame)
            with self._lock:
                self._commands = cmds
            remaining = _interval - (time.monotonic() - t0)
            if remaining > 0:
                time.sleep(remaining)

    def get_commands(self) -> list[_DrawCmd]:
        with self._lock:
            return list(self._commands)


_inference_worker: Optional[InferenceWorker] = None


def start_inference_worker(camera: "CameraCapture") -> None:
    global _inference_worker
    _inference_worker = InferenceWorker(camera)
    _inference_worker.start()


# ---------------------------------------------------------------------------
# Camera capture (background thread)
# ---------------------------------------------------------------------------

class CameraCapture:
    def __init__(self, device: int = 0) -> None:
        self._device = device
        self._raw: Optional[np.ndarray] = None
        self._jpeg: Optional[bytes] = None
        self._processed: Optional[np.ndarray] = None
        self._raw_lock = threading.Lock()
        self._jpeg_lock = threading.Lock()
        self._processed_lock = threading.Lock()
        self._running = False

    def start(self) -> None:
        self._running = True
        threading.Thread(target=self._grab_loop, daemon=True).start()
        threading.Thread(target=self._process_loop, daemon=True).start()

    def stop(self) -> None:
        self._running = False

    def _grab_loop(self) -> None:
        cap = cv2.VideoCapture(self._device)
        if not cap.isOpened():
            print(f"[camera] failed to open device {self._device}")
            cap.release()
            return
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        while self._running:
            ok, frame = cap.read()
            if ok:
                with self._raw_lock:
                    self._raw = frame
            else:
                time.sleep(0.005)
        cap.release()

    def _process_loop(self) -> None:
        _interval = 1.0 / _FPS
        while self._running:
            t0 = time.monotonic()
            with self._raw_lock:
                frame = self._raw
                self._raw = None
            if frame is None:
                time.sleep(0.005)
                continue
            h, w = frame.shape[:2]
            if w > MAX_STREAM_WIDTH:
                scale = MAX_STREAM_WIDTH / w
                frame = cv2.resize(frame, (MAX_STREAM_WIDTH, int(h * scale)), interpolation=cv2.INTER_AREA)
            if _inference_worker is not None:
                apply_detections(frame, _inference_worker.get_commands())
            with self._processed_lock:
                self._processed = frame.copy()
            ret, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
            if ret:
                with self._jpeg_lock:
                    self._jpeg = buf.tobytes()
            remaining = _interval - (time.monotonic() - t0)
            if remaining > 0:
                time.sleep(remaining)

    def raw_frame(self) -> Optional[np.ndarray]:
        with self._raw_lock:
            return self._raw.copy() if self._raw is not None else None

    def latest_jpeg(self) -> Optional[bytes]:
        with self._jpeg_lock:
            return self._jpeg

    def latest_processed(self) -> Optional[np.ndarray]:
        with self._processed_lock:
            return self._processed.copy() if self._processed is not None else None


# ---------------------------------------------------------------------------
# Placeholder frame (no camera)
# ---------------------------------------------------------------------------

def _placeholder_frame() -> bytes:
    """Dark 640x480 placeholder frame for when the camera is absent."""
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    img[:] = (18, 18, 24)
    for x in range(0, 640, 80):
        cv2.line(img, (x, 0), (x, 480), (35, 40, 50), 1)
    for y in range(0, 480, 80):
        cv2.line(img, (0, y), (640, y), (35, 40, 50), 1)
    font = cv2.FONT_HERSHEY_DUPLEX
    cv2.putText(img, "NO SIGNAL", (190, 230), font, 1.4, (80, 90, 110), 2, cv2.LINE_AA)
    cv2.putText(img, "CAM-A / DEVICE OFFLINE", (155, 275), font, 0.55, (55, 65, 80), 1, cv2.LINE_AA)
    _, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 70])
    return buf.tobytes()


_FPS = 30
_INFERENCE_FPS = 5   # ML inference runs at most 5 fps to prevent CPU saturation
