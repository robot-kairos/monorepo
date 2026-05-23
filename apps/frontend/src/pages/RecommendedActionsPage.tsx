import { useState } from 'react';
import { PowerIcon } from '@heroicons/react/24/outline';
import { SurvivorProfile } from '../types';

const imgTexture = '/tutorial/texture.png';

// One row of 4 words spaced ~230 px apart — no vertical overlap at -17.21 deg
const WATERMARKS = [
  { top: 12, left:  -20, gradient: 'linear-gradient(172.64deg, #ffc481 11.1%, #ffa86d 78.9%)' },
  { top: 18, left:  225, gradient: 'linear-gradient(172.64deg, #ffba6d 11.1%, #ffa86d 78.9%)' },
  { top: 12, left:  455, gradient: 'linear-gradient(172.64deg, #ffbc71 11.1%, #ffa86d 78.9%)' },
  { top: 18, left:  675, gradient: 'linear-gradient(172.64deg, #f9b066 11.1%, #ffa86d 78.9%)' },
];

interface Props {
  profile: SurvivorProfile;
  onComplete: () => void;
}

type ActionStatus = 'accepted' | 'rejected';

interface Action {
  id: number;
  status: ActionStatus;
}

export function RecommendedActionsPage({ profile: _profile, onComplete }: Props) {
  const [actions] = useState<Action[]>([
    { id: 1, status: 'rejected' },
    { id: 2, status: 'accepted' },
    { id: 3, status: 'accepted' },
  ]);

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none font-sans flex flex-col"
      style={{ background: 'linear-gradient(180deg, #ff8b3a 0%, #f7c37f 42.3%, #edebde 100%)' }}
    >
      {/* Texture — same as TutorialPage */}
      <div className="absolute inset-0 pointer-events-none mix-blend-color-burn opacity-25 z-0">
        <img alt="" className="absolute inset-0 w-full h-full object-cover" src={imgTexture} />
      </div>

      {/* Kairos watermarks — individual words, top area only, same style as TutorialPage */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {WATERMARKS.map((wm, i) => (
          <span
            key={i}
            className="absolute text-[84px] font-display font-semibold select-none whitespace-nowrap leading-[71px]"
            style={{
              top: wm.top,
              left: wm.left,
              transform: 'rotate(-17.21deg)',
              backgroundImage: wm.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Kairos
          </span>
        ))}
      </div>

      {/* Phone side button pill */}
      <div
        className="absolute bg-black/70 rounded-full z-10"
        style={{ left: 4, top: '50%', transform: 'translateY(-50%)', width: 5, height: 56 }}
      />

      {/* Power / exit button — top right */}
      <button
        onClick={onComplete}
        className="absolute flex items-center justify-center cursor-pointer z-20"
        style={{
          right: 14, top: 15,
          width: 60, height: 60, borderRadius: 30,
          background: 'rgba(239, 68, 68, 0.7)',
          border: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <PowerIcon className="w-7 h-7 text-white" strokeWidth={2.5} />
      </button>

      {/* Title */}
      <h2
        className="font-bold relative z-10"
        style={{
          fontSize: 36, color: '#1a1200', letterSpacing: '-0.01em',
          paddingTop: 34, paddingBottom: 0, paddingLeft: 58,
        }}
      >
        Recommended Actions
      </h2>

      {/* Cards — vertically centered in remaining space */}
      <div
        className="flex-1 flex flex-col justify-start relative z-10"
        style={{ paddingLeft: 58, paddingRight: 14, paddingTop: 15, paddingBottom: 20 }}
      >
        <div className="flex" style={{ gap: 14, height: 235 }}>
          {actions.map(action => (
            <div
              key={action.id}
              className="flex-1 flex flex-col relative"
              style={{
                background: 'white',
                borderRadius: 14,
                boxShadow: '0 2px 8px rgba(80,50,10,0.15)',
                padding: '10px 10px 0',
              }}
            >
              <div
                className="flex-1 flex items-center justify-center text-[20px]"
                style={{ color: '#b0a898' }}
              >
                Animation...
              </div>

              {/* Status indicator — not interactive */}
              <div
                className="absolute rounded-full flex items-center justify-center"
                style={{
                  width: 52, height: 52,
                  bottom: -26, left: '50%', transform: 'translateX(-50%)',
                  background: action.status === 'accepted' ? '#22c55e' : '#ef4444',
                  border: '1.0px solid rgb(0, 0, 0)',
                }}
              >
                {action.status === 'accepted' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" stroke="white" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
