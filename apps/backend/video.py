"""
Video streaming module — MJPEG over HTTP.

Uses an async generator so the event loop is never blocked, which prevents
the stream from stalling after a period of inactivity.
"""
from __future__ import annotations

import asyncio
import threading
import time
from typing import Optional

import cv2
import numpy as np
from fastapi.responses import StreamingResponse

import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from ultralytics import YOLO
from PIL import Image


# =====================================================
# Configuration
# =====================================================

YOLO_MODEL_PATH = "../multi-label_classifier/yolov8n.pt"
INJURY_MODEL_PATH = "../multi-label_classifier/best_injury_multilabel_resnet18.pth"

PERSON_CLASS_ID = 0
PERSON_CONF_THRESHOLD = 0.5

MIN_W = 40
MIN_H = 60

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

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

person_model = YOLO(YOLO_MODEL_PATH)

injury_model = models.resnet18(weights=None)
in_features = injury_model.fc.in_features
injury_model.fc = nn.Linear(in_features, len(LABEL_COLS))

injury_model.load_state_dict(
    torch.load(INJURY_MODEL_PATH, map_location=device)
)

injury_model = injury_model.to(device)
injury_model.eval()

print("Models loaded successfully.")


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


def process_frame(frame):
    frame_h, frame_w = frame.shape[:2]

    results = person_model(
        frame,
        conf=PERSON_CONF_THRESHOLD,
        verbose=False
    )

    for result in results:
        boxes = result.boxes

        if boxes is None:
            continue

        for box in boxes:
            cls_id = int(box.cls[0].item())
            person_conf = float(box.conf[0].item())

            if cls_id != PERSON_CLASS_ID:
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

            person_crop = frame[y1:y2, x1:x2]

            if person_crop.size == 0:
                continue

            detected_labels, all_results = predict_injury_from_crop(person_crop)

            urgency = calculate_urgency(detected_labels)

            display_text = build_display_text(detected_labels, urgency)

            box_color = get_box_color(urgency)

            # Draw box around the person
            cv2.rectangle(
                frame,
                (x1, y1),
                (x2, y2),
                box_color,
                2
            )

            # Draw label background
            text_x = x1
            text_y = max(25, y1 - 10)

            cv2.putText(
                frame,
                display_text,
                (text_x, text_y),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                box_color,
                2
            )

    return frame


# ---------------------------------------------------------------------------
# Camera capture (background thread)
# ---------------------------------------------------------------------------

class CameraCapture:
    def __init__(self, device: int = 0) -> None:
        self._device = device
        self._frame: Optional[np.ndarray] = None
        self._lock = threading.Lock()
        self._running = False

    def start(self) -> None:
        self._running = True
        t = threading.Thread(target=self._loop, daemon=True)
        t.start()

    def stop(self) -> None:
        self._running = False

    def _loop(self) -> None:
        cap = cv2.VideoCapture(self._device)
        if not cap.isOpened():
            cap.release()
            return
        while self._running:
            ok, frame = cap.read()
            if ok:
                with self._lock:
                    self._frame = frame
            else:
                time.sleep(0.033)
        cap.release()

    def raw_frame(self) -> Optional[np.ndarray]:
        with self._lock:
            if self._frame is None:
                return None
            return self._frame.copy()


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


# ---------------------------------------------------------------------------
# Async MJPEG generator
#
# Using an async generator instead of a sync one is the key fix:
# time.sleep() in a sync generator starves the ASGI event loop, causing the
# stream to stall after a while. asyncio.sleep() yields control correctly.
# ---------------------------------------------------------------------------

_BOUNDARY = b"--frame"
_FPS = 30


async def mjpeg_generator(camera: CameraCapture):
    interval = 1 / _FPS
    while True:
        frame = camera.raw_frame()
        if frame is None:
            frame_bytes = _placeholder_frame()
            await asyncio.sleep(0.1)
        else:
            processed_frame = process_frame(frame)
            ok, buf = cv2.imencode(".jpg", processed_frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
            frame_bytes = buf.tobytes() if ok else _placeholder_frame()
            await asyncio.sleep(interval)
        yield (
            _BOUNDARY
            + b"\r\nContent-Type: image/jpeg\r\nContent-Length: "
            + str(len(frame_bytes)).encode()
            + b"\r\n\r\n"
            + frame_bytes
            + b"\r\n"
        )


def video_feed_response(camera: CameraCapture) -> StreamingResponse:
    return StreamingResponse(
        mjpeg_generator(camera),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
