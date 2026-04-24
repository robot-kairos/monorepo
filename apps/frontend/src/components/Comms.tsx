import { useCallback, useEffect, useState } from 'react';
import { Accent, ACCENTS, WsOutMessage } from '../types';
import { Panel } from './Panel';

function pillBtn(active: boolean, accent: Accent): React.CSSProperties {
  return {
    fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.15em',
    padding: '6px 10px', borderRadius: 3, cursor: 'pointer',
    background: active ? `${ACCENTS[accent]}22` : 'rgba(20,22,28,0.6)',
    color: active ? ACCENTS[accent] : 'var(--fg)',
    border: `1px solid ${active ? ACCENTS[accent] : 'var(--line)'}`,
  };
}

function Slider({ label, value, onChange, accent }: { label: string; value: number; onChange: (v: number) => void; accent: Accent }) {
  return (
    <label style={{ display: 'block', fontFamily: 'var(--mono)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, letterSpacing: '0.2em', color: 'var(--fg-mute)', marginBottom: 4 }}>
        <span>{label}</span><span>{value}%</span>
      </div>
      <div style={{ position: 'relative', height: 6, background: 'var(--bg-3)', borderRadius: 3, border: '1px solid var(--line-soft)' }}>
        <div style={{ position: 'absolute', inset: 0, width: `${value}%`, background: ACCENTS[accent], borderRadius: 3, boxShadow: `0 0 8px ${ACCENTS[accent]}66` }} />
        <input
          type="range" min="0" max="100" value={value}
          onChange={(e) => onChange(+e.target.value)}
          style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer' }}
        />
      </div>
    </label>
  );
}

function MicIcon({ on }: { on: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={on ? '#161616' : 'currentColor'} strokeWidth="2">
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
    </svg>
  );
}

interface CommsProps {
  accent: Accent;
  send: (msg: WsOutMessage) => void;
}

const BARS = 28;

export function Comms({ accent, send }: CommsProps) {
  const [talking, setTalking] = useState(false);
  const [level, setLevel] = useState(0);
  const [muted, setMuted] = useState(false);
  const [micGain, setMicGain] = useState(72);
  const [downVol, setDownVol] = useState(60);

  // VU meter animation
  useEffect(() => {
    let raf: number;
    const tick = () => {
      setLevel(talking ? 0.4 + Math.random() * 0.6 : Math.random() * 0.08);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [talking]);

  const startTalk = useCallback(() => {
    setTalking(true);
    send({ type: 'ptt_start' });
  }, [send]);

  const stopTalk = useCallback(() => {
    setTalking(false);
    send({ type: 'ptt_stop' });
  }, [send]);

  // Spacebar PTT
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !(e.target as HTMLElement).matches?.('input,textarea')) {
        e.preventDefault(); startTalk();
      }
    };
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') stopTalk(); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [startTalk, stopTalk]);

  return (
    <Panel
      id="MOD-04"
      title="Comms · Push to Talk"
      statusTone={talking ? 'amber' : 'green'}
      status={talking ? 'TX' : 'STBY'}
      right={<span style={{ color: 'var(--fg-mute)' }}>OPUS 48k · −22 dBFS</span>}
      style={{ gridColumn: 'span 4' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {/* VU meter */}
        <div style={{
          display: 'flex', gap: 3, height: 54, padding: '8px 10px',
          background: 'var(--bg-1)', border: '1px solid var(--line-soft)', borderRadius: 3,
          alignItems: 'flex-end',
        }}>
          {Array.from({ length: BARS }, (_, i) => {
            const threshold = (i + 1) / BARS;
            const on = level > threshold * 0.9;
            const color = i > BARS * 0.8 ? 'var(--red)' : i > BARS * 0.6 ? ACCENTS[accent] : 'var(--green)';
            return (
              <div key={i} style={{
                flex: 1,
                height: on ? `${10 + threshold * 80}%` : '12%',
                background: on ? color : 'var(--bg-3)',
                borderRadius: 1,
                transition: 'all 60ms linear',
              }} />
            );
          })}
        </div>

        {/* PTT button */}
        <button
          onMouseDown={startTalk}
          onMouseUp={stopTalk}
          onMouseLeave={stopTalk}
          onTouchStart={startTalk}
          onTouchEnd={stopTalk}
          style={{
            cursor: 'pointer',
            padding: '18px 14px',
            borderRadius: 6,
            background: talking
              ? `linear-gradient(180deg, ${ACCENTS[accent]}, oklch(0.55 0.15 75))`
              : 'linear-gradient(180deg, var(--bg-3), var(--bg-2))',
            border: `1px solid ${talking ? ACCENTS[accent] : 'var(--line)'}`,
            color: talking ? '#161616' : 'var(--fg)',
            fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: '0.2em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            boxShadow: talking ? `0 0 24px ${ACCENTS[accent]}66, inset 0 0 0 1px rgba(255,255,255,0.15)` : 'none',
            transition: 'all 120ms ease',
          }}
        >
          <MicIcon on={talking} />
          <span style={{ fontSize: 13 }}>{talking ? 'TRANSMITTING' : 'HOLD TO TALK'}</span>
        </button>

        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-mute)', letterSpacing: '0.2em', textAlign: 'center' }}>
          ⎵ SPACEBAR · PRESS AND HOLD
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
          <Slider label="MIC GAIN"    value={micGain} onChange={setMicGain} accent={accent} />
          <Slider label="DOWNLINK VOL" value={downVol} onChange={setDownVol} accent={accent} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setMuted((m) => !m)} style={pillBtn(muted, accent)}>
              {muted ? 'UNMUTE' : 'MUTE MIC'}
            </button>
            <button style={pillBtn(false, accent)}>NOISE SUPPR · ON</button>
          </div>
        </div>
      </div>
    </Panel>
  );
}
