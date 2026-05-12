import { useEffect, useState } from 'react';

const FONT     = 'var(--sans)';
const GRADIENT = 'linear-gradient(180deg, #ff8b3a 0%, #f7c37f 40%, #edebde 100%)';

// rotate(+90deg) axis mapping: CSS top→visual right, bottom→visual left, right→visual bottom/home, left→visual top/notch
const SA_TOP    = 'max(20px, env(safe-area-inset-right))';
const SA_RIGHT  = 'max(20px, env(safe-area-inset-bottom))';
const SA_BOTTOM = 'max(20px, env(safe-area-inset-left))';
const SA_LEFT   = 'max(20px, env(safe-area-inset-top))';

const WATERMARK_POSITIONS = [
  { top: -10, left: -40 },
  { top: 60,  left: 160 },
  { top: 130, left: -20 },
  { top: 200, left: 180 },
];

function Watermark() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {WATERMARK_POSITIONS.map((pos, i) => (
        <span key={i} style={{
          position: 'absolute', top: pos.top, left: pos.left,
          fontSize: 80, fontFamily: 'var(--display)', fontStyle: 'italic', fontWeight: 700,
          color: '#fff', opacity: 0.12, transform: 'rotate(-17deg)',
          whiteSpace: 'nowrap', userSelect: 'none',
        }}>MedKit</span>
      ))}
    </div>
  );
}

const INSTRUCTION_BOXES: { status: 'reject' | 'accept' | 'active' }[] = [
  { status: 'reject' },
  { status: 'accept' },
  { status: 'active' },
];

export function MedicalFeedbackPage({ onDone }: { onDone: () => void }) {
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = '#ff8b3a';
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  const outerStyle: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: GRADIENT,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  };

  const innerStyle: React.CSSProperties = {
    width: '100dvh', height: '100dvw', flexShrink: 0,
    transform: 'rotate(90deg)',
    background: GRADIENT,
    fontFamily: FONT, userSelect: 'none',
    position: 'relative',
    display: 'flex', flexDirection: 'column',
    paddingTop: SA_TOP,
    paddingRight: `calc(${SA_RIGHT} + 56px)`,
    paddingBottom: SA_BOTTOM,
    paddingLeft: SA_LEFT,
    boxSizing: 'border-box',
    overflow: 'hidden',
    gap: 12,
  };

  const pillBtn: React.CSSProperties = {
    position: 'absolute',
    right: 12, top: 80, bottom: 14, width: 44,
    borderRadius: 24, border: 'none',
    background: 'rgba(9,9,9,0.85)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 34, lineHeight: 1, cursor: 'pointer', zIndex: 1,
  };

  if (notified) {
    return (
      <div style={outerStyle}>
        <div style={innerStyle}>
          <Watermark />
          <div style={{
            position: 'relative', zIndex: 1,
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 14,
          }}>
            <div style={{ fontSize: 48 }}>🔔</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1008' }}>Help is coming!</div>
            <div style={{ fontSize: 15, color: '#3a2010' }}>Do not attempt to move the debris</div>
          </div>
          <button onClick={onDone} style={pillBtn}>›</button>
        </div>
      </div>
    );
  }

  return (
    <div style={outerStyle}>
      <div style={innerStyle}>
        <Watermark />

        {/* Title */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 700, color: '#1a1008', lineHeight: 1.2 }}>
            Plz follow these instructions
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: '#3a2010' }}>for the rescue</p>
        </div>

        {/* Instruction boxes */}
        <div style={{
          position: 'relative', zIndex: 1,
          flex: 1, display: 'flex', gap: 12, minHeight: 0,
        }}>
          {INSTRUCTION_BOXES.map((box, i) => (
            <div key={i} style={{
              flex: 1,
              background: 'rgba(255,255,255,0.55)',
              borderRadius: 16,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: box.status === 'active' ? '3px solid #29a7ff' : '3px solid transparent',
            }}>
              <div style={{
                fontSize: 12, color: 'rgba(0,0,0,0.25)', fontStyle: 'italic',
                flex: 1, display: 'flex', alignItems: 'center',
              }}>
                Animation...
              </div>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: box.status === 'reject' ? '#ef4444' : '#22c55e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 15, fontWeight: 700, flexShrink: 0,
              }}>
                {box.status === 'reject' ? '✕' : '✓'}
              </div>
            </div>
          ))}
        </div>

        {/* Send Notification — right-side pill */}
        <button onClick={() => setNotified(true)} style={pillBtn}>›</button>
      </div>
    </div>
  );
}
