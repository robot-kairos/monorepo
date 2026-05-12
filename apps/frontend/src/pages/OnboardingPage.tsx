import { useEffect } from 'react';

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
    number: 4,
    label: 'Take A Photo',
    bg: '#AF9BFF',
    zIndex: 1,
  },
  {
    number: 3,
    label: 'Consciousness check',
    bg: '#80DEDF',
    zIndex: 2,
  },
  {
    number: 2,
    label: 'Data Collection',
    bg: '#f9a06a',
    zIndex: 3,
  },
  {
    number: 1,
    label: 'Reach the survivor',
    bg: '#FFC541',
    zIndex: 4,
  },
  {
    number: 0,
    label: 'Basic Data Entry',
    bg: '#CDDE6B',
    zIndex: 5,
    description: ['Enter casualty details', 'rotate phone to landscape and clip it'],
  },
];

export function OnboardingPage({ onStart }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = '#f1efe3';
    return () => {
      document.body.style.overflow = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  return (
    <div
      style={{
        height: '100svh',
        overflow: 'hidden',
        background: '#f1efe3',
        paddingTop: 40,
        position: 'relative',
        fontFamily: 'var(--mk-sans)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Title + Subtitle */}
      <div style={{ paddingTop: 20, paddingBottom: 26}}>
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
      </div>

      {/* Steps section */}
      <div
        style={{
          marginTop: 24,
          paddingLeft: 16,
          paddingRight: 16,
          position: 'relative',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {STEPS.map((step, idx) => {
          const isBottom = step.number === 0;
          const isFirst = idx === 0;
          const marginTop = isFirst ? 0 : -30;
          return (
            <div
              key={step.number}
              style={{
                position: 'relative',
                zIndex: step.zIndex,
                marginTop,
                borderRadius: isBottom ? '20px 20px 0 0' : 20,
                background: step.bg,
                minHeight: isBottom ? undefined : 110,
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                padding: isBottom
                  ? '29px 20px'
                  : isFirst
                  ? '29px 20px'
                  : '29px 20px',
                // marginBottom: isBottom ? 0 : 30,
                flex: isBottom ? 1 : undefined,
                ...(isBottom && { marginLeft: -16, marginRight: -16 }),
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'rgba(20,20,20,0.75)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, flexShrink: 0,
                  }}
                >
                  {step.number}
                </div>
                <span style={{ flex: 1, fontSize:  isBottom ? 28 : 23, fontFamily: 'var(--mk-sans)', fontWeight: isBottom ? 650 : 400, color: '#1a1008' }}>
                  {step.label}
                </span>
                <div style={{
                  background: 'rgba(20,20,20,0.75)', color: '#fff',
                  borderRadius: 20, padding: '3px 10px',
                  fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  20s
                </div>
              </div>

              {isBottom && step.description && (
                <ul style={{ margin: '18px 0 0 38px', padding: 0, listStyle: 'disc', color: '#1a1008', fontSize: 18, lineHeight: 1.8 }}>
                  {step.description.map((line) => (
                    <li key={line} style={{ marginBottom: 2 }}>{line}</li>
                  ))}
                </ul>
              )}

              {isBottom && (
                <div style={{ marginTop: 'auto', paddingTop: 24, display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={onStart}
                    style={{
                      width: '80%', height: 48,
                      background: 'rgba(9,9,9,0.85)', color: '#fff',
                      border: 'none', borderRadius: 24,
                      fontSize: 18, fontFamily: 'var(--mk-sans)', cursor: 'pointer',
                      letterSpacing: '0.01em',
                    }}
                  >
                    Get Started →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
