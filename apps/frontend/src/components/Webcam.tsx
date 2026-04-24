import { useEffect, useRef, useState } from 'react';
import { Accent, ACCENTS } from '../types';
import { Panel } from './Panel';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function pillBtn(active: boolean, accent: Accent): React.CSSProperties {
  return {
    fontFamily: 'var(--mono)',
    fontSize: 11,
    letterSpacing: '0.15em',
    padding: '6px 10px',
    borderRadius: 3,
    cursor: 'pointer',
    background: active ? `${ACCENTS[accent]}22` : 'rgba(20,22,28,0.6)',
    color: active ? ACCENTS[accent] : 'var(--fg)',
    border: `1px solid ${active ? ACCENTS[accent] : 'var(--line)'}`,
  };
}

/** Canvas simulation shown when the backend video endpoint is unreachable */
function FallbackCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = 900, H = 520;
    c.width = W * 2; c.height = H * 2;
    c.style.width = '100%'; c.style.height = '100%';
    ctx.scale(2, 2);
    let raf: number;

    function draw(t: number) {
      ctx.fillStyle = '#0b0d12';
      ctx.fillRect(0, 0, W, H);

      // grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        const y = H * 0.55 + i * 18;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // rubble
      ctx.fillStyle = 'rgba(120,110,95,0.22)';
      const rng = (n: number) => ((Math.sin(n * 12.9898) * 43758.5453) % 1 + 1) % 1;
      for (let i = 0; i < 60; i++) {
        const x = rng(i * 3 + 1) * W;
        const y = H * 0.5 + rng(i * 5 + 2) * H * 0.5;
        const r = 6 + rng(i * 7 + 3) * 24;
        ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
      }

      // scanlines
      ctx.globalAlpha = 0.06;
      for (let y = 0; y < H; y += 3) {
        ctx.fillStyle = y % 6 === 0 ? '#ffffff' : '#000000';
        ctx.fillRect(0, y, W, 1);
      }
      ctx.globalAlpha = 1;

      // grain
      const imgd = ctx.getImageData(0, 0, W, H);
      const d = imgd.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = (Math.random() - 0.5) * 18;
        d[i]     = clamp((d[i]     ?? 0) + n, 0, 255);
        d[i + 1] = clamp((d[i + 1] ?? 0) + n, 0, 255);
        d[i + 2] = clamp((d[i + 2] ?? 0) + n, 0, 255);
      }
      ctx.putImageData(imgd, 0, 0);

      // NO SIGNAL label
      ctx.font = '600 18px var(--mono)';
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.textAlign = 'center';
      ctx.fillText('NO SIGNAL · CAM-A OFFLINE', W / 2, H / 2);

      void t; // unused — suppress lint
      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} style={{ display: 'block', width: '100%', height: '100%' }} />;
}

interface WebcamProps {
  accent: Accent;
  gridLines: boolean;
}

