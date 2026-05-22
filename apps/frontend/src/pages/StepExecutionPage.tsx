import { useEffect, useState } from 'react';
import { VideoStats } from '../types';
import { useWebRTC } from '../hooks/useWebRTC';
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

function formatSpeed(kbs: number): string {
  if (kbs >= 1024) return `${(kbs / 1024).toFixed(1)} MB/s`;
  return `${kbs} KB/s`;
}

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

function RightRail({ color, onBack, onForward, showForward = true }: {
  color: string; onBack: () => void; onForward: () => void; showForward?: boolean;
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
      {showForward && (
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
      )}
    </>
  );
}

function DataOverlay({ onConfirm, onSkip }: { onConfirm: () => void; onSkip: () => void }) {
  return (
    <div
      className="absolute z-[2] flex flex-col items-end"
      style={{
        right: -25, top: 63, bottom: 55, width: 160, height: 152, marginTop: 'auto', marginBottom: 'auto',
        paddingRight: 8, paddingTop: 10, paddingBottom: 10, gap: 16,
        justifyContent: 'center',
        background: hexToRgba('#d9d4c1', OVERLAY_OPACITY),
        borderRadius: 34,
        border: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 22, fontWeight: 700, color: '#1e170d' }}>31°C</span>
        <button
          onClick={onConfirm}
          className="rounded-full flex items-center justify-center border-none cursor-pointer"
          style={{ width: 46, height: 46, background: '#84cc16', flexShrink: 0 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>
      <button
        onClick={onSkip}
        className="rounded-full flex items-center justify-center border-none cursor-pointer font-bold"
        style={{ width: 46, height: 46, background: '#ccc9bb', color: '#111', fontSize: 13, flexShrink: 0 }}
      >
        Skip
      </button>
    </div>
  );
}

const QA_QUESTIONS = ["Can you hear me?"];
type QAStatus = 'idle' | 'listening';

function QAOverlay({ ptt: _ptt, onSkip }: { ptt: boolean; onSkip: () => void }) {
  const [status, setStatus] = useState<QAStatus>('idle');

  function handleCircleClick() {
    if (status === 'idle') { setStatus('listening'); return; }
    if (status === 'listening') { onSkip(); }
  }

  return (
    <div
      className="absolute z-[2] flex items-center gap-4"
      style={{
        top: 63, bottom: 55, right: -25,
        height: 44, marginTop: 'auto', marginBottom: 'auto',
        background: hexToRgba('#d9d4c1', OVERLAY_OPACITY),
        borderRadius: 22,
        border: '1px solid rgba(0,0,0,0.10)',
        paddingLeft: 12, paddingRight: 0,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 19, fontWeight: 600, color: '#1e170d', marginLeft: 12 }}>
        {QA_QUESTIONS[0]}
      </span>
      <button
        onClick={handleCircleClick}
        className="flex items-center justify-center cursor-pointer"
        style={{
          width: 44, height: 44, flexShrink: 0,
          borderRadius: '50%',
          border: '3px solid white',
          background: 'transparent',
        }}
      >
        {status === 'idle' && (
          <div style={{ width: 31, height: 31, borderRadius: '50%', background: '#60afff' }} />
        )}
        {status === 'listening' && (
          <div style={{ width: 18, height: 18, borderRadius: 4, background: '#e63946' }} />
        )}
      </button>
    </div>
  );
}

function ShotOverlay({ onConfirm }: { onConfirm: () => void }) {
  const [phase, setPhase] = useState<'review' | 'capture'>('review');
  const btnStyle = { width: 60, height: 40, borderRadius: 34, border: 'none', cursor: 'pointer', flexShrink: 0 } as const;

  return (
    <div
      className="absolute z-[2] flex flex-col items-end justify-center"
      style={{ right: -25, top: 63, bottom: 55 }}
    >
      {phase === 'capture' ? (
        <div className="flex flex-col items-center" style={{ width: 60, gap: 16 }}>
          <button
            className="flex items-center justify-center"
            style={{ ...btnStyle, background: hexToRgba('#8b6cff', OVERLAY_OPACITY) }}
          >
            <svg width="24" height="22" viewBox="0 0 24 22" fill="#111">
              <path d="M9 0L7 3H2C.9 3 0 3.9 0 5v14c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-5L15 0H9zm3 16a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
            </svg>
          </button>

          <button
            className="flex items-center justify-center font-bold"
            style={{ ...btnStyle, background: hexToRgba('#e63946', OVERLAY_OPACITY), color: '#111', fontSize: 15 }}
          >
            Skip
          </button>

          <button
            onClick={onConfirm}
            className="flex items-center justify-center font-bold text-[28px] leading-none"
            style={{ ...btnStyle, background: hexToRgba('#84cc16', OVERLAY_OPACITY), color: '#111' }}
          >
            ›
          </button>
        </div>
      ) : (
        <div
          className="relative flex flex-col"
          style={{
            width: 370, height: 152,
            background: hexToRgba('#d9d4c1', OVERLAY_OPACITY),
            borderRadius: 16,
            border: '1px solid rgba(0,0,0,0.08)',
            padding: 10, paddingBottom: 10, gap: 0,
          }}
        >
          <div className="flex flex-1 gap-3" style={{ paddingRight: 82 }}>
            <div style={{ flex: 1, background: 'white', borderRadius: 10 }} />
            <div style={{ flex: 1, background: 'white', borderRadius: 10 }} />
          </div>

          <button
            onClick={() => setPhase('capture')}
            className="absolute flex items-center justify-center border-none cursor-pointer font-semibold"
            style={{ right: 10, top: '50%', transform: 'translateY(-50%)', background: hexToRgba('#8b6cff', OVERLAY_OPACITY), color: '#111', fontSize: 14, width: 72, height: 50, borderRadius: 25, whiteSpace: 'nowrap' }}
          >
            Got it!
          </button>

          <div className="flex" style={{ marginTop: -19 }}>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <button
                className="rounded-full flex items-center justify-center border-none cursor-pointer"
                style={{ width: 38, height: 38, background: hexToRgba('#e63946', OVERLAY_OPACITY) }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" stroke="white" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <button
                className="rounded-full flex items-center justify-center border-none cursor-pointer"
                style={{ width: 38, height: 38, background: hexToRgba('#22c55e', OVERLAY_OPACITY) }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            </div>
            <div style={{ width: 80 }} />
          </div>
        </div>
      )}
    </div>
  );
}

function StreamStatsOverlay({ stats, connected }: { stats: VideoStats | null; connected: boolean }) {
  return (
    <div
      className="absolute z-[1] flex items-center gap-1.5 px-2.5 rounded-full text-[10px] font-mono tracking-wide"
      style={{
        bottom: -5,
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
          <span>{formatSpeed(stats.kbps)}</span>
          {stats.latency_ms != null && (
            <>
              <span style={{ opacity: 0.35 }}>·</span>
              <span>{stats.latency_ms}ms</span>
            </>
          )}
        </>
      ) : (
        <span>connecting</span>
      )}
    </div>
  );
}

function CameraFeed({ videoRef, connected }: { videoRef: React.RefObject<HTMLVideoElement>; connected: boolean }) {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#111' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover block"
        style={{ filter: 'contrast(1.03) saturate(0.92)', display: connected ? 'block' : 'none' }}
      />
      {!connected && (
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
  const { videoRef, connected: rtcConnected, videoStats } = useWebRTC();

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
            <CameraFeed videoRef={videoRef} connected={rtcConnected} />
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
            <StreamStatsOverlay stats={videoStats} connected={rtcConnected} />

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

            <RightRail color={step.color} onBack={goBack} onForward={goForward} showForward={step.label !== 'DATA' && step.label !== 'QA' && step.label !== 'SHOT'} />
            {step.label === 'DATA' && <DataOverlay onConfirm={goForward} onSkip={goForward} />}
            {step.label === 'QA' && <QAOverlay ptt={ptt} onSkip={goForward} />}
            {step.label === 'SHOT' && <ShotOverlay onConfirm={onComplete} />}
          </div>

        </div>
      </div>
    </div>
  );
}
