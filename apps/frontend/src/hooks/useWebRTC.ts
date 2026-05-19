import { useCallback, useEffect, useRef, useState } from 'react';
import { VideoStats } from '../types';

const ICE_TIMEOUT_MS = 6000;

export function useWebRTC() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [connected, setConnected] = useState(false);
  const [videoStats, setVideoStats] = useState<VideoStats | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const mountedRef = useRef(true);
  const prevBytesRef = useRef<number>(0);
  // Tracks cumulative inbound-rtp fields needed for per-interval deltas
  const prevRtpRef = useRef({ jbd: 0, jbc: 0, tdt: 0, fd: 0 });

  const connect = useCallback(async () => {
    if (!mountedRef.current) return;

    prevBytesRef.current = 0;
    prevRtpRef.current = { jbd: 0, jbc: 0, tdt: 0, fd: 0 };

    const pc = new RTCPeerConnection({ iceServers: [] }); // LAN: no STUN needed
    pcRef.current = pc;

    pc.ontrack = (event) => {
      if (!mountedRef.current) return;
      const [stream] = event.streams;
      if (videoRef.current && stream) videoRef.current.srcObject = stream;
    };

    pc.onconnectionstatechange = () => {
      if (!mountedRef.current) return;
      const s = pc.connectionState;
      setConnected(s === 'connected');
      if (s === 'failed' || s === 'closed' || s === 'disconnected') {
        setVideoStats(null);
        setTimeout(() => { if (mountedRef.current) connect(); }, 3000);
      }
    };

    const statsInterval = setInterval(async () => {
      if (!mountedRef.current || pc.connectionState !== 'connected') return;
      const reports = await pc.getStats();

      let fps = 0, bytes = 0, total_frames = 0;
      let jbd = 0, jbc = 0, tdt = 0, fd = 0;
      let networkRtt: number | null = null;

      reports.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          fps          = Math.round(report.framesPerSecond ?? 0);
          bytes        = report.bytesReceived ?? 0;
          total_frames = report.framesDecoded ?? 0;
          jbd          = report.jitterBufferDelay ?? 0;
          jbc          = report.jitterBufferEmittedCount ?? 0;
          tdt          = report.totalDecodeTime ?? 0;
          fd           = report.framesDecoded ?? 0;
        } else if (report.type === 'candidate-pair' && report.nominated === true) {
          networkRtt = report.currentRoundTripTime ?? null;
        }
      });

      const kbps = Math.max(0, Math.round((bytes - prevBytesRef.current) / 1024));
      prevBytesRef.current = bytes;

      // Per-interval averages using cumulative deltas to reflect current conditions
      const prev = prevRtpRef.current;
      const jbc_d = jbc - prev.jbc;
      const fd_d  = fd  - prev.fd;
      const jitter_ms = jbc_d > 0 ? ((jbd - prev.jbd) / jbc_d) * 1000 : 0;
      const decode_ms = fd_d  > 0 ? ((tdt - prev.tdt) / fd_d)  * 1000 : 0;
      prevRtpRef.current = { jbd, jbc, tdt, fd };

      // network (RTT/2) + jitter buffer + decode — capture & encode on sender are not measurable here
      const latency_ms = networkRtt != null
        ? Math.round(networkRtt * 500 + jitter_ms + decode_ms)
        : null;

      if (mountedRef.current) setVideoStats({ fps, kbps, total_frames, total_kb: Math.round(bytes / 1024), latency_ms });
    }, 1000);

    pc.addTransceiver('video', { direction: 'recvonly' });
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Non-trickle: wait for all ICE candidates before sending offer (fast on LAN, ~<200ms)
    await new Promise<void>((resolve) => {
      if (pc.iceGatheringState === 'complete') { resolve(); return; }
      const t = setTimeout(resolve, ICE_TIMEOUT_MS);
      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') { clearTimeout(t); resolve(); }
      };
    });

    if (!mountedRef.current) { pc.close(); return; }

    try {
      const res = await fetch('/webrtc/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sdp: pc.localDescription!.sdp, type: pc.localDescription!.type }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const answer = await res.json();
      if (!mountedRef.current) { pc.close(); return; }
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (err) {
      console.error('[useWebRTC] offer failed:', err);
      clearInterval(statsInterval);
      pc.close();
      if (mountedRef.current) setTimeout(connect, 3000);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      pcRef.current?.close();
      pcRef.current = null;
    };
  }, [connect]);

  return { videoRef, connected, videoStats };
}
