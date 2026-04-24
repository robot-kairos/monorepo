import { useEffect, useRef } from 'react';
import { Accent, ACCENTS, CANVAS_COLORS, CANVAS_FG, CANVAS_FG_MUTE, Vitals } from '../types';
import { Panel } from './Panel';

function VitalCard({
  label,
  value,
  unit,
  color,
  sub,
  bottom,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
  sub: string;
  bottom: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'var(--bg-1)', border: '1px solid var(--line-soft)', borderRadius: 4,
      padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.25em', color: 'var(--fg-mute)' }}>{label}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-mute)' }}>{unit}</div>
      </div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 44, fontWeight: 700, lineHeight: 1,
        color, letterSpacing: '-0.01em', textShadow: `0 0 14px ${color}33`,
      }}>
        {value}
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-dim)' }}>{sub}</div>
      <div style={{ flex: 1, minHeight: 60, display: 'flex', alignItems: 'stretch' }}>{bottom}</div>
    </div>
  );
}

function EcgCanvas({ hr }: { hr: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = 560, H = 80;
    c.width = W * 2; c.height = H * 2;
    c.style.width = '100%'; c.style.height = `${H}px`;
    ctx.scale(2, 2);
    let raf: number;

    function draw(tp: number) {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      const shift = (tp / 8) % W;
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const nx = ((x + shift) % W) / W;
        let y = H / 2;
        y -= 4  * Math.exp(-Math.pow((nx - 0.30) / 0.030, 2));
        y += 3  * Math.exp(-Math.pow((nx - 0.38) / 0.015, 2));
        y -= 30 * Math.exp(-Math.pow((nx - 0.42) / 0.012, 2));
        y += 10 * Math.exp(-Math.pow((nx - 0.46) / 0.020, 2));
        y -= 6  * Math.exp(-Math.pow((nx - 0.62) / 0.050, 2));
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = CANVAS_COLORS.green;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = CANVAS_COLORS.green;
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [hr]);

  return <canvas ref={ref} />;
}

function BrCanvas({ br, accent }: { br: number; accent: Accent }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = 560, H = 60;
    c.width = W * 2; c.height = H * 2;
    c.style.width = '100%'; c.style.height = `${H}px`;
    ctx.scale(2, 2);
    let raf: number;

    function tick(tp: number) {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const phase = (x + tp / 30) / W;
        const y = H / 2 + Math.sin(phase * Math.PI * 4) * (H * 0.32) * (0.6 + 0.4 * Math.sin(phase * 7));
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = CANVAS_COLORS[accent];
      ctx.lineWidth = 1.5;
      ctx.shadowColor = CANVAS_COLORS[accent];
      ctx.shadowBlur = 4;
      ctx.stroke();
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [accent, br]);

  return <canvas ref={ref} />;
}

function RadarCanvas({ distance, accent }: { distance: number; accent: Accent }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = 200, H = 160;
    c.width = W * 2; c.height = H * 2;
    c.style.width = '100%'; c.style.height = '100%';
    ctx.scale(2, 2);
    const RANGE_MAX = 8;
    const accentColor = CANVAS_COLORS[accent];
    const cx = W / 2, cy = H;
    let raf: number;
    let sweepAngle = -Math.PI / 2;

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Range arcs
      for (const p of [0.25, 0.5, 0.75, 1.0]) {
        const r = p * H;
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI, 0);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Range labels
      ctx.font = '7px monospace';
      ctx.fillStyle = CANVAS_FG_MUTE;
      ctx.textAlign = 'left';
      for (const [label, p] of [[' 2m', 0.25], [' 4m', 0.5], [' 6m', 0.75], [' 8m', 1.0]] as const) {
        ctx.fillText(label, cx + 2, cy - p * H + 3);
      }

      // Sweep fan
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(sweepAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, H, -Math.PI / 6, 0);
      ctx.closePath();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = accentColor;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Sweep line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -H);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.2;
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // Target dot
      const tgtAngle = 18 * (Math.PI / 180);
      const tgtR = (distance / RANGE_MAX) * H;
      const tx = cx + Math.sin(tgtAngle) * tgtR;
      const ty = cy - Math.cos(tgtAngle) * tgtR;
      ctx.beginPath();
      ctx.arc(tx, ty, 3, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.fill();

      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 400);
      ctx.beginPath();
      ctx.arc(tx, ty, 4 + pulse * 4, 0, Math.PI * 2);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = 1 - pulse;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Centre dot
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fillStyle = CANVAS_FG;
      ctx.fill();

      sweepAngle += 0.025;
      if (sweepAngle > Math.PI / 2) sweepAngle = -Math.PI / 2;
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [distance, accent]);

  return <canvas ref={ref} style={{ display: 'block', width: '100%', height: '100%' }} />;
}

interface VitalSignsProps {
  vitals: Vitals;
  accent: Accent;
}

export function VitalSigns({ vitals, accent }: VitalSignsProps) {
  const { hr, br, distance } = vitals;

  return (
    <Panel
      id="MOD-03"
      title="MMWave Radar · Vital Signs"
      statusTone="green"
      right={<span style={{ color: 'var(--fg-mute)' }}>60 GHz · FFT 512 · SNR 22.4 dB</span>}
      style={{ gridColumn: 'span 8' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 14, flex: 1 }}>
        <VitalCard
          label="HEART RATE"
          unit="bpm"
          value={String(Math.round(hr))}
          color="var(--green)"
          sub={`HRV — · ${hr > 100 ? 'ELEVATED' : hr < 60 ? 'LOW' : 'NORMAL'}`}
          bottom={<EcgCanvas hr={hr} />}
        />
        <VitalCard
          label="BREATH RATE"
          unit="rpm"
          value={String(Math.round(br))}
          color={ACCENTS[accent]}
          sub={`I:E 1:1.8 · ${br > 24 ? 'TACHYPNEA' : br < 10 ? 'BRADYPNEA' : 'NORMAL'}`}
          bottom={<BrCanvas br={br} accent={accent} />}
        />
        <div style={{
          background: 'var(--bg-1)', border: '1px solid var(--line-soft)', borderRadius: 4,
          padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.25em', color: 'var(--fg-mute)' }}>TARGET DISTANCE</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-mute)' }}>m</div>
          </div>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 44, fontWeight: 700, lineHeight: 1,
            color: ACCENTS[accent], letterSpacing: '-0.01em', textShadow: `0 0 14px ${ACCENTS[accent]}33`,
          }}>
            {distance.toFixed(2)}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-dim)' }}>
            AZ +18° · EL −4° · RANGE 0.3–8.0 m
          </div>
          <div style={{ flex: 1, minHeight: 90, marginTop: 4 }}>
            <RadarCanvas distance={distance} accent={accent} />
          </div>
        </div>
      </div>
    </Panel>
  );
}
