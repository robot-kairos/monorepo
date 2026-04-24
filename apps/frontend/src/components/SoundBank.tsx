import { useEffect, useMemo, useState } from 'react';
import { Accent, ACCENTS, WsOutMessage } from '../types';
import { Panel } from './Panel';

const SOUNDS = [
  { id: 'S-01', name: 'Rescue team inbound — stay calm',                     dur: '0:06', lang: 'EN', tag: 'REASSURE' },
  { id: 'S-02', name: 'Equipo de rescate en camino — mantenga la calma',     dur: '0:07', lang: 'ES', tag: 'REASSURE' },
  { id: 'S-03', name: 'If you can hear this, knock twice on any surface',    dur: '0:05', lang: 'EN', tag: 'RESPOND'  },
  { id: 'S-04', name: "Si vous m'entendez, frappez deux fois",               dur: '0:05', lang: 'FR', tag: 'RESPOND'  },
  { id: 'S-05', name: 'Do not move — stabilization inbound',                 dur: '0:04', lang: 'EN', tag: 'INSTRUCT' },
  { id: 'S-06', name: 'Locator beacon — 1 kHz tone (10s)',                   dur: '0:10', lang: '—',  tag: 'BEACON'   },
  { id: 'S-07', name: 'Water delivery drop warning',                         dur: '0:06', lang: 'EN', tag: 'WARN'     },
  { id: 'S-08', name: 'Please respond — rescue team',                        dur: '0:08', lang: 'EN', tag: 'RESPOND'  },
] as const;

type SoundId = (typeof SOUNDS)[number]['id'];

function parseDur(dur: string): number {
  const [m = '0', s = '0'] = dur.split(':');
  return parseInt(m) * 60 + parseInt(s);
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.15em',
      padding: '3px 8px', border: '1px solid var(--line)', borderRadius: 2, color: 'var(--fg-dim)',
    }}>
      {children}
    </span>
  );
}

function Waveform({ progress, accent }: { progress: number; accent: Accent }) {
  const bars = 48;
  const heights = useMemo(
    () => Array.from({ length: bars }, (_, i) => 0.25 + 0.75 * Math.abs(Math.sin(i * 1.3) + Math.sin(i * 0.7) * 0.6) / 1.6),
    [],
  );
  return (
    <div style={{
      display: 'flex', gap: 2, height: 48, alignItems: 'center',
      padding: '4px 8px', background: 'var(--bg-2)', border: '1px solid var(--line-soft)', borderRadius: 3,
    }}>
      {heights.map((h, i) => {
        const active = i / bars <= progress;
        return (
          <div key={i} style={{
            flex: 1, height: `${h * 100}%`,
            background: active ? ACCENTS[accent] : 'var(--bg-3)',
            borderRadius: 1, transition: 'background 80ms linear',
          }} />
        );
      })}
    </div>
  );
}

function PlayIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3 L20 12 L5 21 Z" /></svg>;
}
function StopIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" /></svg>;
}

interface SoundBankProps {
  accent: Accent;
  serverPlaying: string | null;
  send: (msg: WsOutMessage) => void;
}

