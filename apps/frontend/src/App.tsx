import { useEffect, useState } from 'react';
import { Accent, ACCENTS, DEFAULT_TWEAKS, Tweaks } from './types';
import { useRobotWS } from './hooks/useRobotWS';
import { OpsBar } from './components/OpsBar';
import { Webcam } from './components/Webcam';
import { Thermometer } from './components/Thermometer';
import { VitalSigns } from './components/VitalSigns';
import { Comms } from './components/Comms';
import { SoundBank } from './components/SoundBank';
import { Log } from './components/Log';

function pillBtn(active: boolean, accent: Accent): React.CSSProperties {
  return {
    fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.15em',
    padding: '6px 10px', borderRadius: 3, cursor: 'pointer',
    background: active ? `${ACCENTS[accent]}22` : 'rgba(20,22,28,0.6)',
    color: active ? ACCENTS[accent] : 'var(--fg)',
    border: `1px solid ${active ? ACCENTS[accent] : 'var(--line)'}`,
  };
}

function TweakRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 10px', background: 'var(--bg-1)',
      border: '1px solid var(--line-soft)', borderRadius: 3, minHeight: 42,
    }}>
      <div style={{ flex: '0 0 88px', fontSize: 10, letterSpacing: '0.2em', color: 'var(--fg-mute)', fontFamily: 'var(--mono)' }}>{label}</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>{children}</div>
    </div>
  );
}

function TweaksPanel({ tweaks, update }: { tweaks: Tweaks; update: <K extends keyof Tweaks>(k: K, v: Tweaks[K]) => void }) {
  return (
    <div style={{
      gridColumn: 'span 12',
      background: 'linear-gradient(180deg, var(--bg-2), var(--bg-1))',
      border: '1px solid var(--line)', borderRadius: 6, padding: 14,
    }}>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--fg-mute)', marginBottom: 12,
      }}>MOD-07 · Tweaks · Runtime Settings</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        <TweakRow label="ACCENT">
          <div style={{ display: 'flex', gap: 4 }}>
            {(Object.keys(ACCENTS) as Accent[]).map((k) => (
              <button
                key={k}
                onClick={() => update('accent', k)}
                style={{
                  width: 22, height: 22, borderRadius: 3, background: ACCENTS[k], cursor: 'pointer',
                  border: tweaks.accent === k ? '2px solid var(--fg)' : '1px solid var(--line)',
                }}
              />
            ))}
          </div>
        </TweakRow>
        <TweakRow label="DENSITY">
          {(['comfortable', 'compact'] as const).map((m) => (
            <button key={m} onClick={() => update('density', m)} style={pillBtn(tweaks.density === m, tweaks.accent)}>
              {m.toUpperCase()}
            </button>
          ))}
        </TweakRow>
        <TweakRow label="TEMP UNIT">
          {(['C', 'F'] as const).map((m) => (
            <button key={m} onClick={() => update('unitTemp', m)} style={pillBtn(tweaks.unitTemp === m, tweaks.accent)}>
              °{m}
            </button>
          ))}
        </TweakRow>
        <TweakRow label="GRID">
          <button onClick={() => update('gridLines', !tweaks.gridLines)} style={pillBtn(tweaks.gridLines, tweaks.accent)}>
            {tweaks.gridLines ? 'ON' : 'OFF'}
          </button>
        </TweakRow>
      </div>
    </div>
  );
}

export default function App() {
  const { state, log, send, connected } = useRobotWS();
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULT_TWEAKS);
  const [now, setNow] = useState(new Date());
  const [showTweaks, setShowTweaks] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  function update<K extends keyof Tweaks>(key: K, val: Tweaks[K]) {
    setTweaks((t) => ({ ...t, [key]: val }));
  }

  const gap = tweaks.density === 'compact' ? 10 : 14;
  const pad = tweaks.density === 'compact' ? 14 : 18;

  return (
    <div style={{ minHeight: '100vh' }}>
      <OpsBar now={now} accent={tweaks.accent} connected={connected} />

      <main style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap,
        padding: pad,
        maxWidth: 1560,
        margin: '0 auto',
      }}>
        <Webcam accent={tweaks.accent} gridLines={tweaks.gridLines} />
        <Thermometer temperature={state.temperature} unitTemp={tweaks.unitTemp} />
        <VitalSigns vitals={state.vitals} accent={tweaks.accent} />
        <Comms accent={tweaks.accent} send={send} />
        <SoundBank accent={tweaks.accent} serverPlaying={state.playing} send={send} />
        <Log entries={log} />
        {showTweaks && <TweaksPanel tweaks={tweaks} update={update} />}
      </main>

      <footer style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 18px', borderTop: '1px solid var(--line)',
        fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-mute)',
        letterSpacing: '0.2em', background: 'var(--bg-1)',
      }}>
        <span>SENTRY CONSOLE v1.0.0 · AES-256 ENCRYPTED LINK</span>
        <button
          onClick={() => setShowTweaks((s) => !s)}
          style={{ ...pillBtn(showTweaks, tweaks.accent), fontSize: 10 }}
        >
          TWEAKS {showTweaks ? '▲' : '▼'}
        </button>
        <span>© DIV. URBAN S&amp;R — INTERNAL USE ONLY</span>
      </footer>
    </div>
  );
}
