"""
Survivor Search Console — Backend
- GET /video  : MJPEG webcam stream (falls back to placeholder if no camera)
- WS  /ws     : Real-time sensor state + command bus
"""
from __future__ import annotations

import asyncio
import json
import logging
import threading
from typing import Optional

logger = logging.getLogger("uvicorn.error")

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from video import CameraCapture, video_feed_response

try:
    import rclpy
    from rclpy.node import Node
    from rclpy.qos import QoSPresetProfiles
    from std_msgs.msg import Bool
    from robot_interfaces.msg import RadarVitals, AudioCommand, Temperature
    _ROS2_IMPORTS_OK = True
except ImportError:
    _ROS2_IMPORTS_OK = False

# Set to True only after ROS2 node successfully initializes and subscribes
ROS2_AVAILABLE = False

class SensorState:
    def __init__(self) -> None:
        self._lock = threading.Lock()

        # radar
        self.hr: Optional[float] = None
        self.br: Optional[float] = None
        self.distance: Optional[float] = None

        # thermometer
        self.temp_ambient: Optional[float] = None
        self.temp_object: Optional[float] = None

        # df mini
        self.playing: Optional[str] = None

    def as_state_msg(self) -> str:
        # Round data or return None
        def r(v: Optional[float], n: int) -> Optional[float]:
            return round(v, n) if v is not None else None

        with self._lock:
            return json.dumps({
                "type": "state",
                "online": ROS2_AVAILABLE,
                "temperature": {
                    "ambient": r(self.temp_ambient, 1),
                    "object": r(self.temp_object, 1),
                },
                "vitals": {
                    "hr":       r(self.hr,       1),
                    "br":       r(self.br,       1),
                    "distance": r(self.distance, 2),
                },
            })


# ---------------------------------------------------------------------------
# ROS 2 Bridge (background thread)
# ---------------------------------------------------------------------------

_bridge = None


if _ROS2_IMPORTS_OK:
    class RobotBridge(Node):
        def __init__(self, sensor: SensorState) -> None:
            super().__init__('console_bridge')
            self._s = sensor
            QOS = QoSPresetProfiles.SENSOR_DATA.value

            self.create_subscription(Temperature, '/robot/sensors/temperature', self._on_temp,   QOS)
            self.create_subscription(RadarVitals, '/robot/radar/vitals',        self._on_vitals, QOS)

            self._audio_pub = self.create_publisher(AudioCommand, '/robot/audio/command', 10)
            self._ptt_pub   = self.create_publisher(Bool,         '/robot/ptt/state',     10)

        def _on_temp(self, msg: Temperature):
            with self._s._lock:
                self._s.temp_ambient = msg.temp_ambient
                self._s.temp_object = msg.temp_object

        def _on_vitals(self, msg: RadarVitals):
            with self._s._lock:
                self._s.hr       = msg.heart_rate
                self._s.br       = msg.breath_rate
                self._s.distance = msg.target_distance

        def publish_audio_command(self, action: str, track_id: str = '') -> None:
            msg = AudioCommand()
            msg.action   = action
            msg.track_id = track_id
            self._audio_pub.publish(msg)

        def publish_ptt(self, active: bool) -> None:
            msg = Bool()
            msg.data = active
            self._ptt_pub.publish(msg)


def _ros_spin_thread(sensor_state: SensorState) -> None:
    global _bridge, ROS2_AVAILABLE
    if not _ROS2_IMPORTS_OK:
        logger.warning("ROS2 not available — running without robot bridge")
        return
    try:
        rclpy.init()
        _bridge = RobotBridge(sensor_state)
        ROS2_AVAILABLE = True
        rclpy.spin(_bridge)
    except Exception as e:
        logger.error("ROS2 bridge failed: %s", e)
    finally:
        ROS2_AVAILABLE = False
        if _bridge is not None:
            _bridge.destroy_node()
            _bridge = None
        rclpy.shutdown()


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


async def broadcast_loop() -> None:
    while True:
        await manager.broadcast(sensor.as_state_msg())
        await asyncio.sleep(0.5)


def _log_msg(lvl: str, text: str) -> str:
    from datetime import datetime, timezone
    t = datetime.now(timezone.utc).strftime("%H:%M:%SZ")
    return json.dumps({"type": "log", "entry": {"t": t, "lvl": lvl, "m": text}})


app = FastAPI(title="Survivor Search Console API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    camera.start()
    t = threading.Thread(target=_ros_spin_thread, args=(sensor,), daemon=True)
    t.start()
    asyncio.create_task(broadcast_loop())


@app.on_event("shutdown")
async def on_shutdown() -> None:
    camera.stop()


@app.get("/video")
def video_feed():
    return video_feed_response(camera)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    await websocket.send_text(sensor.as_state_msg())
    await websocket.send_text(_log_msg("INFO", "Console connected — SENTRY system online"))
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            mtype = msg.get("type")
            if mtype == "ptt_start":
                if _bridge:
                    _bridge.publish_ptt(True)
                await websocket.send_text(_log_msg("INFO", "PTT ACTIVE — uplink open"))
            elif mtype == "ptt_stop":
                if _bridge:
                    _bridge.publish_ptt(False)
                await websocket.send_text(_log_msg("INFO", "PTT released — uplink closed"))
            elif mtype == "play_sound":
                sid = msg.get("id", "")
                with sensor._lock:
                    sensor.playing = sid
                if _bridge:
                    _bridge.publish_audio_command("play", sid)
                await websocket.send_text(
                    _log_msg("INFO", f"Audio payload {sid} dispatched to DF player")
                )
                await manager.broadcast(sensor.as_state_msg())
            elif mtype == "stop_sound":
                with sensor._lock:
                    sensor.playing = None
                if _bridge:
                    _bridge.publish_audio_command("stop")
                await websocket.send_text(_log_msg("INFO", "DF player Audio playback stopped"))
                await manager.broadcast(sensor.as_state_msg())
    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(websocket)
