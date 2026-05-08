interface Props {
  onNext: () => void;
}

const WATERMARK_POSITIONS = [
  { top: -10, left: -40 },
  { top: 80, left: 100 },
  { top: 190, left: -20 },
  { top: 280, left: 120 },
  { top: 390, left: -50 },
];

export function TutorialPage({ onNext }: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #ff8b3a 0%, #f7c37f 40%, #edebde 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'var(--mk-sans)',
      }}
    >
      {/* Watermark: diagonal "MedKit" text repeated */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        {WATERMARK_POSITIONS.map((pos, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: pos.top,
              left: pos.left,
              fontSize: 80,
              fontFamily: '"Raleway", sans-serif',
              fontWeight: 200,
              color: '#fff',
              opacity: 0.15,
              transform: 'rotate(-17deg)',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            MedKit
          </span>
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1,
          paddingBottom: 100,
        }}
      >
        {/* Heading */}
        <h2
          style={{
            fontSize: 30,
            fontWeight: 600,
            textAlign: 'center',
            color: '#322116',
            marginTop: 120,
            marginBottom: 0,
            lineHeight: 1.2,
            padding: '0 24px',
          }}
        >
          Set up{'\n'}your controller
        </h2>

        {/* Steps */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
            width: '100%',
            marginTop: 32,
            flex: 1,
            justifyContent: 'space-evenly',
          }}
        >
          {/* Step 1: Turn your phone sideways */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '0 24px',
            }}
          >
            {/* Step number + label row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'flex-start' }}>
              <StepCircle n={1} />
              <span style={{ fontSize: 18, color: '#322116', fontWeight: 500 }}>
                Turn your phone sideways
              </span>
            </div>
            {/* Phone rotation illustration */}
            <div style={{ position: 'relative', height: 120, width: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src="https://www.figma.com/api/mcp/asset/f008a517-d782-4186-9d27-569af859a0fa"
                alt="Phone rotation"
                style={{ width: 200, height: 'auto', objectFit: 'contain' }}
              />
            </div>
          </div>

          {/* Step 2: Attach to controller */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '0 24px',
            }}
          >
            <img
              src="https://www.figma.com/api/mcp/asset/eb5959f5-6dca-4e3f-a79c-7732ae4bc903"
              alt="Controller"
              style={{ width: 130, height: 'auto', objectFit: 'contain' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'flex-start' }}>
              <StepCircle n={2} />
              <span style={{ fontSize: 18, color: '#322116', fontWeight: 500 }}>
                Attach to controller
              </span>
            </div>
          </div>

          {/* Step 3: Ready to go */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '0 24px',
            }}
          >
            <img
              src="https://www.figma.com/api/mcp/asset/e6b5f1a1-35d0-493a-bffe-ad6dfd6253c2"
              alt="Phone clipped to controller"
              style={{ width: 148, height: 'auto', objectFit: 'contain' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'flex-start' }}>
              <StepCircle n={3} />
              <span style={{ fontSize: 18, color: '#322116', fontWeight: 500 }}>
                Ready to go
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Next button */}
      <div
        style={{
          position: 'fixed',
          bottom: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 430,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 100,
          pointerEvents: 'none',
        }}
      >
        <button
          onClick={onNext}
          style={{
            pointerEvents: 'all',
            width: '80%',
            height: 48,
            background: 'rgba(9,9,9,0.85)',
            color: '#fff',
            border: 'none',
            borderRadius: 24,
            fontSize: 18,
            fontFamily: 'var(--mk-sans)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function StepCircle({ n }: { n: number }) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'rgba(20,20,20,0.75)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {n}
    </div>
  );
}
