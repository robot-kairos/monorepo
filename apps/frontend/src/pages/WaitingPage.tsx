import { useEffect, useState } from 'react';

const BG   = '#f0ede0';
const FONT = 'var(--sans)';

// rotate(+90deg) axis mapping: CSS top→visual right, bottom→visual left, right→visual bottom/home, left→visual top/notch
const SA_TOP    = 'max(20px, env(safe-area-inset-right))';
const SA_RIGHT  = 'max(20px, env(safe-area-inset-bottom))';
const SA_BOTTOM = 'max(20px, env(safe-area-inset-left))';
const SA_LEFT   = 'max(20px, env(safe-area-inset-top))';

export function WaitingPage({ onNext }: { onNext: () => void }) {
  const [priorityCare, setPriorityCare] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = BG;
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: BG,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        width: '100dvh', height: '100dvw', flexShrink: 0,
        transform: 'rotate(90deg)',
        background: BG, fontFamily: FONT, userSelect: 'none',
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        paddingTop: SA_TOP, paddingRight: `calc(${SA_RIGHT} + 56px)`,
        paddingBottom: SA_BOTTOM, paddingLeft: SA_LEFT,
        boxSizing: 'border-box', gap: 12,
      }}>
        {/* Title — centered, large */}
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#1a1008', textAlign: 'center' }}>
          Waiting for suggestion
        </h2>

        {/* Progress bar */}
        <div style={{ height: 7, background: 'rgba(0,0,0,0.1)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '65%', background: 'linear-gradient(90deg, #ef7519, #ff9240)', borderRadius: 4 }} />
        </div>

        {/* Priority care toggle — full width row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
          background: 'rgba(255,255,255,0.7)', borderRadius: 14,
        }}>
          <span style={{ flex: 1, fontSize: 14, color: '#1a1008' }}>
            If U Request Priority Care... 📞
          </span>
          <div
            onClick={() => setPriorityCare(p => !p)}
            style={{
              width: 44, height: 26, borderRadius: 13,
              background: priorityCare ? '#ef7519' : 'rgba(0,0,0,0.14)',
              cursor: 'pointer', position: 'relative',
              transition: 'background 0.2s', flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute', width: 20, height: 20, borderRadius: '50%',
              background: 'white', top: 3,
              left: priorityCare ? 21 : 3,
              transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }} />
          </div>
        </div>

        {/* AI suggestion box — full width */}
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.7)', borderRadius: 14,
          padding: '14px 16px', minHeight: 0,
        }}>
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.38)' }}>AI suggestion:</div>
        </div>

        {/* Continue — right-side pill, same extents as instruction area in StepExecutionPage */}
        <button
          onClick={onNext}
          style={{
            position: 'absolute',
            right: 12, top: 80, bottom: 14, width: 44,
            borderRadius: 24, border: 'none',
            background: 'rgba(9,9,9,0.85)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34, lineHeight: 1, cursor: 'pointer', zIndex: 1,
          }}
        >›</button>
      </div>
    </div>
  );
}
