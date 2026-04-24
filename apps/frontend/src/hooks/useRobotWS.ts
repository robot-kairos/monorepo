import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_STATE, LogEntry, RobotState, WsOutMessage } from '../types';

const WS_URL = `ws://${window.location.hostname}:8000/ws`;

export function useRobotWS() {
  const [state, setState] = useState<RobotState>(DEFAULT_STATE);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (mountedRef.current) setConnected(true);
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      retryRef.current = setTimeout(connect, 2000);
    };

    ws.onerror = () => ws.close();

    ws.onmessage = (ev) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(ev.data as string) as Record<string, unknown>;
        if (msg.type === 'state') {
          setState({
            temperature: msg.temperature as RobotState['temperature'],
            vitals: msg.vitals as RobotState['vitals'],
            playing: msg.playing as string | null,
          });
        } else if (msg.type === 'log') {
          setLog((prev) => [msg.entry as LogEntry, ...prev].slice(0, 50));
        }
      } catch {
        // malformed message — ignore
      }
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((msg: WsOutMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { state, log, send, connected };
}
