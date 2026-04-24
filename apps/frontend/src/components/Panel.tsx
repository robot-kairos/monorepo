import { CSSProperties, ReactNode } from 'react';

type StatusTone = 'green' | 'amber' | 'red' | 'mute';

interface PanelProps {
  id: string;
  title: string;
  status?: string;
  statusTone?: StatusTone;
  right?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
  noPad?: boolean;
}

const TONE_COLOR: Record<StatusTone, string> = {
  green: 'var(--green)',
  amber: 'var(--amber)',
  red: 'var(--red)',
  mute: 'var(--fg-mute)',
};

const CORNERS = ['tl', 'tr', 'bl', 'br'] as const;

export function Panel({
  id,
  title,
  status = 'LIVE',
  statusTone = 'green',
  right,
  children,
  style,
  noPad,
}: PanelProps) {
  const tone = TONE_COLOR[statusTone];

  return (
    <section
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, var(--bg-2), var(--bg-1))',
        border: '1px solid var(--line)',
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        ...style,
      }}
    >
      {CORNERS.map((c) => (
        <span
          key={c}
          style={{
            position: 'absolute',
            width: 10,
            height: 10,
            borderColor: 'var(--line)',
            borderStyle: 'solid',
            borderWidth: 0,
            ...(c.includes('t') ? { top: -1 } : { bottom: -1 }),
            ...(c.includes('l')
              ? { left: -1, borderLeftWidth: 1 }
              : { right: -1, borderRightWidth: 1 }),
            ...(c.includes('t') ? { borderTopWidth: 1 } : { borderBottomWidth: 1 }),
          }}
        />
      ))}

      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          borderBottom: '1px solid var(--line-soft)',
          fontFamily: 'var(--mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--fg-dim)',
        }}
      >
        <span style={{ color: 'var(--fg-mute)' }}>{id}</span>
        <span style={{ color: 'var(--fg)' }}>· {title}</span>
        <span style={{ flex: 1 }} />
        {right}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: tone }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 10,
              background: tone,
              boxShadow: `0 0 0 3px ${tone}22`,
              animation: status === 'LIVE' ? 'sk-pulse 1.6s ease-in-out infinite' : 'none',
            }}
          />
          {status}
        </span>
      </header>

      <div
        style={{
          padding: noPad ? 0 : 14,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </section>
  );
}