export function Webcam({ accent, gridLines }: WebcamProps) {
  const [streamError, setStreamError] = useState(false);
  const [rec, setRec] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [frame, setFrame] = useState(102834);

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => f + 1), 33);
    return () => clearInterval(id);
  }, []);

  const imgRef = useRef<HTMLImageElement>(null);

  const handleSnapshot = () => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    canvas.getContext('2d')?.drawImage(img, 0, 0);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/jpeg', 0.92);
    a.download = `snapshot-${Date.now()}.jpg`;
    a.click();
  };

  const accentColor = ACCENTS[accent];

  return (
    <Panel
      id="MOD-01"
      title="Optical · Live Feed"
      status="LIVE"
      statusTone="green"
      noPad
      right={<span style={{ color: 'var(--fg-mute)' }}>CAM-A · 1080p30 · OPTICAL</span>}
      style={{ gridColumn: 'span 8', gridRow: 'span 2' }}
    >
      <div
        style={{ position: 'relative', flex: 1, minHeight: 480, overflow: 'hidden', background: '#05060a' }}
      >
        {/* MJPEG stream */}
        {!streamError && (
          <img
            ref={imgRef}
            src="/video"
            alt="Live webcam"
            onError={() => setStreamError(true)}
            onLoad={() => setStreamError(false)}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          />
        )}
        {streamError && <FallbackCanvas />}

        {/* HUD overlay */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
          viewBox="0 0 900 520"
          preserveAspectRatio="none"
        >
          {gridLines && (
            <g stroke="rgba(255,255,255,0.07)" strokeWidth="0.5">
              {Array.from({ length: 9 }, (_, i) => (
                <line key={`v${i}`} x1={(i + 1) * 90} y1="0" x2={(i + 1) * 90} y2="520" />
              ))}
              {Array.from({ length: 5 }, (_, i) => (
                <line key={`h${i}`} x1="0" y1={(i + 1) * 86} x2="900" y2={(i + 1) * 86} />
              ))}
              <line x1="450" y1="0" x2="450" y2="520" stroke="rgba(255,255,255,0.18)" />
              <line x1="0" y1="260" x2="900" y2="260" stroke="rgba(255,255,255,0.18)" />
            </g>
          )}
          {/* target reticle */}
          <g transform="translate(522,322)">
            <circle r="44" fill="none" stroke={accentColor} strokeWidth="1.2" opacity="0.9" />
            <circle r="3" fill={accentColor} />
            <line x1="-60" y1="0" x2="-46" y2="0" stroke={accentColor} strokeWidth="1.2" />
            <line x1="46"  y1="0" x2="60"  y2="0" stroke={accentColor} strokeWidth="1.2" />
            <line x1="0" y1="-60" x2="0" y2="-46" stroke={accentColor} strokeWidth="1.2" />
            <line x1="0" y1="46"  x2="0" y2="60"  stroke={accentColor} strokeWidth="1.2" />
            <text x="52" y="-38" fill={accentColor} fontFamily="var(--mono)" fontSize="11">TGT-01 · 3.4 m</text>
            <text x="52" y="-24" fill="rgba(255,255,255,0.7)" fontFamily="var(--mono)" fontSize="10">HUMAN · p=0.94</text>
          </g>
          {/* corner markers */}
          {([[10,10],[890,10],[10,510],[890,510]] as const).map(([x, y], i) => {
            const dx = x < 450 ? 1 : -1, dy = y < 260 ? 1 : -1;
            return (
              <g key={i} stroke="rgba(255,255,255,0.5)" strokeWidth="1">
                <line x1={x} y1={y} x2={x + 14 * dx} y2={y} />
                <line x1={x} y1={y} x2={x} y2={y + 14 * dy} />
              </g>
            );
          })}
        </svg>

        {/* Top-left status badges */}
        <div style={{ position: 'absolute', top: 10, left: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em',
            padding: '3px 8px', borderRadius: 3, background: 'rgba(0,0,0,0.5)', color: 'var(--fg)',
            border: '1px solid var(--line-soft)',
          }}>
            FRM {String(frame).padStart(6, '0')}
          </span>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--red)',
            padding: '3px 8px', borderRadius: 3, background: 'rgba(0,0,0,0.5)',
            border: '1px solid var(--red)', display: 'inline-flex', gap: 6, alignItems: 'center',
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: 10, background: 'var(--red)',
              animation: rec ? 'sk-pulse 1s ease-in-out infinite' : 'none',
            }} />
            {rec ? 'REC' : 'PAUSED'}
          </span>
        </div>

        {/* Bottom control bar */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 14px',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.7), rgba(0,0,0,0))',
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['WIDE', 'NARROW', 'ZOOM 2x', 'ZOOM 4x'] as const).map((l, i) => {
              const z = [1, 1.3, 2, 4][i]!;
              return (
                <button key={l} onClick={() => setZoom(z)} style={pillBtn(zoom === z, accent)}>
                  {l}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setRec((r) => !r)} style={pillBtn(false, accent)}>
              {rec ? 'PAUSE REC' : 'RESUME REC'}
            </button>
            <button onClick={handleSnapshot} style={pillBtn(false, accent)}>SNAPSHOT</button>
            <button style={pillBtn(false, accent)}>FLASHLIGHT</button>
          </div>
        </div>
      </div>
    </Panel>
  );
}
