import { useEffect, useRef, useState } from 'react';
import { ClockIcon, QuestionMarkCircleIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import { SurvivorProfile } from '../types';

type TrappedSince = 'earthquake' | 'later' | 'unknown';
type Gender       = 'male' | 'female' | 'unknown';
type AgeGroup     = 'child' | 'adult' | 'elderly' | 'unknown';

function formatElapsed(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${String(h)}h ${String(m).padStart(2, '0')}m`;
}

const A = '/create-profile/';

export function CreateProfilePage({ onComplete }: { onComplete: (p: SurvivorProfile) => void }) {
  const survivorCount = 3;
  const [trappedSince, setTrappedSince] = useState<TrappedSince>('unknown');
  const [gender,       setGender]       = useState<Gender>('unknown');
  const [ageGroup,     setAgeGroup]     = useState<AgeGroup>('unknown');

  const baseOffsetMs = (3 * 3600 + 42 * 60) * 1000;
  const mountTimeRef = useRef<number>(Date.now() - baseOffsetMs);
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

  const pill = (active: boolean) =>
    `border border-[#322116] border-solid rounded-[20px] px-4 py-[9px] text-[15px] font-medium cursor-pointer whitespace-nowrap select-none transition-colors duration-150 flex items-center gap-1.5 ${
      active
        ? 'bg-[#ffe0b8] !text-[rgba(0,0,0,0.8)]'
        : 'bg-[rgba(246,246,246,0.35)] !text-[rgba(0,0,0,0.65)]'
    }`;

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#efecde]">
      <div
        className="shrink-0 relative flex items-stretch overflow-hidden font-sans bg-[#efecde]"
        style={{ width: '100dvh', height: '100dvw', transform: 'rotate(90deg)' }}
      >

      {/* Orange left decoration */}
      <div className="absolute left-0 top-5 bottom-5 w-14 bg-[#e57321] rounded-[18px] z-0" />

      {/* Main card + overview tab */}
      <div className="flex-1 flex relative z-10 py-4 pl-10 pr-0">

        {/* Paper card */}
        <div
          className="flex-1 flex rounded-[20px] shadow-[2px_4px_20px_rgba(195,185,151,0.85)] overflow-hidden relative"
          style={{ backgroundImage: `url(${A}card-bg.png)`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          {/* Grain texture overlay — matches Figma mix-blend-color-burn @ 24% opacity */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              backgroundImage: `url(${A}texture-tile.webp)`,
              backgroundRepeat: 'repeat',
              backgroundSize: '512px 512px',
              mixBlendMode: 'color-burn',
              opacity: 0.24,
            }}
          />

          {/* Survivor badge */}
          <div className="absolute top-3 right-3 z-20 bg-[#ffe8cf] rounded-full px-3 py-1 flex items-center gap-1.5">
            <UserCircleIcon className="w-3.5 h-3.5 opacity-70 text-[#322116]" />
            <span className="text-[12px] font-medium" style={{ color: '#322116' }}>Survivor #{survivorCount}</span>
          </div>

          {/* Left section — timer + trapped since */}
          <div className="w-[46%] flex flex-col p-5 pr-4 shrink-0">

            {/* Timer card */}
            <div className="bg-[#ffe8cf] rounded-[20px] px-4 py-3 mb-4">
              <div className="text-[12px] mb-1" style={{ color: '#5a3a1a' }}>Time since main earthquake</div>
              <div className="flex items-center gap-2">
                <ClockIcon className="w-6 h-6 text-black/80" />
                <span className="text-[22px] font-bold" style={{ color: 'rgba(0,0,0,0.8)' }}>{formatElapsed(elapsed)}</span>
              </div>
            </div>

            {/* Trapped since */}
            <div className="text-[17px] mb-3" style={{ color: '#322116' }}>Trapped since:</div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setTrappedSince('earthquake')} className={pill(trappedSince === 'earthquake')}>
                  The beginning
                </button>
                <button onClick={() => setTrappedSince('unknown')} className={pill(trappedSince === 'unknown')}>
                  <QuestionMarkCircleIcon className="w-[18px] h-[18px] shrink-0 text-[#322318]/80" />
                  Unknown
                </button>
              </div>
              <button
                onClick={() => setTrappedSince('later')}
                className={`${pill(trappedSince === 'later')} !text-[rgba(0,0,0,0.38)] italic`}
              >
                or, type here
              </button>
            </div>
          </div>

          {/* Right section — basic info */}
          <div className="flex-1 flex flex-col p-5 pl-4 pt-4">

            <div className="text-[17px] font-bold mb-3" style={{ color: '#322116' }}>Basic Info:</div>

            {/* Gender */}
            <div className="flex gap-2 mb-3">
              <button onClick={() => setGender('female')} className={`${pill(gender === 'female')} !px-2.5`}>
                <span className="relative flex items-center justify-center w-[22px] h-[22px] shrink-0">
                  {gender === 'female' && (
                    <img src={`${A}female-fill.svg`} className="absolute inset-0 w-full h-full" alt="" />
                  )}
                  <img src={`${A}female-symbol.svg`} className="relative w-[13px] h-[13px]" alt="" />
                </span>
              </button>
              <button onClick={() => setGender('male')} className={`${pill(gender === 'male')} !px-2.5`}>
                <img src={`${A}male-symbol.svg`} className="w-[13px] h-[13px]" alt="" />
              </button>
              <button onClick={() => setGender('unknown')} className={pill(gender === 'unknown')}>
                <QuestionMarkCircleIcon className="w-[18px] h-[18px] shrink-0 text-[#322318]/80" />
                Unknown
              </button>
            </div>

            {/* Age group */}
            <div className="grid grid-cols-2 gap-2 flex-1 content-start">
              <button
                onClick={() => setAgeGroup('child')}
                className={`border border-[#322116] border-solid rounded-[20px] py-2.5 px-3 text-[15px] font-medium cursor-pointer flex items-center gap-2 select-none transition-colors duration-150 !text-[#322318] ${
                  ageGroup === 'child' ? 'bg-[#ffe0b8]' : 'bg-[rgba(246,246,246,0.35)]'
                }`}
              >
                <img src={`${A}child-icon.svg`} className="w-[18px] h-[15px] shrink-0" alt="" />
                Child
              </button>
              <button
                onClick={() => setAgeGroup('adult')}
                className={`border border-[#322116] border-solid rounded-[20px] py-2.5 px-3 text-[15px] font-medium cursor-pointer flex items-center gap-2 select-none transition-colors duration-150 !text-[#322318] ${
                  ageGroup === 'adult' ? 'bg-[#ffe0b8]' : 'bg-[rgba(246,246,246,0.35)]'
                }`}
              >
                <img src={`${A}child-icon.svg`} className="w-[18px] h-[15px] shrink-0" alt="" />
                Adult
              </button>
              <button
                onClick={() => setAgeGroup('elderly')}
                className={`border border-[#322116] border-solid rounded-[20px] py-2.5 px-3 text-[15px] font-medium cursor-pointer flex items-center gap-2 select-none transition-colors duration-150 !text-[#322318] ${
                  ageGroup === 'elderly' ? 'bg-[#ffe0b8]' : 'bg-[rgba(246,246,246,0.35)]'
                }`}
              >
                <img src={`${A}child-icon.svg`} className="w-[18px] h-[15px] shrink-0" alt="" />
                Elderly
              </button>
              <button
                onClick={() => setAgeGroup('unknown')}
                className={`border border-[#322116] border-solid rounded-[20px] py-2.5 px-3 text-[15px] font-medium cursor-pointer flex items-center gap-2 select-none transition-colors duration-150 !text-[#322318] ${
                  ageGroup === 'unknown' ? 'bg-[#ffe0b8]' : 'bg-[rgba(246,246,246,0.35)]'
                }`}
              >
                <QuestionMarkCircleIcon className="w-[13px] h-[13px] shrink-0 text-[#322318]/80" />
                Unknown
              </button>
            </div>

            {/* Create Profile button */}
            <div className="flex justify-end pt-3">
              <button
                onClick={handleCreate}
                className="bg-[rgba(9,9,9,0.82)] rounded-[20px] px-5 py-2.5 text-[16px] font-semibold cursor-pointer border-none flex items-center gap-2.5 !text-white"
              >
                Create Profile
                <ArrowRightCircleIcon className="w-[18px] h-[18px] text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Overview tab */}
        <div className="w-9 flex items-center justify-center bg-[#f5c040] shrink-0">
          <span
            className="text-[13px] font-semibold whitespace-nowrap tracking-wide"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: '#322116' }}
          >
            Overview
          </span>
        </div>
      </div>
      </div>
    </div>
  );
}
