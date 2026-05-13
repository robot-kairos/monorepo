import { useEffect, useState } from 'react';

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
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {WATERMARK_POSITIONS.map((pos, i) => (
        <span
          key={i}
          className="absolute text-[80px] font-display italic font-bold text-white opacity-[0.12] select-none whitespace-nowrap"
          style={{ top: pos.top, left: pos.left, transform: 'rotate(-17deg)' }}
        >
          MedKit
        </span>
      ))}
    </div>
  );
}

const INSTRUCTION_BOXES: { status: 'reject' | 'accept' | 'active' }[] = [
  { status: 'reject' },
  { status: 'accept' },
  { status: 'active' },
];

const innerLayout: React.CSSProperties = {
  width: '100dvh',
  height: '100dvw',
  transform: 'rotate(90deg)',
  background: GRADIENT,
  fontFamily: 'var(--sans)',
  userSelect: 'none',
  paddingTop: SA_TOP,
  paddingRight: `calc(${SA_RIGHT} + 56px)`,
  paddingBottom: SA_BOTTOM,
  paddingLeft: SA_LEFT,
  boxSizing: 'border-box',
  gap: 12,
};

const pillBtnStyle: React.CSSProperties = {
  position: 'absolute',
  right: 12, top: 80, bottom: 14, width: 44,
};

export function MedicalFeedbackPage({ onDone }: { onDone: () => void }) {
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = '#ff8b3a';
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  if (notified) {
    return (
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden" style={{ background: GRADIENT }}>
        <div className="shrink-0 relative flex flex-col overflow-hidden" style={innerLayout}>
          <Watermark />
          <div className="relative z-[1] flex-1 flex flex-col items-center justify-center gap-3.5">
            <div className="text-[48px]">🔔</div>
            <div className="text-[26px] font-bold text-[#1a1008]">Help is coming!</div>
            <div className="text-[15px] text-[#3a2010]">Do not attempt to move the debris</div>
          </div>
          <button
            onClick={onDone}
            className="absolute rounded-3xl border-none bg-[rgba(9,9,9,0.85)] text-white flex items-center justify-center text-[34px] leading-none cursor-pointer z-[1]"
            style={pillBtnStyle}
          >
            ›
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden" style={{ background: GRADIENT }}>
      <div className="shrink-0 relative flex flex-col overflow-hidden" style={innerLayout}>
        <Watermark />

        {/* Title */}
        <div className="relative z-[1] text-center">
          <h2 className="m-0 mb-0.5 text-[22px] font-bold text-[#1a1008] leading-[1.2]">
            Plz follow these instructions
          </h2>
          <p className="m-0 text-[14px] text-[#3a2010]">for the rescue</p>
        </div>

        {/* Instruction boxes */}
        <div className="relative z-[1] flex-1 flex gap-3 min-h-0">
          {INSTRUCTION_BOXES.map((box, i) => (
            <div
              key={i}
              className="flex-1 bg-[rgba(255,255,255,0.55)] rounded-2xl flex flex-col items-center justify-between py-3 px-2 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              style={{ border: box.status === 'active' ? '3px solid #29a7ff' : '3px solid transparent' }}
            >
              <div className="text-[12px] text-[rgba(0,0,0,0.25)] italic flex-1 flex items-center">
                Animation...
              </div>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[15px] font-bold shrink-0"
                style={{ background: box.status === 'reject' ? '#ef4444' : '#22c55e' }}
              >
                {box.status === 'reject' ? '✕' : '✓'}
              </div>
            </div>
          ))}
        </div>

        {/* Send Notification */}
        <button
          onClick={() => setNotified(true)}
          className="absolute rounded-3xl border-none bg-[rgba(9,9,9,0.85)] text-white flex items-center justify-center text-[34px] leading-none cursor-pointer z-[1]"
          style={pillBtnStyle}
        >
          ›
        </button>
      </div>
    </div>
  );
}
