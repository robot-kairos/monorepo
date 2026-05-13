import { useEffect, useState } from 'react';

const BG = '#f0ede0';

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
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden" style={{ background: BG }}>
      <div
        className="shrink-0 relative flex flex-col"
        style={{
          width: '100dvh',
          height: '100dvw',
          transform: 'rotate(90deg)',
          background: BG,
          fontFamily: 'var(--sans)',
          userSelect: 'none',
          paddingTop: SA_TOP,
          paddingRight: `calc(${SA_RIGHT} + 56px)`,
          paddingBottom: SA_BOTTOM,
          paddingLeft: SA_LEFT,
          boxSizing: 'border-box',
          gap: 12,
        }}
      >
        {/* Title */}
        <h2 className="m-0 text-[26px] font-bold text-[#1a1008] text-center">
          Waiting for suggestion
        </h2>

        {/* Progress bar */}
        <div className="h-[7px] bg-[rgba(0,0,0,0.1)] rounded-[4px] overflow-hidden">
          <div
            className="h-full w-[65%] rounded-[4px]"
            style={{ background: 'linear-gradient(90deg, #ef7519, #ff9240)' }}
          />
        </div>

        {/* Priority care toggle */}
        <div className="flex items-center gap-2.5 py-2.5 px-3.5 bg-[rgba(255,255,255,0.7)] rounded-[14px]">
          <span className="flex-1 text-[14px] text-[#1a1008]">
            If U Request Priority Care... 📞
          </span>
          <div
            onClick={() => setPriorityCare(p => !p)}
            className="w-11 h-[26px] rounded-[13px] cursor-pointer relative transition-[background] duration-200 shrink-0"
            style={{ background: priorityCare ? '#ef7519' : 'rgba(0,0,0,0.14)' }}
          >
            <div
              className="absolute w-5 h-5 rounded-full bg-white top-[3px] shadow-[0_1px_4px_rgba(0,0,0,0.2)] transition-[left] duration-200"
              style={{ left: priorityCare ? 21 : 3 }}
            />
          </div>
        </div>

        {/* AI suggestion box */}
        <div className="flex-1 bg-[rgba(255,255,255,0.7)] rounded-[14px] py-3.5 px-4 min-h-0">
          <div className="text-[13px] text-[rgba(0,0,0,0.38)]">AI suggestion:</div>
        </div>

        {/* Continue button */}
        <button
          onClick={onNext}
          className="absolute right-3 rounded-3xl border-none bg-[rgba(9,9,9,0.85)] text-white flex items-center justify-center text-[34px] leading-none cursor-pointer z-[1]"
          style={{ top: 80, bottom: 14, width: 44 }}
        >
          ›
        </button>
      </div>
    </div>
  );
}
