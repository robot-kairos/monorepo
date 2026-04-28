import { Temperature, TempUnit } from '../types';
import { Panel } from './Panel';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '6px 8px',
      background: 'var(--bg-1)', border: '1px solid var(--line-soft)', borderRadius: 3,
      fontFamily: 'var(--mono)', fontSize: 12,
    }}>
      <span style={{ color: 'var(--fg-mute)', letterSpacing: '0.15em', fontSize: 10 }}>{label}</span>
      <span style={{ color: 'var(--fg)' }}>{value}</span>
    </div>
  );
}

interface ThermometerProps {
  temperature: Temperature;
  unitTemp: TempUnit;
}

export function Thermometer({ temperature, unitTemp }: ThermometerProps) {
  const tempC = temperature.ambient;
  const tempF = tempC * 9 / 5 + 32;
  const show = unitTemp === 'F' ? tempF : tempC;
  const pct = clamp(((tempC - 10) / 40) * 100, 0, 100);
  const zone = tempC < 20 ? 'COLD' : tempC > 35 ? 'HOT' : 'NOMINAL';
  const zoneColor = tempC < 20 ? 'var(--cyan)' : tempC > 35 ? 'var(--red)' : 'var(--green)';

  return (
    <Panel
      id="MOD-02"
      title="Environmental · Core Temp"
      statusTone="green"
      right={<span style={{ color: 'var(--fg-mute)' }}>BME-680 · CAL 99.2%</span>}
      style={{ gridColumn: 'span 4' }}
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flex: 1 }}>
        {/* Vertical thermometer */}
        <div style={{
          position: 'relative', width: 56, minHeight: 180,
          background: 'var(--bg-1)', border: '1px solid var(--line-soft)', borderRadius: 4,
          overflow: 'hidden', flexShrink: 0,
        }}>
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: `${pct}%`,
            background: 'linear-gradient(0deg, var(--red), var(--amber) 50%, var(--cyan))',
            transition: 'height 800ms cubic-bezier(0.22, 1, 0.36, 1)',
            opacity: 0.85,
          }} />
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} style={{
              position: 'absolute', right: 0, top: `${i * 12.5}%`,
              width: i % 2 === 0 ? 14 : 8, height: 1, background: 'var(--line)',
            }} />
          ))}
          <div style={{
            position: 'absolute', left: -4, right: -4, bottom: `calc(${pct}% - 1px)`,
            height: 2, background: 'var(--fg)', boxShadow: '0 0 8px var(--fg)',
          }} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-mute)', letterSpacing: '0.2em' }}>
              AMBIENT · ROBOT LOCUS
            </div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 52, fontWeight: 700, lineHeight: 1,
              letterSpacing: '-0.01em', marginTop: 6,
              color: zoneColor,
              textShadow: `0 0 18px ${zoneColor}33`,
            }}>
              {show.toFixed(1)}
              <span style={{ fontSize: 22, color: 'var(--fg-dim)' }}>°{unitTemp}</span>
            </div>
            <div style={{
              marginTop: 8, display: 'inline-flex', gap: 8, alignItems: 'center',
              fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em',
              padding: '3px 8px', border: `1px solid ${zoneColor}`, color: zoneColor, borderRadius: 3,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 10, background: zoneColor }} />
              ZONE: {zone}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
            <StatRow label="MIN 10m" value={`${(tempC - 2.1).toFixed(1)}°${unitTemp}`} />
            <StatRow label="MAX 10m" value={`${(tempC + 1.4).toFixed(1)}°${unitTemp}`} />
          </div>
        </div>
      </div>
    </Panel>
  );
}