export function SoundBank({ accent, serverPlaying, send }: SoundBankProps) {
  const [selected, setSelected] = useState<SoundId>('S-01');
  const [progress, setProgress] = useState(0);

  // Track local playing state — start animation when serverPlaying matches selected
  const playing = serverPlaying === selected ? selected : null;

  useEffect(() => {
    if (!playing) { setProgress(0); return; }
    const sound = SOUNDS.find((s) => s.id === playing);
    if (!sound) return;
    const durMs = parseDur(sound.dur) * 1000;
    const start = performance.now();
    let raf: number;
    const tick = (tp: number) => {
      const p = (tp - start) / durMs;
      if (p >= 1) { setProgress(0); return; }
      setProgress(p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const sel = SOUNDS.find((s) => s.id === selected)!;
  const isPlayingSel = serverPlaying === selected;

  const handlePlayStop = () => {
    if (isPlayingSel) {
      send({ type: 'stop_sound' });
    } else {
      send({ type: 'play_sound', id: selected });
    }
  };

  return (
    <Panel
      id="MOD-05"
      title="Audio Payload · Pre-recorded"
      statusTone={serverPlaying ? 'amber' : 'green'}
      status={serverPlaying ? 'PLAYING' : 'READY'}
      right={<span style={{ color: 'var(--fg-mute)' }}>SPK-01 · 92 dB · LINE OUT</span>}
      style={{ gridColumn: 'span 8' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14, flex: 1, minHeight: 0 }}>
        {/* Track list */}
        <div style={{
          background: 'var(--bg-1)', border: '1px solid var(--line-soft)', borderRadius: 4,
          display: 'flex', flexDirection: 'column', minHeight: 260, overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '60px 1fr 60px 90px 50px',
            padding: '8px 12px', borderBottom: '1px solid var(--line-soft)',
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--fg-mute)',
          }}>
            <span>ID</span><span>TRACK</span><span>LANG</span><span>TAG</span>
            <span style={{ textAlign: 'right' }}>DUR</span>
          </div>
          <div style={{ overflow: 'auto', flex: 1 }}>
            {SOUNDS.map((s) => {
              const isSel = s.id === selected;
              const isPl = s.id === serverPlaying;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  style={{
                    width: '100%', textAlign: 'left', cursor: 'pointer',
                    display: 'grid', gridTemplateColumns: '60px 1fr 60px 90px 50px',
                    padding: '10px 12px',
                    background: isSel ? `${ACCENTS[accent]}14` : 'transparent',
                    border: 'none',
                    borderLeft: isSel ? `2px solid ${ACCENTS[accent]}` : '2px solid transparent',
                    borderBottom: '1px solid var(--line-soft)',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: isSel ? ACCENTS[accent] : 'var(--fg-mute)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isPl && <span style={{ width: 6, height: 6, borderRadius: 10, background: ACCENTS[accent], animation: 'sk-pulse 1s ease-in-out infinite' }} />}
                    {s.id}
                  </span>
                  <span style={{ fontSize: 13, color: isSel ? 'var(--fg)' : 'var(--fg-dim)' }}>{s.name}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-mute)' }}>{s.lang}</span>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.15em', color: 'var(--fg-dim)',
                    border: '1px solid var(--line)', borderRadius: 2, padding: '2px 6px', width: 'fit-content',
                  }}>{s.tag}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-mute)', textAlign: 'right' }}>{s.dur}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Player */}
        <div style={{
          background: 'var(--bg-1)', border: '1px solid var(--line-soft)', borderRadius: 4,
          padding: 14, display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--fg-mute)' }}>NOW SELECTED</div>
          <div style={{ fontSize: 15, color: 'var(--fg)', minHeight: 40, lineHeight: 1.3 }}>{sel.name}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Chip>{sel.id}</Chip>
            <Chip>{sel.lang}</Chip>
            <Chip>{sel.tag}</Chip>
            <Chip>{sel.dur}</Chip>
          </div>
          <Waveform progress={isPlayingSel ? progress : 0} accent={accent} />
          <button
            onClick={handlePlayStop}
            style={{
              cursor: 'pointer',
              padding: '14px 18px',
              borderRadius: 4,
              background: isPlayingSel
                ? 'linear-gradient(180deg, var(--red), oklch(0.5 0.18 25))'
                : `linear-gradient(180deg, ${ACCENTS[accent]}, oklch(0.55 0.15 75))`,
              border: 'none',
              color: '#121212',
              fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: '0.22em', fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: isPlayingSel ? '0 0 18px oklch(0.5 0.18 25 / 0.5)' : `0 0 14px ${ACCENTS[accent]}55`,
              marginTop: 'auto',
            }}
          >
            {isPlayingSel ? <StopIcon /> : <PlayIcon />}
            {isPlayingSel ? 'STOP PLAYBACK' : 'PLAY ON ROBOT'}
          </button>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-mute)', letterSpacing: '0.2em', textAlign: 'center' }}>
            {isPlayingSel ? `PLAYING · ${(progress * 100).toFixed(0)}%` : 'READY TO TRANSMIT'}
          </div>
        </div>
      </div>
    </Panel>
  );
}
