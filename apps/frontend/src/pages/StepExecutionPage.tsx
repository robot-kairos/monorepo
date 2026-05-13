import { useState } from 'react';

interface Props {
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
const OVERLAY_OPACITY = 0.6;

function ProgressTabs({ stepIdx }: { stepIdx: number }) {
  const visible = STEPS.slice(stepIdx);
  return (
    <div className="flex items-stretch w-full min-w-0">
      {visible.map((step, i) => {
        const active = i === 0;
        const last   = i === visible.length - 1;
        return (
          <div
            key={step.id}
            className="min-w-0 h-8 relative flex items-center justify-center text-[16px] font-semibold tracking-[-0.01em]"
            style={{
              flex: active ? '1 0 0' : '0 0 23%',
              zIndex: visible.length - i,
              marginLeft: i === 0 ? 0 : -1,
              border: active ? '1.3px solid #1e170d' : `1.3px solid ${FUTURE_TAB_TEXT}`,
              borderRight: active ? '1.3px solid #000' : `1.3px solid ${FUTURE_TAB_TEXT}`,
              borderRadius: i === 0 && last ? 7 : i === 0 ? '7px 6px 6px 7px' : last ? '6px 7px 7px 6px' : 6,
              background: active ? step.color : FUTURE_TAB_BG,
              color: active ? '#1e170d' : FUTURE_TAB_TEXT,
              justifyContent: active && step.label !== 'REACH' ? 'flex-end' : 'center',
              boxShadow: active ? 'inset 0 0 0 1px rgba(255,255,255,0.18)' : undefined,
            }}
          >
            <span className="truncate px-2.5">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function PttButton({ ptt, setPtt }: { ptt: boolean; setPtt: (v: boolean) => void }) {
  return (
    <div
      className="absolute flex flex-col items-center gap-[3px] z-[1]"
      style={{ right: -15, bottom: 17, width: 60, opacity: OVERLAY_OPACITY }}
    >
      <button
        onMouseDown={() => setPtt(true)}
        onMouseUp={() => setPtt(false)}
        onMouseLeave={() => setPtt(false)}
        onTouchStart={(e) => { e.preventDefault(); setPtt(true); }}
        onTouchEnd={() => setPtt(false)}
        className="rounded-full flex flex-col items-center justify-center gap-0.5 shadow-[0_1px_4px_rgba(0,0,0,0.08)] cursor-pointer"
        style={{
          width: 60, height: 60,
          border: '1px solid rgba(0,0,0,0.08)',
          background: ptt ? '#d5d0bd' : '#d9d4c1',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#111" stroke="#111" strokeWidth="0" strokeLinecap="round">
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" fill="none" stroke="#111" strokeWidth="2" />
          <line x1="12" y1="18" x2="12" y2="22" stroke="#111" strokeWidth="2" />
          <line x1="9" y1="22" x2="15" y2="22" stroke="#111" strokeWidth="2" />
        </svg>
        <span className="text-[11px] font-bold text-[#2b271f] leading-none">Talk</span>
      </button>
    </div>
  );
}

function RightRail({ color, onBack, onForward }: {
  color: string; onBack: () => void; onForward: () => void;
}) {
  return (
    <>
      <button
        onClick={onBack}
        className="absolute flex items-center justify-center text-[30px] leading-none font-bold rounded-[34px] border-none cursor-pointer z-[1]"
        style={{ right: -15, top: 17, width: 60, height: 48, background: color, color: '#2c220d', opacity: OVERLAY_OPACITY }}
      >
        ‹
      </button>
      <button
        onClick={onForward}
        className="absolute flex items-center justify-center text-[34px] leading-none font-bold rounded-[34px] border-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] cursor-pointer z-[1]"
        style={{
          right: -15, top: 80, bottom: 92, width: 60,
          background: color, color: '#2c220d', opacity: OVERLAY_OPACITY,
        }}
      >
        ›
      </button>
    </>
  );
}

function CameraFeed() {
  const [err, setErr] = useState(false);
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: err ? 'linear-gradient(180deg, #51483e 0%, #2d2c2b 100%)' : '#111' }}
    >
      {!err && (
        <img
          src="http://localhost:8000/video"
          alt="camera feed"
          onError={() => setErr(true)}
          className="w-full h-full object-cover block"
          style={{ filter: 'contrast(1.03) saturate(0.92)' }}
        />
      )}
      {err && (
        <div
          className="absolute inset-0 grid place-items-center text-[rgba(255,255,255,0.58)] text-[14px] tracking-[0.18em]"
          style={{ background: 'radial-gradient(circle at 50% 36%, rgba(255,255,255,0.08), transparent 28%), linear-gradient(180deg, #5a5148 0%, #2f2e2b 100%)' }}
        >
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
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      <div
        className="shrink-0 bg-black select-none font-sans"
        style={{ width: '100dvh', height: '100dvw', transform: 'rotate(90deg)' }}
      >
        <div className="relative w-full h-full overflow-hidden">

          <div className="absolute inset-0 z-0">
            <CameraFeed />
          </div>

          <div
            className="absolute z-[1]"
            style={{
              top:    'env(safe-area-inset-right, 0px)',
              right:  'env(safe-area-inset-bottom, 0px)',
              bottom: 'env(safe-area-inset-left, 0px)',
              left:   'env(safe-area-inset-top, 0px)',
            }}
          >
            <div
              className="absolute flex items-center gap-3 min-w-0"
              style={{ left: 12, top: 17, right: 68, opacity: OVERLAY_OPACITY }}
            >
              <ProgressTabs stepIdx={stepIdx} />
            </div>

            <PttButton ptt={ptt} setPtt={setPtt} />

            <button
              className="absolute flex items-center justify-center rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.08)] cursor-pointer z-[1]"
              style={{
                left: 12, bottom: 17,
                width: 60, height: 60,
                border: '1px solid rgba(0,0,0,0.08)',
                background: '#d9d4c1',
                opacity: OVERLAY_OPACITY,
              }}
            >
              <span className="text-[26px] font-bold text-[#2b271f] leading-none">?</span>
            </button>

            <RightRail color={step.color} onBack={goBack} onForward={goForward} />
          </div>

        </div>
      </div>
    </div>
  );
}
