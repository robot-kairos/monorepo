import { LogEntry } from '../types';
import { Panel } from './Panel';

interface LogProps {
  entries: LogEntry[];
}

export function Log({ entries }: LogProps) {
  return (
    <Panel
      id="MOD-06"
      title="Event Log"
      statusTone="mute"
      status="STREAM"
      right={<span style={{ color: 'var(--fg-mute)' }}>LAST 50 · LIVE</span>}
      style={{ gridColumn: 'span 4' }}
    >
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        overflow: 'auto', fontFamily: 'var(--mono)', fontSize: 11,
        flex: 1,
      }}>
        {entries.length === 0 && (
          <div style={{ color: 'var(--fg-mute)', letterSpacing: '0.15em' }}>AWAITING EVENTS…</div>
        )}
        {entries.map((e, i) => (
          <div
            key={i}
            style={{
              display: 'grid', gridTemplateColumns: '72px 58px 1fr',
              gap: 8, padding: '4px 0',
              borderBottom: '1px dashed var(--line-soft)',
            }}
          >
            <span style={{ color: 'var(--fg-mute)' }}>{e.t}</span>
            <span style={{
              color: e.lvl === 'WARN' ? 'var(--amber)' : e.lvl === 'ERR' ? 'var(--red)' : 'var(--green)',
              letterSpacing: '0.15em',
            }}>
              {e.lvl}
            </span>
            <span style={{ color: 'var(--fg-dim)' }}>{e.m}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
