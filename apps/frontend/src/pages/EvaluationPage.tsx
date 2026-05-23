import { useState } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { VideoStats } from '../types';
import { UserManualPage } from './UserManual';

interface Props {
  onComplete: () => void;
}

const OVERLAY_OPACITY = 0.6;

function withAlpha(color: string, alpha: number): string {
  return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`;
}

function formatSpeed(kbs: number): string {
  if (kbs >= 1024) return `${(kbs / 1024).toFixed(1)} MB/s`;
  return `${kbs} KB/s`;
}

function EvaluationTab() {
  return (
    <div className="flex items-stretch w-full min-w-0">
      <div
        className="min-w-0 h-8 relative flex items-center gap-2 text-[16px] font-semibold tracking-[-0.01em] w-full"
        style={{
          border: '1.3px solid #1e170d',
          borderRadius: 7,
          background: withAlpha('var(--step-data)', OVERLAY_OPACITY),
          color: 'white',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)',
          paddingLeft: 10, paddingRight: 10,
        }}
      >
        <span className="truncate font-bold">EVALUATION IN PROCESS</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="9" />
          <polyline points="8 12 11 15 16 9" />
        </svg>
      </div>
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
        <svg width="22" height="26" viewBox="0 0 24 24" fill="#111" stroke="#111" strokeWidth="0" strokeLinecap="round">
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" fill="none" stroke="#111" strokeWidth="2" />
          <line x1="12" y1="18" x2="12" y2="22" stroke="#111" strokeWidth="2" />
          <line x1="9" y1="22" x2="15" y2="22" stroke="#111" strokeWidth="2" />
        </svg>
      </button>
    </div>
  );
}

function CompleteButton({ onComplete }: { onComplete: () => void }) {
  return (
    <button
      onClick={onComplete}
      className="absolute flex items-center justify-center cursor-pointer z-[1]"
      style={{ right: -25, top: 15, width: 60, height: 60, borderRadius: 30, background: withAlpha('var(--step-data)', OVERLAY_OPACITY), border: '1px solid rgba(0,0,0,0.08)' }}
    >
      <svg width="30" height="36" viewBox="0 0 24 24" fill="none" stroke="#2c220d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
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

export function EvaluationPage({ onComplete }: Props) {
  const [ptt, setPtt] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [helpExpanded, setHelpExpanded] = useState(false);
  const { videoRef, connected: rtcConnected, videoStats } = useWebRTC();

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
              style={{ left: 0, top: 15, right: 50 }}
            >
              <EvaluationTab />
            </div>

            <PttButton ptt={ptt} setPtt={setPtt} />
            <StreamStatsOverlay stats={videoStats} connected={rtcConnected} />

            <button
              onClick={() => setShowManual(true)}
              onMouseEnter={() => setHelpExpanded(true)}
              onMouseLeave={() => setHelpExpanded(false)}
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

            <CompleteButton onComplete={onComplete} />

            {/* Bottom center status box */}
            <div
              className="absolute flex items-center gap-3 z-[1]"
              style={{
                bottom: -5, left: '50%', transform: 'translateX(-50%)',
                height: 74,
                paddingLeft: 26, paddingRight: 28,
                background: withAlpha('#d9d4c1', OVERLAY_OPACITY),
                borderRadius: 18,
                border: '1px solid rgba(0,0,0,0.08)',
                whiteSpace: 'nowrap',
              }}
            >
              <div className="rounded-full flex items-center justify-center flex-shrink-0"
                style={{ width: 46, height: 46, background: '#ef4444', border: '1.5px solid rgba(0,0,0,0.7)' }}>
                <span style={{ color: '#000', fontSize: 20, fontWeight: 700 }}>P1</span>
              </div>
              <div className="rounded-full flex items-center justify-center flex-shrink-0"
                style={{ width: 46, height: 46, background: '#f6c340', border: '1.5px solid rgba(0,0,0,0.7)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1e170d">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                  <path d="M5.5 3.2 4.1 1.8A10.93 10.93 0 0 0 1 9h2c0-2.61 1.07-4.97 2.8-6.67l-.3-.13zM21 9h2a10.93 10.93 0 0 0-3.1-7.19L18.5 3.2C20.23 4.9 21 7.26 21 9z" opacity="0.6"/>
                </svg>
              </div>
              <span style={{ fontSize: 24, fontWeight: 500, color: '#1e170d' }}>Help is coming!</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
