import { useEffect, useRef, useState } from 'react';
import { useRobotWS } from '../hooks/useRobotWS';
import { UserManualPage } from './UserManual';

interface Props {
  onComplete: () => void;
  onBack: () => void;
  onMounted?: () => void;
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

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
              background: active ? hexToRgba(step.color, OVERLAY_OPACITY) : hexToRgba(FUTURE_TAB_BG, OVERLAY_OPACITY),
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
      style={{ right: -25, bottom: -5, width: 60 }}
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
          background: ptt ? hexToRgba('#d5d0bd', OVERLAY_OPACITY) : hexToRgba('#d9d4c1', OVERLAY_OPACITY),
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#111" stroke="#111" strokeWidth="0" strokeLinecap="round">
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" fill="none" stroke="#111" strokeWidth="2" />
          <line x1="12" y1="18" x2="12" y2="22" stroke="#111" strokeWidth="2" />
          <line x1="9" y1="22" x2="15" y2="22" stroke="#111" strokeWidth="2" />
        </svg>
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
        style={{ right: -25, top: 15, width: 60, height: 48, background: hexToRgba(color, OVERLAY_OPACITY), color: '#2c220d' }}
      >
        ‹
      </button>
      <button
        onClick={onForward}
        className="absolute flex items-center justify-center text-[34px] leading-none font-bold rounded-[34px] border-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] cursor-pointer z-[1]"
        style={{
          right: -25, top: 80, bottom: 71.5, width: 60,
          background: hexToRgba(color, OVERLAY_OPACITY), color: '#2c220d',
        }}
      >
        ›
      </button>
    </>
  );
}

function StreamStatsOverlay({ stats, connected }: { stats: { fps: number; kbps: number } | null; connected: boolean }) {
  return (
    <div
      className="absolute z-[1] flex items-center gap-1.5 px-2.5 rounded-full text-[10px] font-mono tracking-wide"
      style={{
        bottom: 29,
        left: '50%',
        transform: 'translateX(-50%)',
        height: 22,
        background: '#d9d4c1',
        color: '#2b271f',
        border: '1px solid rgba(0,0,0,0.08)',
        opacity: OVERLAY_OPACITY,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
          background: connected ? '#22c55e' : '#ef4444',
        }}
      />
      {connected && stats ? (
        <>
          <span>{stats.fps} fps</span>
          <span style={{ opacity: 0.35 }}>·</span>
          <span>{stats.kbps} KB/s</span>
        </>
      ) : (
        <span>offline</span>
      )}
    </div>
  );
}

function CameraFeed() {
  const [err, setErr] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // src is set here (not as a JSX prop) so the stream connection is tied to the effect lifecycle.
  // Setting src in JSX would restart the connection on every Strict Mode remount, causing duplicates.
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    img.src = '/video';
    return () => { img.src = ''; };
  }, []);

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: err ? 'linear-gradient(180deg, #51483e 0%, #2d2c2b 100%)' : '#111' }}
    >
      {!err && (
        <img
          ref={imgRef}
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

export function StepExecutionPage({ onComplete, onBack, onMounted }: Props) {
  const [stepIdx, setStepIdx]       = useState(0);
  const [ptt, setPtt]               = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [helpExpanded, setHelpExpanded] = useState(true);

  useEffect(() => {
    onMounted?.();
    const t = setTimeout(() => setHelpExpanded(false), 10000);
    return () => clearTimeout(t);
  }, []);
  const { videoStats, connected }   = useRobotWS();

  const step = STEPS[stepIdx]!;

  function goForward() {
    if (stepIdx < STEPS.length - 1) { setStepIdx(i => i + 1); return; }
    onComplete();
  }

  function goBack() {
    if (stepIdx > 0) { setStepIdx(i => i - 1); return; }
    onBack();
  }

  if (showManual) {
    return <UserManualPage onClose={() => setShowManual(false)} />;
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <div className="relative w-full h-full bg-black select-none font-sans">
        <div className="relative w-full h-full overflow-hidden">

          <div className="absolute inset-0 z-0">
            <CameraFeed />
          </div>

          <div
            className="absolute z-[1]"
            style={{
              top:    'env(safe-area-inset-top, 0px)',
              right:  'env(safe-area-inset-right, 0px)',
              bottom: 'env(safe-area-inset-bottom, 0px)',
              left:   'env(safe-area-inset-left, 0px)',
            }}
          >
            <div
              className="absolute flex items-center gap-3 min-w-0"
              style={{ left: 0, top: 24.5, right: 50 }}
            >
              <ProgressTabs stepIdx={stepIdx} />
            </div>

            <PttButton ptt={ptt} setPtt={setPtt} />
            <StreamStatsOverlay stats={videoStats} connected={connected} />

            <button
              onClick={() => setShowManual(true)}
              className="absolute flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.08)] cursor-pointer z-[1] overflow-hidden"
              style={{
                left: 0, bottom: -5,
                height: 60,
                width: helpExpanded ? 160 : 60,
                borderRadius: helpExpanded ? 30 : '50%',
                border: '1px solid rgba(0,0,0,0.08)',
                background: `rgba(217, 212, 193, ${OVERLAY_OPACITY})`,
                transition: 'width 0.4s ease, border-radius 0.4s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                className="text-[19px] font-semibold text-[#2b271f] px-4 absolute"
                style={{ opacity: helpExpanded ? 1 : 0, transition: 'opacity 0.25s ease' }}
              >First time? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18, display: 'inline', verticalAlign: 'top', marginLeft: 2, marginTop: 3 }}><path d="M9 11.24V7.5C9 6.12 10.12 5 11.5 5S14 6.12 14 7.5v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.21 0-.62-.38-1.16-.91-1.41z"/></svg></span>
              <span
                className="text-[26px] font-bold text-[#2b271f] leading-none absolute"
                style={{ opacity: helpExpanded ? 0 : 1, transition: 'opacity 0.25s ease 0.15s' }}
              >?</span>
            </button>

            <RightRail color={step.color} onBack={goBack} onForward={goForward} />
          </div>

        </div>
      </div>
    </div>
  );
}
