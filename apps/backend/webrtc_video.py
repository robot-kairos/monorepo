from __future__ import annotations

import asyncio
import logging
from typing import Optional

import av
import cv2
import numpy as np
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.mediastreams import VideoStreamTrack

from video import CameraCapture, _placeholder_frame
from audio_bridge import RobotMicTrack, relay_browser_audio_to_esp32

logger = logging.getLogger("uvicorn.error")

_peer_connections: set[RTCPeerConnection] = set()
_lock = asyncio.Lock()


class RobotVideoTrack(VideoStreamTrack):
    kind = "video"

    def __init__(self, camera: CameraCapture) -> None:
        super().__init__()
        self._camera = camera

    async def recv(self) -> av.VideoFrame:
        pts, time_base = await self.next_timestamp()
        loop = asyncio.get_event_loop()
        frame_bgr: Optional[np.ndarray] = await loop.run_in_executor(
            None, self._camera.latest_processed
        )
        if frame_bgr is None:
            buf = np.frombuffer(_placeholder_frame(), dtype=np.uint8)
            frame_bgr = cv2.imdecode(buf, cv2.IMREAD_COLOR)
        vf = av.VideoFrame.from_ndarray(frame_bgr, format="bgr24")
        vf.pts = pts
        vf.time_base = time_base
        return vf


async def handle_offer(sdp: str, type_: str, camera: CameraCapture) -> dict:
    pc = RTCPeerConnection()
    async with _lock:
        _peer_connections.add(pc)

    @pc.on("connectionstatechange")
    async def on_state() -> None:
        logger.info("WebRTC peer state: %s", pc.connectionState)
        if pc.connectionState in ("failed", "closed"):
            await pc.close()
            async with _lock:
                _peer_connections.discard(pc)

    # Add video track
    pc.addTrack(RobotVideoTrack(camera))

    # Add audio track (Robot Mic -> Browser)
    robot_mic = RobotMicTrack()
    pc.addTrack(robot_mic)

    # Handle incoming audio (Browser Mic -> ESP32)
    @pc.on("track")
    def on_track(track):
        if track.kind == "audio":
            asyncio.create_task(relay_browser_audio_to_esp32(track))

    await pc.setRemoteDescription(RTCSessionDescription(sdp=sdp, type=type_))
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    gather_done = asyncio.Event()

    @pc.on("icegatheringstatechange")
    def on_ice() -> None:
        if pc.iceGatheringState == "complete":
            gather_done.set()

    if pc.iceGatheringState == "complete":
        gather_done.set()

    try:
        await asyncio.wait_for(gather_done.wait(), timeout=5.0)
    except asyncio.TimeoutError:
        logger.warning("ICE gathering timed out — returning partial candidates")

    return {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}


async def shutdown_all_peers() -> None:
    async with _lock:
        pcs = list(_peer_connections)
    for pc in pcs:
        await pc.close()
    async with _lock:
        _peer_connections.clear()
    logger.info("Closed %d WebRTC peer connection(s)", len(pcs))
