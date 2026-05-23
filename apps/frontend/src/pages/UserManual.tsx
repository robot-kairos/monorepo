import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const SA_LEFT  = 'max(20px, env(safe-area-inset-left))';
const SA_RIGHT = 'env(safe-area-inset-right, 0px)';

const BG             = '#f0eee1';
const CARD_BG        = '#fff';
const TEXT           = '#322318';
const TEXT_DIM       = 'rgba(50,35,24,0.6)';
const ORANGE         = '#fa9b52';
const PROGRESS_TRACK = '#eedcbe';

const MARGIN_V      = 24.5; // top & bottom margin; matches StepExecution progress-tabs top
const RAIL_W        = 56;   // button width; bar is thinner (right-aligned inside)
const BAR_W         = 20;   // vertical bar width
const CARDS_TOP     = 100;  // slight extra gap below title to shorten cards

const CONTENT_RIGHT = `calc(${SA_RIGHT} + ${RAIL_W + 14 - 25 - 13}px)`; // slightly narrower than max-wide

interface Props {
  onClose?: () => void;
  /** 0–1 fraction of progress shown in the right-rail bar */
  progress?: number;
}

const VIEWS = [
  {
    titleLines: ['Reach the Correct Position', 'before use of the arm'],
    steps: [
      { id: 1, label: 'Move the Tank Forward' },
      { id: 2, label: 'Move the Arm Closer' },
    ],
  },
  {
    titleLines: ['Position the Arm Properly', 'before Data Collection'],
    steps: [
      { id: 1, label: '10cm to the Forehead' },
      { id: 2, label: '10cm to the Chest' },
    ],
  },
];

export function UserManualPage({ onClose, progress = 0.5 }: Props) {
  const [viewIdx, setViewIdx] = useState(0);
  const view = VIEWS[viewIdx]!;

  function toggleView() {
    setViewIdx(i => (i + 1) % VIEWS.length);
  }

  const barTrack = viewIdx === 0 ? ORANGE        : PROGRESS_TRACK;
  const barFill  = viewIdx === 0 ? PROGRESS_TRACK : ORANGE;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden z-[10]"
      style={{ background: BG }}
    >
      <div
        className="relative w-full h-full"
        style={{ background: BG, fontFamily: 'var(--display)' }}
      >
        {/* Title */}
        <div
          className="absolute font-semibold uppercase"
          style={{
            top: MARGIN_V,
            left: `calc(${SA_LEFT} + 4px)`,
            right: CONTENT_RIGHT,
            fontSize: 22,
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            color: TEXT,
          }}
        >
          {view.titleLines[0]}
          <br />
          {view.titleLines[1]}
        </div>

        {/* Step cards */}
        <div
          className="absolute flex gap-3"
          style={{
            top: CARDS_TOP,
            left: `calc(${SA_LEFT} + 4px)`,
            right: CONTENT_RIGHT,
            bottom: MARGIN_V,
          }}
        >
          {view.steps.map(step => (
            <div
              key={step.id}
              className="flex-1 relative rounded-[24px]"
              style={{ background: CARD_BG }}
            >
              {/* Numbered step badge */}
              <div
                className="absolute flex items-center justify-center rounded-full"
                style={{
                  top: 12,
                  left: 12,
                  width: 26,
                  height: 26,
                  background: BG,
                  border: `1.5px solid ${TEXT}`,
                  fontFamily: 'var(--sans)',
                  fontSize: 14,
                  color: TEXT,
                }}
              >
                {step.id}
              </div>

              {/* Caption */}
              <div
                className="absolute uppercase"
                style={{
                  bottom: 20,
                  left: 14,
                  right: 14,
                  fontSize: 18,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.3,
                  color: TEXT_DIM,
                }}
              >
                {step.label}
              </div>
            </div>
          ))}
        </div>

        {/* Close button — fixed position, unchanged */}
        <button
          onClick={onClose}
          className="absolute flex items-center justify-center rounded-full border-none cursor-pointer"
          style={{
            top: MARGIN_V,
            right: `calc(${SA_RIGHT} - 25px)`,
            width: RAIL_W,
            height: RAIL_W,
            background: 'rgba(0,0,0,0.82)',
            color: '#fff',
          }}
        >
          <XMarkIcon width={28} height={28} style={{ strokeWidth: 2.4 }} />
        </button>

        {/* Two pill segments — same height as white cards */}
        <div
          className="absolute flex flex-col gap-[6px] items-end cursor-pointer"
          style={{
            top: CARDS_TOP,
            bottom: MARGIN_V,
            right: `calc(${SA_RIGHT} - 25px)`,
            width: RAIL_W,
          }}
          onClick={toggleView}
        >
          {[1, 0].map(idx => {
            const segFill = Math.max(0, Math.min(1, progress * 2 - idx));
            return (
              <div
                key={idx}
                className="flex-1 relative overflow-hidden"
                style={{
                  width: BAR_W,
                  background: barTrack,
                  borderRadius: BAR_W / 2,
                }}
              >
                <div
                  className="absolute top-0 left-0 right-0"
                  style={{
                    height: `${segFill * 100}%`,
                    background: barFill,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
