"""Video capture and frame processing module."""
from __future__ import annotations

import threading
import time
from typing import Callable, Optional

import logging

import cv2
import numpy as np

from inference import _DrawCmd

logger = logging.getLogger("uvicorn.error")


# =====================================================
# Configuration
# =====================================================

MAX_STREAM_WIDTH = 640   # resize before encode (saves bandwidth)
JPEG_QUALITY     = 55    # down from 75 — acceptable for monitoring, ~35% smaller frames

_FPS = 30


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
        self.commands_provider: Optional[Callable[[], list[_DrawCmd]]] = None

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
            if self.commands_provider is not None:
                apply_detections(frame, self.commands_provider())
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
# Rendering
# ---------------------------------------------------------------------------

def apply_detections(frame, commands: list[_DrawCmd]) -> None:
    """Overlay pre-computed detection boxes onto frame in-place (fast, no ML)."""
    for cmd in commands:
        cv2.rectangle(frame, (cmd['x1'], cmd['y1']), (cmd['x2'], cmd['y2']), cmd['color'], 2)
        cv2.putText(frame, cmd['text'], (cmd['x1'], max(25, cmd['y1'] - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, cmd['color'], 2)


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
