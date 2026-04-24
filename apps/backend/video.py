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

    def jpeg_frame(self) -> Optional[bytes]:
        with self._lock:
            if self._frame is None:
                return None
            ok, buf = cv2.imencode(".jpg", self._frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
            return buf.tobytes() if ok else None


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
        frame = camera.jpeg_frame()
        if frame is None:
            frame = _placeholder_frame()
            await asyncio.sleep(0.1)
        else:
            await asyncio.sleep(interval)
        yield (
            _BOUNDARY
            + b"\r\nContent-Type: image/jpeg\r\nContent-Length: "
            + str(len(frame)).encode()
            + b"\r\n\r\n"
            + frame
            + b"\r\n"
        )


def video_feed_response(camera: CameraCapture) -> StreamingResponse:
    return StreamingResponse(
        mjpeg_generator(camera),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
