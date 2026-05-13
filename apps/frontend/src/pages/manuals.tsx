// rotate(+90deg) axis mapping: CSS top→visual left (notch), right→visual bottom (home), bottom→visual right, left→visual top
const SA_LEFT   = 'max(20px, env(safe-area-inset-top))';
const SA_RIGHT  = 'max(12px, env(safe-area-inset-bottom))';

const BG            = '#f0eee1';
const CARD_BG       = '#fff';
const TEXT          = '#322318';
const TEXT_DIM      = 'rgba(50,35,24,0.6)';
const ORANGE        = '#fa9b52';
const PROGRESS_TRACK = '#eedcbe';

interface Props {
  onClose?: () => void;
  /** 0–1 fraction of progress shown in the right-rail bar */
  progress?: number;
}

const STEPS = [
  { id: 1, label: 'Move the Tank Forward' },
  { id: 2, label: 'Move the Arm Closer' },
];

export function ManualsPage({ onClose, progress = 0.45 }: Props) {
  const pct = `${Math.max(0, Math.min(1, progress)) * 100}%`;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: BG }}
    >
      <div
        className="shrink-0 relative"
        style={{
          width: '100dvh',
          height: '100dvw',
          transform: 'rotate(90deg)',
          background: BG,
          fontFamily: 'var(--display)',
        }}
      >
        {/* Title */}
        <div
          className="absolute font-semibold uppercase"
          style={{
            top: 20,
            left: `calc(${SA_LEFT} + 4px)`,
            right: 72,
            fontSize: 22,
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            color: TEXT,
          }}
        >
          Reach the Correct Position
          <br />
          before use of the arm
        </div>

        {/* Step cards */}
        <div
          className="absolute flex gap-3"
          style={{
            top: 88,
            left: `calc(${SA_LEFT} + 4px)`,
            right: 72,
            bottom: 20,
          }}
        >
          {STEPS.map(step => (
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
                  bottom: 14,
                  left: 14,
                  right: 14,
                  fontSize: 15,
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

        {/* Right rail: close button + vertical progress bar */}
        <div
          className="absolute flex flex-col items-center gap-3"
          style={{
            top: 20,
            right: `calc(${SA_RIGHT} + 8px)`,
            bottom: 20,
            width: 50,
          }}
        >
          <button
            onClick={onClose}
            className="shrink-0 flex items-center justify-center rounded-full border-none cursor-pointer"
            style={{
              width: 50,
              height: 50,
              background: 'rgba(0,0,0,0.82)',
              color: '#fff',
              fontSize: 18,
            }}
          >
            ✕
          </button>

          <div
            className="flex-1 relative rounded-[20px] overflow-hidden"
            style={{ width: 26, background: PROGRESS_TRACK }}
          >
            <div
              className="absolute bottom-0 left-0 right-0 rounded-[20px]"
              style={{ height: pct, background: ORANGE }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
