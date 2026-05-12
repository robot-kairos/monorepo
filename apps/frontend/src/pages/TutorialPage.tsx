import { useEffect } from 'react';

const FONT = 'var(--sans)';
const WATERMARK_POSITIONS = [
  { top: -10, left: -40 },
  { top: 80,  left: 100 },
  { top: 190, left: -20 },
  { top: 280, left: 120 },
  { top: 390, left: -50 },
];

const STEPS = [
  { n: 1, label: 'Turn your phone sideways', img: '/tutorial-rotate.png',  imgW: 120 },
  { n: 2, label: 'Attach to controller',     img: '/tutorial-attach.png',  imgW: 90  },
  { n: 3, label: 'Ready to go',              img: '/tutorial-ready.png',   imgW: 110 },
];

function StepCircle({ n }: { n: number }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: 'rgba(20,20,20,0.75)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 700, flexShrink: 0,
    }}>{n}</div>
  );
}

export function TutorialPage({ onNext }: { onNext: () => void }) {
  useEffect(() => {
    document.body.style.backgroundColor = '#ff8b3a';
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  return (
    <div style={{
      minHeight: '95vh',
      background: 'linear-gradient(180deg, #ff8b3a 0%, #f7c37f 40%, #edebde 100%)',
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: FONT,
    }}>
      {/* Watermark */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {WATERMARK_POSITIONS.map((pos, i) => (
          <span key={i} style={{
            position: 'absolute', top: pos.top, left: pos.left,
            fontSize: 80, fontFamily: 'var(--display)', fontWeight: 200,
            color: '#fff', opacity: 0.15, transform: 'rotate(-17deg)',
            whiteSpace: 'nowrap', userSelect: 'none',
          }}>MedKit</span>
        ))}
      </div>

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 1, width: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        flex: 1, paddingBottom: 100,
      }}>
        <h2 style={{
          fontSize: 30, fontWeight: 700, textAlign: 'center',
          color: '#1a0d00', marginTop: 60, marginBottom: 0,
          lineHeight: 1.2, padding: '0 24px', whiteSpace: 'pre-line',
        }}>
          {'Set up\nyour controller'}
        </h2>

        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          width: '100%', marginTop: -40, flex: 1, justifyContent: 'space-evenly',
        }}>
          {STEPS.map(({ n, label, img, imgW }) => (
            <div key={n} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 10, width: '100%', padding: '0 24px',
            }}>
              <img src={img} alt={label} style={{ width: imgW, height: 'auto', objectFit: 'contain' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <StepCircle n={n} />
                <span style={{ fontSize: 17, color: '#1a0d00', fontWeight: 500 }}>{label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next button */}
      <div style={{
        position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        display: 'flex', justifyContent: 'center',
        zIndex: 100, pointerEvents: 'none',
      }}>
        <button onClick={onNext} style={{
          pointerEvents: 'all', width: '80%', height: 48,
          background: 'rgba(9,9,9,0.85)', color: '#fff',
          border: 'none', borderRadius: 24,
          fontSize: 18, fontFamily: FONT, fontWeight: 600, cursor: 'pointer',
        }}>
          Next →
        </button>
      </div>
    </div>
  );
}
