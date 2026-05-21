import asyncio
import socket
import numpy as np
import logging
from typing import Optional
from fractions import Fraction
from aiortc import MediaStreamTrack
import av

logger = logging.getLogger("uvicorn.error")

ESP32_IP       = "192.168.1.100"   # Default; user should update as needed
UDP_RECV_PORT  = 5005             # Python listens; ESP32 sends here
UDP_SEND_PORT  = 5006             # Python sends; ESP32 listens here
SAMPLE_RATE    = 8000
PACKET_SAMPLES = 256              # must match ESP32

# One shared socket for receiving from ESP32
_recv_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
_recv_sock.bind(("0.0.0.0", UDP_RECV_PORT))
_recv_sock.setblocking(False)

# One shared socket for sending to ESP32
_send_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

_active_tracks: set[RobotMicTrack] = set()
_broadcast_task: Optional[asyncio.Task] = None

class RobotMicTrack(MediaStreamTrack):
    """
    Reads raw PCM from the ESP32 via UDP and exposes it as a WebRTC audio track.
    aiortc will encode this as Opus automatically before sending to the browser.
    """
    kind = "audio"

    def __init__(self):
        super().__init__()
        self._queue: asyncio.Queue[bytes] = asyncio.Queue(maxsize=30)
        self._pts = 0
        _active_tracks.add(self)
        _ensure_broadcast_task()

    def stop(self):
        super().stop()
        _active_tracks.discard(self)

    def feed(self, data: bytes) -> None:
        """Called by the UDP listener when a packet arrives from ESP32."""
        try:
            self._queue.put_nowait(data)
        except asyncio.QueueFull:
            pass  # drop oldest data rather than blocking

    async def recv(self) -> av.AudioFrame:
        try:
            data = await asyncio.wait_for(self._queue.get(), timeout=0.5)
        except asyncio.TimeoutError:
            # send silence if ESP32 goes quiet (avoids WebRTC stall)
            data = bytes(PACKET_SAMPLES * 2)

        samples = np.frombuffer(data, dtype=np.int16).reshape(1, -1)

        frame = av.AudioFrame.from_ndarray(samples, format="s16", layout="mono")
        frame.pts        = self._pts
        frame.sample_rate = SAMPLE_RATE
        frame.time_base  = Fraction(1, SAMPLE_RATE)
        self._pts       += samples.shape[1]
        return frame


def _ensure_broadcast_task():
    global _broadcast_task
    if _broadcast_task is None or _broadcast_task.done():
        _broadcast_task = asyncio.create_task(_udp_broadcast_loop())


async def _udp_broadcast_loop() -> None:
    """Background task: pumps UDP packets from ESP32 into ALL active WebRTC tracks."""
    loop = asyncio.get_running_loop()
    while True:
        try:
            data = await loop.sock_recv(_recv_sock, PACKET_SAMPLES * 2)
            # Send to all active tracks
            for track in list(_active_tracks):
                track.feed(data)
        except Exception as e:
            logger.error(f"[audio bridge] broadcast error: {e}")
            await asyncio.sleep(0.01)


async def relay_browser_audio_to_esp32(browser_track: MediaStreamTrack) -> None:
    """
    Receives Opus-decoded audio from the browser (at 48kHz), resamples it
    to 8kHz mono 16-bit PCM, and forwards it to the ESP32 via UDP.
    aiortc decodes Opus for us before this function ever sees a frame.
    """
    resampler = av.AudioResampler(format="s16", layout="mono", rate=SAMPLE_RATE)

    while True:
        try:
            frame = await asyncio.wait_for(browser_track.recv(), timeout=1.0)
            for resampled in resampler.resample(frame):
                pcm = resampled.to_ndarray().astype(np.int16).tobytes()
                # Send in PACKET_SAMPLES-sized chunks so ESP32 buffer stays aligned
                for offset in range(0, len(pcm), PACKET_SAMPLES * 2):
                    chunk = pcm[offset : offset + PACKET_SAMPLES * 2]
                    if len(chunk) == PACKET_SAMPLES * 2:
                        _send_sock.sendto(chunk, (ESP32_IP, UDP_SEND_PORT))
        except asyncio.TimeoutError:
            continue
        except Exception as e:
            logger.error(f"[audio bridge] relay error: {e}")
            break
