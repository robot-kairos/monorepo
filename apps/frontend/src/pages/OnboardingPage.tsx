interface Props {
  onStart: () => void;
}

interface StepCard {
  label: string;
  bg: string;
  zIndex: number;
  number: number;
  description?: string[];
}

const STEPS: StepCard[] = [
  {
    number: 5,
    label: 'Take A Photo',
    bg: '#af9bff',
    zIndex: 1,
  },
  {
    number: 4,
    label: 'Heart Rate Check',
    bg: '#c5b5ff',
    zIndex: 2,
  },
  {
    number: 3,
    label: 'Temperature Check',
    bg: '#80dedf',
    zIndex: 3,
  },
  {
    number: 2,
    label: 'Consciousness check',
    bg: '#f9a06a',
    zIndex: 4,
  },
  {
    number: 1,
    label: 'Reach the survivor',
    bg: '#f5d06a',
    zIndex: 5,
  },
  {
    number: 0,
    label: 'Basic Data Entry',
    bg: '#c8d982',
    zIndex: 6,
    description: ['Enter casualty details', 'rotate phone to landscape and clip it'],
  },
];

export function OnboardingPage({ onStart }: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f1efe3',
        paddingTop: 40,
        paddingBottom: 120,
        position: 'relative',
        fontFamily: 'var(--mk-sans)',
      }}
    >
      {/* Title */}
      <h1
        style={{
          fontFamily: '"Raleway", sans-serif',
          fontWeight: 200,
          fontSize: 72,
          color: '#ef7519',
          textAlign: 'center',
          margin: 0,
          lineHeight: 1,
        }}
      >
        MedKit
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontFamily: 'var(--mk-sans)',
          fontSize: 18,
          color: '#ef7519',
          textAlign: 'center',
          margin: '4px 0 0 0',
        }}
      >
        save resources, save lives
      </p>

      {/* Steps section */}
      <div
        style={{
          marginTop: 24,
          paddingLeft: 16,
          paddingRight: 16,
          position: 'relative',
        }}
      >
        {STEPS.map((step, idx) => {
          const isBottom = step.number === 0;
          const isFirst = idx === 0;
          const marginTop = isFirst ? 0 : -52;
          return (
            <div
              key={step.number}
              style={{
                position: 'relative',
                zIndex: step.zIndex,
                marginTop,
                borderRadius: 20,
                background: step.bg,
                minHeight: isBottom ? undefined : 110,
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                padding: isBottom
                  ? '60px 20px 22px'
                  : isFirst
                  ? '22px 20px'
                  : '18px 20px 0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'rgba(20,20,20,0.75)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}
                >
                  {step.number}
                </div>
                <span style={{ flex: 1, fontSize: 20, fontFamily: 'var(--mk-sans)', fontWeight: 600, color: '#1a1008' }}>
                  {step.label}
                </span>
                <div style={{
                  background: 'rgba(20,20,20,0.75)', color: '#fff',
                  borderRadius: 20, padding: '3px 10px',
                  fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  🕐 20s
                </div>
              </div>

              {isBottom && step.description && (
                <ul style={{ margin: '12px 0 0 38px', padding: 0, listStyle: 'disc', color: '#1a1008', fontSize: 14, lineHeight: 1.6 }}>
                  {step.description.map((line) => (
                    <li key={line} style={{ marginBottom: 2 }}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div style={{
        position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        display: 'flex', justifyContent: 'center',
        zIndex: 100, pointerEvents: 'none',
      }}>
        <button
          onClick={onStart}
          style={{
            pointerEvents: 'all', width: '80%', height: 48,
            background: 'rgba(9,9,9,0.85)', color: '#fff',
            border: 'none', borderRadius: 24,
            fontSize: 18, fontFamily: 'var(--mk-sans)', fontWeight: 600, cursor: 'pointer',
            letterSpacing: '0.01em',
          }}
        >
          Get Started →
        </button>
      </div>
    </div>
  );
}
