"""
Kairos — Backend
- POST /webrtc/offer : WebRTC signaling (SDP offer/answer)
- WS  /ws            : Real-time sensor state broadcast
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import threading

from dotenv import load_dotenv
load_dotenv()
from typing import Optional

import httpx

logger = logging.getLogger("uvicorn.error")

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from video import CameraCapture
from inference import start_inference_worker
from webrtc_video import handle_offer, shutdown_all_peers

ESP32_IP_ADDR = os.environ["ESP32_IP_ADDR"]


class SensorState:
    def __init__(self) -> None:
        self._lock = threading.Lock()

        self.hr: Optional[float] = None
        self.br: Optional[float] = None
        self.distance: Optional[float] = None

        self.temp_ambient: Optional[float] = None
        self.temp_object: Optional[float] = None

        self.online: bool = False

    def as_state_msg(self) -> str:
        def r(v: Optional[float], n: int) -> Optional[float]:
            return round(v, n) if v is not None else None

        with self._lock:
            return json.dumps({
                "type": "state",
                "online": self.online,
                "temperature": {
                    "ambient": r(self.temp_ambient, 1),
                    "object":  r(self.temp_object,  1),
                },
                "vitals": {
                    "hr":       r(self.hr,       1),
                    "br":       r(self.br,       1),
                    "distance": r(self.distance, 2),
                },
            })


# ---------------------------------------------------------------------------
# WebSocket connection manager
# ---------------------------------------------------------------------------

class ConnectionManager:
    def __init__(self) -> None:
        self._clients: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._clients.add(ws)

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            self._clients.discard(ws)

    async def broadcast(self, message: str) -> None:
        dead: list[WebSocket] = []
        async with self._lock:
            clients = list(self._clients)
        for ws in clients:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        if dead:
            async with self._lock:
                for ws in dead:
                    self._clients.discard(ws)


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

camera = CameraCapture(device=0)
sensor = SensorState()
manager = ConnectionManager()


async def poll_and_broadcast() -> None:
    async with httpx.AsyncClient() as client:
        while True:
            try:
                resp = await client.get(f"http://{ESP32_IP_ADDR}/data", timeout=1.0)
                data = resp.json()
                with sensor._lock:
                    sensor.temp_ambient = None
                    sensor.temp_object  = float(data["TempSensorVal"])
                    sensor.hr           = float(data["HeartRateVal"])
                    sensor.br           = float(data["BreathRateVal"])
                    sensor.distance     = float(data["DistanceVal"])
                    sensor.online       = True
            except Exception as e:
                logger.debug("Sensor poll failed: %s", e)
                with sensor._lock:
                    sensor.online = False
            await manager.broadcast(sensor.as_state_msg())
            await asyncio.sleep(0.5)


def _log_msg(lvl: str, text: str) -> str:
    from datetime import datetime, timezone
    t = datetime.now(timezone.utc).strftime("%H:%M:%SZ")
    return json.dumps({"type": "log", "entry": {"t": t, "lvl": lvl, "m": text}})


app = FastAPI(title="Kairos API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    camera.start()
    worker = start_inference_worker(camera)
    camera.commands_provider = worker.get_commands
    asyncio.create_task(poll_and_broadcast())


@app.on_event("shutdown")
async def on_shutdown() -> None:
    camera.stop()
    await shutdown_all_peers()


class WebRTCOffer(BaseModel):
    sdp: str
    type: str


@app.post("/webrtc/offer")
async def webrtc_offer(offer: WebRTCOffer):
    return await handle_offer(offer.sdp, offer.type, camera)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    await websocket.send_text(sensor.as_state_msg())
    await websocket.send_text(_log_msg("INFO", "Kairos online"))
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(websocket)
