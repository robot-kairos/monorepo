import { Accent, ACCENTS } from '../types';

function pad(n: number, w = 2) {
  return String(n).padStart(w, '0');
}
function fmtTime(d: Date) {
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}Z`;
}
function fmtDate(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}


function BrandMark({ accent }: { accent: string }) {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden>
      <rect x="1" y="1" width="36" height="36" rx="4" fill="var(--bg-2)" stroke="var(--line)" />
      <circle cx="19" cy="19" r="10" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.9" />
      <circle cx="19" cy="19" r="5"  fill="none" stroke={accent} strokeWidth="1.2" opacity="0.6" />
      <circle cx="19" cy="19" r="1.6" fill={accent} />
      <line x1="19" y1="4"  x2="19" y2="9"  stroke={accent} strokeWidth="1.2" />
      <line x1="19" y1="29" x2="19" y2="34" stroke={accent} strokeWidth="1.2" />
      <line x1="4"  y1="19" x2="9"  y2="19" stroke={accent} strokeWidth="1.2" />
      <line x1="29" y1="19" x2="34" y2="19" stroke={accent} strokeWidth="1.2" />
    </svg>
  );
}

interface OpsBarProps {
  now: Date;
  accent: Accent;
  connected: boolean;
}

export function OpsBar({ now, accent, connected }: OpsBarProps) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: 'linear-gradient(180deg, oklch(0.16 0.012 250 / 0.96), oklch(0.16 0.012 250 / 0.86))',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--line)',
        padding: '10px 18px',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center',
        gap: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <BrandMark accent={ACCENTS[accent]} />
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.3em', color: 'var(--fg-mute)' }}>
            DIV. URBAN S&amp;R
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, letterSpacing: '0.12em' }}>
            SENTRY · SURVIVOR SEARCH CONSOLE
          </div>
        </div>
      </div>

      <div />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* WS connection indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em' }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 10,
              background: connected ? 'var(--green)' : 'var(--red)',
              boxShadow: connected ? '0 0 0 3px oklch(0.82 0.16 155 / 0.22)' : undefined,
              animation: connected ? 'sk-pulse 2s ease-in-out infinite' : 'none',
            }}
          />
          <span style={{ color: connected ? 'var(--green)' : 'var(--red)' }}>
            {connected ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        <div style={{ fontFamily: 'var(--mono)', fontSize: 13, textAlign: 'right', lineHeight: 1.15 }}>
          <div style={{ color: 'var(--fg)' }}>{fmtTime(now)}</div>
          <div style={{ color: 'var(--fg-mute)', fontSize: 10, letterSpacing: '0.2em' }}>{fmtDate(now)}</div>
        </div>
      </div>
    </div>
  );
}
