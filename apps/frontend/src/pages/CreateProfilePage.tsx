import { useEffect, useRef, useState } from 'react';
import { ClockIcon, QuestionMarkCircleIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import { SurvivorProfile } from '../types';

type TrappedSince = 'earthquake' | 'later' | 'unknown';
type Gender = 'male' | 'female' | 'unknown';
type AgeGroup = 'child' | 'adult' | 'elderly' | 'unknown';

function formatElapsed(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${String(h)}h ${String(m).padStart(2, '0')}m`;
}

const A = '/create-profile/';

export function CreateProfilePage({ onComplete }: { onComplete: (p: SurvivorProfile) => void }) {
  const survivorCount = 3;
  const [trappedSince, setTrappedSince] = useState<TrappedSince>('unknown');
  const [trappedNote, setTrappedNote] = useState('');
  const [gender, setGender] = useState<Gender>('unknown');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('unknown');
  const typeInputRef = useRef<HTMLInputElement>(null);

  const baseOffsetMs = (3 * 3600 + 42 * 60) * 1000;
  const mountTimeRef = useRef<number>(Date.now() - baseOffsetMs);
  const [elapsed, setElapsed] = useState<number>(baseOffsetMs);

  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - mountTimeRef.current), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (trappedSince === 'later') {
      const t = setTimeout(() => typeInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [trappedSince]);

  function handleCreate() {
    onComplete({
      id: `${survivorCount}`,
      trappedSince, gender, ageGroup,
      trappedNote: trappedSince === 'later' ? trappedNote : undefined,
      earthquakeTime: new Date(mountTimeRef.current),
    });
  }

  const pill = (active: boolean) =>
    `border border-[#322116] border-solid rounded-[20px] px-6.5 py-[7px] text-[15px] font-medium cursor-pointer whitespace-nowrap select-none transition-colors duration-150 flex items-center gap-1.5 ${active
      ? 'bg-[#ffe0b8] !text-[rgba(0,0,0,0.8)]'
      : 'bg-[rgba(246,246,246,0.35)] !text-[rgba(0,0,0,0.65)]'
    }`;

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#efecde]">
      <div className="relative w-full h-full flex items-stretch overflow-hidden font-sans bg-[#efecde]">

        <div
          className="absolute bottom-52 right-10 w-18 h-[120px] rounded-r-[15px] flex justify-center pl-8 pt-5 overflow-hidden shadow-[2px_3px_8px_rgba(100,75,30,0.28)]"
          style={{
            backgroundImage: `url(${A}card-bg.png)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-[#f5c040]/70 mix-blend-multiply rounded-l-[20px]" />
          <span
            className="relative z-10 text-[19px] font-medium whitespace-nowrap tracking-wide"
            style={{ writingMode: 'vertical-lr', color: '#322116' }}
          >
            Overview
          </span>
        </div>

        {/* Orange bottom envelope */}

        <div className="absolute bottom-0 left-10 right-10 h-25 bg-[#e57321] rounded-t-[30px] z-30" />

        <img
          src={`${A}bottom-envelope.png`}
          className="absolute bottom-0 left-10 right-10 h-20 pointer-events-none select-none z-40"
          style={{ width: 'calc(100% - 5rem)' }}
          alt=""
        />

        {/* Create Profile button */}
        <button
          onClick={handleCreate}
          className="absolute z-50 bg-[rgba(9,9,9,0.82)] rounded-[40px] px-18.5 py-2.5 text-[16px] font-regular cursor-pointer border-none flex items-center gap-2.5 !text-white"
          style={{ bottom: '15px', right: '56px' }}
        >
          Create Profile
          <ArrowRightCircleIcon className="w-[18px] h-[18px] text-white" />
        </button>

        {/* Main card */}
        <div className="flex-1 flex relative z-35 pt-20 pl-20 pr-20 pb-0">

          {/* Survivor badge — tab above the card, similar to Overview */}
          <div
            className="absolute top-11.5 left-25 z-0 flex items-center gap-1.5 px-4 py-2 rounded-t-[10px] overflow-hidden shadow-[0_-2px_8px_rgba(100,75,30,0.28)] bg-[#d4b96a]"
            style={{
              backgroundImage: `url(${A}card-bg.png)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-[#f5c040]/70 mix-blend-multiply" />
            <UserCircleIcon className="relative z-10 w-4 h-4 opacity-70 text-[#322116]" />
            <span className="relative z-10 text-[12px] font-medium whitespace-nowrap" style={{ color: '#322116' }}>
              Survivor #{survivorCount}
            </span>
          </div>

          {/* Paper card */}
          <div
            className="flex-1 flex rounded-[20px] shadow-[2px_4px_10px_rgba(195,185,151,0.85)] overflow-hidden relative"
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

            {/* Left section — timer + trapped since */}
            <div className="w-[46%] flex flex-col p-5 pr-4 shrink-0">

              <div
                className="rounded-[40px] px-4 py-3 mb-4 flex flex-col items-center text-center"
                style={{ backgroundColor: 'rgba(255, 224, 184, 0.9)' }}
              >
                <div className="text-[12px] mb-1" style={{ color: '#5a3a1a' }}>
                  Time since main earthquake
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-6 h-6 text-black/80" />
                  <span
                    className="text-[22px] font-bold"
                    style={{ color: 'rgba(0,0,0,0.8)' }}
                  >
                    {formatElapsed(elapsed)}
                  </span>
                </div>
              </div>

              {/* Trapped since */}
              <div className="text-[20px] mb-3" style={{ color: '#322116' }}>Trapped since:</div>
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
                {trappedSince === 'later' ? (
                  <input
                    ref={typeInputRef}
                    type="text"
                    value={trappedNote}
                    onChange={e => setTrappedNote(e.target.value)}
                    placeholder="specify when…"
                    className="border border-[#322116] border-solid rounded-[20px] px-4 py-[7px] text-[15px] font-medium bg-[#ffe0b8] text-[rgba(0,0,0,0.8)] placeholder:text-[rgba(0,0,0,0.35)] outline-none w-full"
                    style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
                  />
                ) : (
                  <button
                    onClick={() => setTrappedSince('later')}
                    className={`${pill(false)} !text-[rgba(0,0,0,0.38)] italic`}
                  >
                    or, type here
                  </button>
                )}
              </div>
            </div>

            {/* Right section — basic info */}
            <div className="flex-1 flex flex-col p-5 pl-4 pt-4">

              <div className="text-[20px] font-regular mb-3" style={{ color: '#322116' }}>Basic Info:</div>

              {/* Gender */}
              <div className="flex gap-2 mb-7">
                <button onClick={() => setGender('female')} className={`${pill(gender === 'female')} !rounded-full !p-0 w-[38px] h-[38px] shrink-0 !justify-center`}>
                  <span className="relative flex items-center justify-center w-[20px] h-[20px] shrink-0">
                    {gender === 'female' && (
                      <img src={`${A}female-fill.svg`} className="absolute inset-0 w-full h-full" alt="" />
                    )}
                    <img src={`${A}female-symbol.svg`} className="relative w-[13px] h-[13px]" alt="" />
                  </span>
                </button>
                <button onClick={() => setGender('male')} className={`${pill(gender === 'male')} !rounded-full !p-0 w-[38px] h-[38px] shrink-0 !justify-center`}>
                  <img src={`${A}male-symbol.svg`} className="w-[13px] h-[13px]" alt="" />
                </button>
                <button onClick={() => setGender('unknown')} className={pill(gender === 'unknown')}>
                  <QuestionMarkCircleIcon className="w-[18px] h-[18px] shrink-0 text-[#322318]/80" />
                  Unknown
                </button>
              </div>

              {/* Age group */}
              <div className="grid grid-cols-2 gap-2 content-start w-fit">
                <button
                  onClick={() => setAgeGroup('child')}
                  className={`border border-[#322116] border-solid rounded-[20px] py-2.5 px-10 text-[15px] font-medium cursor-pointer flex items-center gap-2 select-none transition-colors duration-150 !text-[#322318] ${ageGroup === 'child' ? 'bg-[#ffe0b8]' : 'bg-[rgba(246,246,246,0.35)]'
                    }`}
                >
                  <img src={`${A}child-icon.svg`} className="w-[18px] h-[15px] shrink-0" alt="" />
                  <span className="flex-1 text-center">Child</span>
                </button>
                <button
                  onClick={() => setAgeGroup('adult')}
                  className={`border border-[#322116] border-solid rounded-[20px] py-2.5 px-10 text-[15px] font-medium cursor-pointer flex items-center gap-2 select-none transition-colors duration-150 !text-[#322318] ${ageGroup === 'adult' ? 'bg-[#ffe0b8]' : 'bg-[rgba(246,246,246,0.35)]'
                    }`}
                >
                  <img src={`${A}adult-icon.svg`} className="w-[18px] h-[15px] shrink-0" alt="" />
                  <span className="flex-1 text-center">Adult</span>
                </button>
                <button
                  onClick={() => setAgeGroup('elderly')}
                  className={`border border-[#322116] border-solid rounded-[20px] py-2.5 px-10 text-[15px] font-medium cursor-pointer flex items-center gap-2 select-none transition-colors duration-150 !text-[#322318] ${ageGroup === 'elderly' ? 'bg-[#ffe0b8]' : 'bg-[rgba(246,246,246,0.35)]'
                    }`}
                >
                  <img src={`${A}elderly-icon.svg`} className="w-[18px] h-[15px] shrink-0" alt="" />
                  <span className="flex-1 text-center">Elderly</span>
                </button>
                <button
                  onClick={() => setAgeGroup('unknown')}
                  className={`border border-[#322116] border-solid rounded-[20px] py-2.5 px-10 text-[15px] font-medium cursor-pointer flex items-center gap-2 select-none transition-colors duration-150 !text-[#322318] ${ageGroup === 'unknown' ? 'bg-[#ffe0b8]' : 'bg-[rgba(246,246,246,0.35)]'
                    }`}
                >
                  <span className="text-[13px] font-medium leading-none shrink-0">?</span>
                  <span className="flex-1 text-center">Unknown</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
