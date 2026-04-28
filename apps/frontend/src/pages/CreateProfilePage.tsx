import { useEffect, useRef, useState } from 'react';
import { SurvivorProfile } from '../types';

interface Props {
  onComplete: (profile: SurvivorProfile) => void;
}

type TrappedSince = 'earthquake' | 'later' | 'unknown';
type Gender = 'male' | 'female' | 'unknown';
type AgeGroup = 'child' | 'adult' | 'elderly' | 'unknown';

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${String(hours).padStart(2, '0')}h${String(minutes).padStart(2, '0')}min`;
}

export function CreateProfilePage({ onComplete }: Props) {
  const survivorCount = 3;
  const [trappedSince, setTrappedSince] = useState<TrappedSince>('unknown');
  const [gender, setGender] = useState<Gender>('unknown');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('unknown');
  const baseOffsetMs = (3 * 3600 + 42 * 60) * 1000;
  const mountTimeRef = useRef<number>(Date.now() - baseOffsetMs);
  const [elapsed, setElapsed] = useState<number>(baseOffsetMs);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Date.now() - mountTimeRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  function summaryText(): string {
    const age = ageGroup === 'unknown' ? 'Unknown age' : ageGroup.charAt(0).toUpperCase() + ageGroup.slice(1);
    const g = gender === 'unknown' ? 'Gender unknown' : gender === 'male' ? 'Male' : 'Female';
    const t =
      trappedSince === 'earthquake'
        ? 'trapped since the earthquake'
        : trappedSince === 'later'
        ? 'trapped later'
        : 'time trapped unknown';
    return `${age} victim: ${g} and ${t}`;
  }

  function handleCreate() {
    onComplete({
      id: `S-00${survivorCount}`,
      trappedSince,
      gender,
      ageGroup,
      earthquakeTime: new Date(mountTimeRef.current),
    });
  }

  const pillBase: React.CSSProperties = {
    flex: 1,
    border: '1.5px solid rgba(0,0,0,0.12)',
    borderRadius: 28,
    padding: '10px 8px',
    fontSize: 15,
    fontFamily: 'var(--mk-sans)',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'center',
    background: '#ece9d8',
    color: '#322116',
    transition: 'background 0.15s',
  };

  const pillActive: React.CSSProperties = {
    ...pillBase,
    background: '#ef7519',
    color: '#fff',
    border: '1.5px solid #ef7519',
  };

  const ageBtn = (val: AgeGroup): React.CSSProperties => ({
    flex: 1,
    minWidth: 0,
    padding: '14px 8px',
    borderRadius: 16,
    border: 'none',
    fontSize: 15,
    fontFamily: 'var(--mk-sans)',
    fontWeight: 500,
    cursor: 'pointer',
    background: ageGroup === val ? '#fcb179' : '#ece9d8',
    color: '#322116',
    transition: 'background 0.15s',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--mk-sans)',
        position: 'relative',
      }}
    >
      {/* Top orange gradient section */}
      <div
        style={{
          background: 'linear-gradient(180deg, #ff9240 0%, #f9b466 100%)',
          padding: '20px 20px 28px',
          flexShrink: 0,
        }}
      >
        {/* Survivor ID row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#22c55e',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 16, color: '#1a0d00', fontWeight: 500 }}>
            Survivor #S-00{survivorCount}
          </span>
        </div>

        {/* Elapsed time card */}
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: '14px 18px',
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)', marginBottom: 6 }}>
            Time since main earthquake
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 28,
              fontWeight: 700,
              color: '#322116',
            }}
          >
            <span style={{ fontSize: 20 }}>⏱</span>
            {formatElapsed(elapsed)}
          </div>
        </div>

        {/* Big question */}
        <h2
          style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 700,
            color: '#1a0d00',
            lineHeight: 1.25,
          }}
        >
          Was this person trapped from the beginning?
        </h2>
      </div>

      {/* Bottom beige section */}
      <div
        style={{
          background: '#f0eee1',
          flex: 1,
          padding: '20px 20px 120px',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {/* Trapped since options */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setTrappedSince('earthquake')}
            style={trappedSince === 'earthquake' ? pillActive : pillBase}
          >
            ✓ Yes, since the earthquake
          </button>
          <button
            onClick={() => setTrappedSince('later')}
            style={trappedSince === 'later' ? pillActive : pillBase}
          >
            ✓ No, trapped later
          </button>
          <button
            onClick={() => setTrappedSince('unknown')}
            style={{
              ...(trappedSince === 'unknown' ? pillActive : pillBase),
              flex: '0 0 auto',
              padding: '10px 14px',
              fontSize: 14,
            }}
          >
            Unknown
          </button>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: 'rgba(0,0,0,0.1)',
            marginBottom: 20,
          }}
        />

        {/* Basic Info heading */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#322116',
            marginBottom: 16,
          }}
        >
          Basic Info
        </div>

        {/* Gender row */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)', marginBottom: 10 }}>
            Gender
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {([
              { val: 'female' as Gender, label: '♀', icon: '👩' },
              { val: 'male' as Gender, label: '♂', icon: '👨' },
              { val: 'unknown' as Gender, label: '?', icon: '❓' },
            ] as const).map(({ val, icon }) => (
              <button
                key={val}
                onClick={() => setGender(val)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: gender === val ? '2px solid #ef7519' : '2px solid rgba(0,0,0,0.12)',
                  background: gender === val ? '#fff0e6' : '#ece9d8',
                  fontSize: 20,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Age group: 2x2 grid */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)', marginBottom: 10 }}>
            Age Group
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
          >
            {(['child', 'adult', 'elderly', 'unknown'] as AgeGroup[]).map((val) => (
              <button
                key={val}
                onClick={() => setAgeGroup(val)}
                style={ageBtn(val)}
              >
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Summary text */}
        <p
          style={{
            fontSize: 14,
            color: 'rgba(50,33,22,0.6)',
            margin: '0 0 20px',
            fontStyle: 'italic',
          }}
        >
          {summaryText()}
        </p>
      </div>

      {/* Create Profile button */}
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
          onClick={handleCreate}
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
          Create Profile →
        </button>
      </div>
    </div>
  );
}
