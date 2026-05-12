import { useEffect, useRef, useState } from 'react';
import { SurvivorProfile } from '../types';

const FONT = 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif';

type TrappedSince = 'earthquake' | 'later' | 'unknown';
type Gender       = 'male' | 'female' | 'unknown';
type AgeGroup     = 'child' | 'adult' | 'elderly' | 'unknown';

function formatElapsed(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${String(h)}h ${String(m).padStart(2, '0')}m`;
}

export function CreateProfilePage({ onComplete }: { onComplete: (p: SurvivorProfile) => void }) {
  const survivorCount = 3;
  const [trappedSince, setTrappedSince] = useState<TrappedSince>('unknown');
  const [gender,       setGender]       = useState<Gender>('unknown');
  const [ageGroup,     setAgeGroup]     = useState<AgeGroup>('unknown');

  useEffect(() => {
    document.body.style.backgroundColor = '#ff9240';
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  const baseOffsetMs  = (3 * 3600 + 42 * 60) * 1000;
  const mountTimeRef  = useRef<number>(Date.now() - baseOffsetMs);
  const [elapsed, setElapsed] = useState<number>(baseOffsetMs);

  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - mountTimeRef.current), 1000);
    return () => clearInterval(id);
  }, []);

  function handleCreate() {
    onComplete({
      id: `${survivorCount}`,
      trappedSince, gender, ageGroup,
      earthquakeTime: new Date(mountTimeRef.current),
    });
  }

  // ── style helpers ──────────────────────────────────────────────────────────
  const pillBase = (active: boolean): React.CSSProperties => ({
    flex: 1,
    border: active ? '1.5px solid #ef7519' : '1.5px solid rgba(0,0,0,0.12)',
    borderRadius: 28, padding: '11px 8px',
    fontSize: 15, fontFamily: FONT, fontWeight: 500,
    cursor: 'pointer', textAlign: 'center',
    background: active ? '#ef7519' : '#ece9d8',
    color: active ? '#fff' : '#322116',
    transition: 'background 0.15s',
  });

  const ageBtn = (val: AgeGroup): React.CSSProperties => ({
    padding: '14px 8px', borderRadius: 16, border: 'none',
    fontSize: 15, fontFamily: FONT, fontWeight: 500, cursor: 'pointer',
    background: ageGroup === val ? '#fcb179' : '#ece9d8',
    color: '#322116', transition: 'background 0.15s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  });

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', fontFamily: FONT, overflow: 'hidden' }}>

      {/* ── Top orange section ── */}
      <div style={{
        background: 'linear-gradient(180deg, #ff9240 0%, #f9b466 100%)',
        padding: '16px 20px 20px', flexShrink: 0,
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
        boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
      }}>
        {/* Survivor ID */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
          <span style={{ fontSize: 16, color: '#1a0d00', fontWeight: 500 }}>
            Survivor #{survivorCount}
          </span>
        </div>

        {/* Elapsed time */}
        <div style={{
          background: '#fff', borderRadius: '2.5rem', padding: '16px 16px', marginBottom: 22,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div style={{ fontSize: '1rem', color: '#000', marginBottom: 4 }}>
            Time since main earthquake
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 26, fontWeight: 700, color: '#322116' }}>
            <span style={{ fontSize: 18 }}>⏱</span>
            {formatElapsed(elapsed)}
          </div>
        </div>

        {/* Question */}
        <h2 style={{ margin: '0 0 14px', fontSize: '2rem', width: '70%', fontWeight: 400, color: '#1a0d00', lineHeight: 1.25 }}>
          Was this person trapped from the beginning?
        </h2>

        {/* Trapped-since options */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setTrappedSince('earthquake')} style={pillBase(trappedSince === 'earthquake')}>
            ✓ Yes
          </button>
          <button onClick={() => setTrappedSince('later')} style={pillBase(trappedSince === 'later')}>
            ✗ No
          </button>
          <button onClick={() => setTrappedSince('unknown')} style={pillBase(trappedSince === 'unknown')}>
            ? Not sure
          </button>
        </div>
      </div>

      {/* ── Bottom beige section ── */}
      <div style={{
        background: '#f0eee1', flex: 1, padding: '16px 20px 0',
        display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto',
      }}>
        {/* Basic Info */}
        <div style={{ fontSize: 20, fontWeight: 700, color: '#322116', marginBottom: 12 }}>Basic Info</div>

        {/* Gender */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)', marginBottom: 8 }}>Gender</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['female', 'male', 'unknown'] as Gender[]).map(val => (
              <button key={val} onClick={() => setGender(val)} style={pillBase(gender === val)}>
                {val[0].toUpperCase() + val.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Age group */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)', marginBottom: 8 }}>Age Group</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button onClick={() => setAgeGroup('child')}   style={ageBtn('child')}>😊 Child</button>
            <button onClick={() => setAgeGroup('adult')}   style={ageBtn('adult')}>😄 Adult</button>
            <button onClick={() => setAgeGroup('elderly')} style={ageBtn('elderly')}>🧓 Elderly</button>
            <button onClick={() => setAgeGroup('unknown')} style={ageBtn('unknown')}>? Unknown</button>
          </div>
        </div>
      </div>

      {/* Create Profile button */}
      <div style={{ background: '#f0eee1', padding: '8px 20px 28px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <button onClick={handleCreate} style={{
          width: '80%', height: 48,
          background: 'rgba(9,9,9,0.85)', color: '#fff',
          border: 'none', borderRadius: 24,
          fontSize: 18, fontFamily: FONT, fontWeight: 600, cursor: 'pointer',
        }}>Create Profile →</button>
      </div>
    </div>
  );
}
