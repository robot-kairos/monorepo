import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { CameraIcon, MicrophoneIcon } from '@heroicons/react/24/solid';
import { RobotState, VideoStats } from '../types';
import { useWebRTC } from '../hooks/useWebRTC';
import { useRobotWS } from '../hooks/useRobotWS';
import { UserManualPage } from './UserManual';
import { DistanceStatusPill } from '../components/DistanceStatusPill';

interface Props {
  onComplete: () => void;
  onBack: () => void;
  onMounted?: () => void;
  webrtc: ReturnType<typeof useWebRTC>;
}

const STEPS = [
  { id: 1, label: 'REACH', color: 'var(--step-reach)' },
  { id: 2, label: 'DATA',  color: 'var(--step-data)'  },
  { id: 3, label: 'QA',    color: 'var(--step-qa)'    },
  { id: 4, label: 'SHOT',  color: 'var(--step-shot)'  },
];

const FUTURE_TAB_BG   = '#e9e4cf';
const FUTURE_TAB_TEXT = 'rgba(45, 40, 30, 0.38)';
const OVERLAY_OPACITY = 0.6;

function formatSpeed(kbs: number): string {
  if (kbs >= 1024) return `${(kbs / 1024).toFixed(1)} MB/s`;
  return `${kbs} KB/s`;
}

