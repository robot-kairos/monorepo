import { useState } from 'react';
import { SurvivorProfile } from '../types';

interface Props {
  profile: SurvivorProfile;
  onComplete: () => void;
  onBack: () => void;
}

const STEPS = [
  { id: 1, label: 'REACH', color: '#f6c340' },
  { id: 2, label: 'DATA',  color: '#ff8f42' },
  { id: 3, label: 'QA',    color: '#60afff' },
  { id: 4, label: 'SHOT',  color: '#8b6cff' },
];

const FUTURE_TAB_BG   = '#e9e4cf';
const FUTURE_TAB_TEXT = 'rgba(45, 40, 30, 0.38)';

function ProgressTabs({ stepIdx }: { stepIdx: number }) {
  const visible = STEPS.slice(stepIdx);
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', width: '100%', minWidth: 0 }}>
      {visible.map((step, i) => {
        const active = i === 0;
        const last   = i === visible.length - 1;
        return (
          <div key={step.id} style={{
            minWidth: 0,
            flex: active ? '1 0 0' : '0 0 23%',
            height: 32,
            position: 'relative',
            zIndex: visible.length - i,
            marginLeft: i === 0 ? 0 : -1,
            border: active ? '1.3px solid #1e170d' : `1.3px solid ${FUTURE_TAB_TEXT}`,
            borderRight: active ? '1.3px solid #000' : `1.3px solid ${FUTURE_TAB_TEXT}`,
            borderRadius: i === 0 && last ? 7 : i === 0 ? '7px 6px 6px 7px' : last ? '6px 7px 7px 6px' : 6,
            background: active ? step.color : FUTURE_TAB_BG,
            color: active ? '#1e170d' : FUTURE_TAB_TEXT,
            display: 'flex', alignItems: 'center', justifyContent: active && step.label !== 'REACH' ? 'flex-end' : 'center',
            fontSize: 16, fontWeight: 600,
            letterSpacing: '-0.01em',
            boxShadow: active ? 'inset 0 0 0 1px rgba(255,255,255,0.18)' : undefined,
          }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 10px' }}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PttButton({ ptt, setPtt }: { ptt: boolean; setPtt: (v: boolean) => void }) {
  return (
    <div style={{
      position: 'absolute', right: -15, bottom: 17, width: 60,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      opacity: 0.65, zIndex: 1,
    }}>
      <button
        onMouseDown={() => setPtt(true)}
        onMouseUp={() => setPtt(false)}
        onMouseLeave={() => setPtt(false)}
        onTouchStart={(e) => { e.preventDefault(); setPtt(true); }}
        onTouchEnd={() => setPtt(false)}
        style={{
          width: 60, height: 60,
          borderRadius: '50%',
          border: '1px solid rgba(0,0,0,0.08)',
          background: ptt ? '#d5d0bd' : '#d9d4c1',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 2,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          cursor: 'pointer',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#111" stroke="#111" strokeWidth="0" strokeLinecap="round">
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" fill="none" stroke="#111" strokeWidth="2" />
          <line x1="12" y1="18" x2="12" y2="22" stroke="#111" strokeWidth="2" />
          <line x1="9" y1="22" x2="15" y2="22" stroke="#111" strokeWidth="2" />
        </svg>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#2b271f', lineHeight: 1 }}>Talk</span>
      </button>
    </div>
  );
}

function RightRail({ color, onBack, onForward }: {
  color: string; onBack: () => void; onForward: () => void;
}) {
  return (
    <>
      <button onClick={onBack} style={{
        position: 'absolute', right: -15, top: 17,
        width: 60, height: 48, borderRadius: 34,
        border: 'none',
        background: color,
        color: '#2c220d',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 30, lineHeight: 1, fontWeight: 'bold',
        opacity: 0.65, cursor: 'pointer', zIndex: 1,
      }}>‹</button>

      <button onClick={onForward} style={{
        position: 'absolute', right: -15, top: 80, bottom: 92,
        width: 60, borderRadius: 34,
        border: 'none',
        background: color,
        color: '#2c220d',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 34, lineHeight: 1, fontWeight: 'bold',
        opacity: 0.65,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
        cursor: 'pointer', zIndex: 1,
      }}>›</button>
    </>
  );
}

function CameraFeed() {
  const [err, setErr] = useState(false);
  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      overflow: 'hidden',
      background: err ? 'linear-gradient(180deg, #51483e 0%, #2d2c2b 100%)' : '#111',
    }}>
      {!err && (
        <img
          src={`http://${window.location.hostname}:8000/video`}
          alt="camera feed"
          onError={() => setErr(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'contrast(1.03) saturate(0.92)' }}
        />
      )}
      {err && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 50% 36%, rgba(255,255,255,0.08), transparent 28%), linear-gradient(180deg, #5a5148 0%, #2f2e2b 100%)',
          display: 'grid', placeItems: 'center',
          color: 'rgba(255,255,255,0.58)', fontSize: 14, letterSpacing: '0.18em',
        }}>
          NO SIGNAL
        </div>
      )}
    </div>
  );
}

export function StepExecutionPage({ onComplete, onBack }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [ptt, setPtt]         = useState(false);

  const step = STEPS[stepIdx]!;

  function goForward() {
    if (stepIdx < STEPS.length - 1) { setStepIdx(i => i + 1); return; }
    onComplete();
  }

  function goBack() {
    if (stepIdx > 0) { setStepIdx(i => i - 1); return; }
    onBack();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        width: '100dvh', height: '100dvw',
        flexShrink: 0,
        transform: 'rotate(90deg)',
        background: '#000',
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        userSelect: 'none',
      }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>

          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <CameraFeed />
          </div>

          <div style={{
            position: 'absolute',
            top:    'env(safe-area-inset-right, 0px)',
            right:  'env(safe-area-inset-bottom, 0px)',
            bottom: 'env(safe-area-inset-left, 0px)',
            left:   'env(safe-area-inset-top, 0px)',
            zIndex: 1,
          }}>
            <div style={{
              position: 'absolute', left: 12, top: 17, right: 68,
              display: 'flex', alignItems: 'center', gap: 12, minWidth: 0,
              opacity: 0.65,
            }}>
              <ProgressTabs stepIdx={stepIdx} />
            </div>

            <PttButton ptt={ptt} setPtt={setPtt} />

            <button style={{
              position: 'absolute', left: 12, bottom: 17,
              width: 60, height: 60, borderRadius: '50%',
              border: '1px solid rgba(0,0,0,0.08)',
              background: '#d9d4c1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              cursor: 'pointer', zIndex: 1,
              opacity: 0.65,
            }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: '#2b271f', lineHeight: 1 }}>?</span>
            </button>

            <RightRail color={step.color} onBack={goBack} onForward={goForward} />
          </div>

        </div>
      </div>
    </div>
  );
}