function withAlpha(color: string, alpha: number): string {
  return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`;
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
              background: active ? withAlpha(step.color, OVERLAY_OPACITY) : withAlpha(FUTURE_TAB_BG, OVERLAY_OPACITY),
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
          background: ptt ? withAlpha('#d5d0bd', OVERLAY_OPACITY) : withAlpha('#d9d4c1', OVERLAY_OPACITY),
        }}
      >
        <MicrophoneIcon className="w-6 h-6" style={{ color: '#111' }} />
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
        className="absolute flex items-center justify-center border-none cursor-pointer z-[1]"
        style={{ right: -25, top: 15, width: 60, height: 60, borderRadius: 30, background: withAlpha(color, OVERLAY_OPACITY), border: '1px solid rgba(0,0,0,0.08)' }}
      >
        <ChevronLeftIcon className="w-8 h-8" style={{ color: '#2c220d' }} strokeWidth={3} />
      </button>
      {showForward && (
        <button
          onClick={onForward}
          className="absolute flex items-center justify-center rounded-[34px] border-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] cursor-pointer z-[1]"
          style={{
            right: -25, top: 91, bottom: 71, width: 60,
            background: withAlpha(color, OVERLAY_OPACITY),
          }}
        >
          <ChevronRightIcon className="w-8 h-8" style={{ color: '#2c220d' }} strokeWidth={3} />
        </button>
      )}
    </>
  );
}

function DataOverlay({ onConfirm, onSkip, robotState }: {
  onConfirm: () => void;
  onSkip: () => void;
  robotState: RobotState;
}) {
  const { temperature, vitals, online } = robotState;
  const fmt = (v: number, decimals: number, unit: string) =>
    online ? `${v.toFixed(decimals)}${unit}` : '—';

  const rows = [
    { label: 'TEMP', value: fmt(temperature.object, 1, ' °C') },
    { label: 'HR',   value: fmt(vitals.hr,          0, ' bpm') },
    { label: 'BR',   value: fmt(vitals.br,          0, ' rpm') },
  ];

  return (
    <div
      className="absolute z-[2] flex flex-col"
      style={{
        right: -25, top: 75, bottom: 55, width: 176,
        marginTop: 'auto', marginBottom: 'auto', height: 'fit-content',
        paddingLeft: 16, paddingRight: 8, paddingTop: 12, paddingBottom: 10, gap: 6,
        background: withAlpha('#d9d4c1', OVERLAY_OPACITY),
        borderRadius: 34,
        border: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      {rows.map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#1e170d', opacity: 0.45, letterSpacing: '0.07em', width: 32 }}>{label}</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1e170d', flex: 1, textAlign: 'right' }}>{value}</span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 6 }}>
        <button
          onClick={onSkip}
          className="rounded-full flex items-center justify-center border-none cursor-pointer font-bold"
          style={{ width: 46, height: 46, background: '#ccc9bb', color: '#111', fontSize: 13, flexShrink: 0 }}
        >
          Skip
        </button>
        <button
          onClick={onConfirm}
          className="rounded-full flex items-center justify-center border-none cursor-pointer"
          style={{ width: 46, height: 46, background: '#84cc16', flexShrink: 0 }}
        >
          <CheckIcon className="w-5 h-5" style={{ color: '#111' }} strokeWidth={3} />
        </button>
      </div>
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
        top: 75, bottom: 55, right: -25,
        height: 44, marginTop: 'auto', marginBottom: 'auto',
        background: withAlpha('#d9d4c1', OVERLAY_OPACITY),
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
          <div style={{ width: 31, height: 31, borderRadius: '50%', background: 'var(--step-qa)' }} />
        )}
        {status === 'listening' && (
          <div style={{ width: 18, height: 18, borderRadius: 4, background: '#e63946' }} />
        )}
      </button>
    </div>
  );
}

function ShotOverlay({ onConfirm, videoElRef, capturedImage, setCapturedImage }: {
  onConfirm: () => void;
  videoElRef: { current: HTMLVideoElement | null };
  capturedImage: string | null;
  setCapturedImage: (img: string) => void;
}) {
  const btnStyle = { width: 60, height: 40, borderRadius: 34, border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', flexShrink: 0 } as const;

  function handleCapture() {
    const videoEl = videoElRef.current;
    if (!videoEl) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 640;
    canvas.height = videoEl.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));
  }

  return (
    <div
      className="absolute z-[2] flex flex-row items-center justify-end gap-3"
      style={{ right: -25, top: 75, bottom: 55 }}
    >
      {capturedImage && (
        <div
          style={{
            width: 110, height: 96,
            marginBottom: 56,
            borderRadius: 14,
            border: '1px solid rgba(0,0,0,0.08)',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <img src={capturedImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      <div className="flex flex-col items-center" style={{ width: 60, gap: 16 }}>
        <button
          onClick={handleCapture}
          className="flex items-center justify-center"
          style={{ ...btnStyle, background: withAlpha('var(--step-shot)', OVERLAY_OPACITY) }}
        >
          <CameraIcon className="w-6 h-6" style={{ color: '#111' }} />
        </button>

        <button
          onClick={onConfirm}
          className="flex items-center justify-center font-bold"
          style={{ ...btnStyle, background: withAlpha('#e63946', OVERLAY_OPACITY), color: '#111', fontSize: 15 }}
        >
          Skip
        </button>

        <button
          onClick={onConfirm}
          className="flex items-center justify-center"
          style={{ ...btnStyle, background: withAlpha('#84cc16', OVERLAY_OPACITY) }}
        >
          <ChevronRightIcon className="w-6 h-6" style={{ color: '#111' }} strokeWidth={3.5} />
        </button>
      </div>
    </div>
  );
}

function StreamStatsOverlay({ stats, connected, style }: { stats: VideoStats | null; connected: boolean; style: CSSProperties }) {
  return (
    <div
      className="absolute z-[1] flex items-center gap-1.5 px-2.5 rounded-full text-[10px] font-mono tracking-wide"
      style={{
        transform: 'translateX(-50%)',
        height: 22,
        background: '#d9d4c1',
        color: '#2b271f',
        border: '1px solid rgba(0,0,0,0.08)',
        opacity: OVERLAY_OPACITY,
        whiteSpace: 'nowrap',
        ...style
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

function CameraFeed({ setVideoEl, connected }: { setVideoEl: (el: HTMLVideoElement | null) => void; connected: boolean }) {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#111' }}>
      <video
        ref={setVideoEl}
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

export function StepExecutionPage({ onComplete, onBack, onMounted, webrtc }: Props) {
  const [stepIdx, setStepIdx]           = useState(0);
  const [ptt, setPtt]                   = useState(false);
  const [showManual, setShowManual]     = useState(false);
  const [helpExpanded, setHelpExpanded] = useState(true);
  const [shotImage, setShotImage]       = useState<string | null>(null);
  const { state: robotState }           = useRobotWS();

  useEffect(() => {
    onMounted?.();
    const t = setTimeout(() => setHelpExpanded(false), 10000);
    return () => clearTimeout(t);
  }, []);
  const { setVideoEl, videoElRef, connected: rtcConnected, videoStats } = webrtc;

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
    <div className="fixed inset-0 bg-black overflow-hidden">
      <div className="relative w-full h-full bg-black select-none font-sans">
        <div className="relative w-full h-full overflow-hidden">

          <div className="absolute inset-0 z-0">
            <CameraFeed setVideoEl={setVideoEl} connected={rtcConnected} />
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
              style={{ left: 0, top: 15, right: 50 }}
            >
              <ProgressTabs stepIdx={stepIdx} />
            </div>

            <PttButton ptt={ptt} setPtt={setPtt} />
            <StreamStatsOverlay style={{right: -35, bottom: -5,}} stats={videoStats} connected={rtcConnected} />

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

            <DistanceStatusPill
              distanceCm={Math.round(robotState.vitals.distance)}
              className="absolute z-[1]"
              style={{
                bottom: -5,
                left: helpExpanded ? 178 : 78,
                transition: 'left 0.4s ease',
              }}
            />

            <RightRail color={step.color} onBack={goBack} onForward={goForward} showForward={step.label !== 'DATA' && step.label !== 'QA' && step.label !== 'SHOT'} />
            {step.label === 'DATA' && <DataOverlay onConfirm={goForward} onSkip={goForward} robotState={robotState} />}
            {step.label === 'QA' && <QAOverlay ptt={ptt} onSkip={goForward} />}
            {step.label === 'SHOT' && <ShotOverlay onConfirm={onComplete} videoElRef={videoElRef} capturedImage={shotImage} setCapturedImage={setShotImage} />}
          </div>

        </div>
      </div>
      {showManual && <UserManualPage onClose={() => setShowManual(false)} />}
    </div>
  );
}
