import { useEffect, useRef, useState } from 'react';
import { QuestionMarkCircleIcon, UserCircleIcon } from '@heroicons/react/24/solid';
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
    `border border-[#322116] border-solid rounded-[20px] px-6.5 py-[7px] text-[16px] font-medium cursor-pointer whitespace-nowrap select-none transition-colors duration-150 flex items-center gap-1.5 ${active
      ? 'cp-pill-active !text-[rgba(0,0,0,0.8)]'
      : 'bg-[rgba(246,246,246,0.35)] !text-[rgba(0,0,0,0.65)]'
    }`;

  return (
    <div className="fixed inset-0 overflow-hidden bg-white">
      <div className="relative w-full h-full flex items-stretch overflow-hidden font-sans bg-white">

        <div
          className="absolute bottom-43.5 right-10 w-20 h-[155px] rounded-r-[20px] flex items-center justify-center pl-8 overflow-hidden shadow-[2px_3px_8px_rgba(100,75,30,0.28)]"
          style={{
            backgroundImage: `url(${A}card-bg.png)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 mix-blend-multiply rounded-l-[20px]" style={{ background: 'color-mix(in srgb, var(--cp-yellow) 70%, transparent)' }} />
          <span
            className="relative z-10 text-[24px] font-normal whitespace-nowrap tracking-wide"
            style={{ writingMode: 'vertical-lr', color: '#322116' }}
          >
            Overview
          </span>
        </div>

        {/* Orange bottom envelope */}

        <div className="absolute bottom-2 left-10 right-10 h-25 rounded-t-[30px] z-30" style={{ background: 'var(--cp-orange)' }} />

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
        <div className="flex-1 flex relative z-35 pt-17 pl-22 pr-22 pb-0">

          {/* Survivor badge — tab above the card, similar to Overview */}
          <div
            className="absolute top-9 left-27 z-0 flex items-center gap-1.5 px-3 py-1.75 rounded-t-[13px] overflow-hidden shadow-[0_-2px_8px_rgba(100,75,30,0.28)]"
            style={{
              backgroundImage: `url(${A}card-bg.png)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: 'var(--cp-yellow)',
            }}
          >
            <div className="absolute inset-0 mix-blend-multiply" style={{ background: 'color-mix(in srgb, var(--cp-yellow) 70%, transparent)' }} />
            <UserCircleIcon className="relative z-10 w-5.5 h-5.5 opacity-70 text-[#322116] translate-y-[0px]" />
            <span className="relative z-10 text-[13px] font-medium whitespace-nowrap" style={{ color: '#322116' }}>
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
            <div className="w-[45%] flex flex-col items-start p-5 pr-4 shrink-0">

              {/* time box + buttons share the same column width via this wrapper */}
              <div className="flex flex-col gap-0 w-full">

                <div
                  className="rounded-[35px] px-4 py-3 mb-5 mt-1 flex flex-col items-center text-center w-full"
                  style={{ background: 'color-mix(in srgb, var(--cp-peach) 55%, transparent)' }}
                >
                  <div className="text-[13.5px] mb-0" style={{ color: '#5a3a1a' }}>
                    Time since main earthquake
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={`${A}stopwatch-icon.png`} className="w-7 h-7" alt="" />
                    <span
                      className="text-[24px] font-semibold"
                      style={{ color: 'rgba(0,0,0,0.8)' }}
                    >
                      {formatElapsed(elapsed)}
                    </span>
                  </div>
                </div>

                {/* Trapped since */}
                <div className="text-[22px] mb-3" style={{ color: '#322116' }}>Trapped since:</div>
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex gap-2 w-full">
                    <button onClick={() => setTrappedSince('earthquake')} className={`${pill(trappedSince === 'earthquake')} flex-1 justify-center !px-3`}>
                      The beginning
                    </button>
                    <button onClick={() => setTrappedSince('unknown')} className={`${pill(trappedSince === 'unknown')} flex-1 !pl-2 !pr-3 !justify-start`}>
                      <QuestionMarkCircleIcon className="w-[26px] h-[26px] shrink-0 text-[#322318]/80" />
                      <span className="flex-1 text-center">Unknown</span>
                    </button>
                  </div>
                  {trappedSince === 'later' ? (
                    <input
                      ref={typeInputRef}
                      type="text"
                      value={trappedNote}
                      onChange={e => setTrappedNote(e.target.value)}
                      placeholder="specify when…"
                      className="border border-[#322116] border-solid rounded-[20px] px-4 py-[7px] text-[15px] font-medium cp-pill-active text-[rgba(0,0,0,0.8)] placeholder:text-[rgba(0,0,0,0.35)] outline-none w-full"
                      style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
                    />
                  ) : (
                    <button
                      onClick={() => setTrappedSince('later')}
                      className="border border-[#322116] border-solid rounded-[20px] pl-4 pr-3 py-[7px] text-[16px] font-medium cursor-pointer whitespace-nowrap select-none transition-colors duration-150 flex items-center gap-1.5 bg-[rgba(246,246,246,0.35)] italic w-full"
                      style={{ color: 'rgba(0,0,0,0.22)' }}
                    >
                      or, type here..
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right section — basic info */}
            <div className="flex-1 flex flex-col p-5 pl-9">

              <div className="text-[22px] font-regular mb-2" style={{ color: '#322116' }}>Gender & Age:</div>

              {/* Gender */}
              <div className="flex gap-2 mb-7">
                <button onClick={() => setGender('female')} className={`${pill(gender === 'female')} !rounded-full !p-0 w-[42px] h-[42px] shrink-0 !justify-center`}>
                  <span className="relative flex items-center justify-center w-[20px] h-[20px] shrink-0">
                    {gender === 'female' && (
                      <img src={`${A}female-fill.svg`} className="absolute inset-0 w-full h-full" alt="" />
                    )}
                    <img src={`${A}female-symbol.svg`} className="relative w-[13px] h-[13px]" alt="" />
                  </span>
                </button>
                <button onClick={() => setGender('male')} className={`${pill(gender === 'male')} !rounded-full !p-0 w-[42px] h-[42px] shrink-0 !justify-center`}>
                  <img src={`${A}male-symbol.svg`} className="w-[13px] h-[13px]" alt="" />
                </button>
                <button onClick={() => setGender('unknown')} className={`${pill(gender === 'unknown')} !pl-2 !pr-3 !justify-start`}>
                  <QuestionMarkCircleIcon className="w-[26px] h-[26px] shrink-0 text-[#322318]/80" />
                  <span className="flex-1 text-center">Unknown</span>
                </button>
              </div>

              {/* Age group */}
              <div className="grid grid-cols-2 gap-2 content-start w-fit">
                <button
                  onClick={() => setAgeGroup('child')}
                  className={`border border-[#322116] border-solid rounded-[20px] py-2.5 pl-4 pr-8 text-[16px] font-medium cursor-pointer flex items-center gap-2 select-none transition-colors duration-150 !text-[#322318] justify-start ${ageGroup === 'child' ? 'cp-pill-active' : 'bg-[rgba(246,246,246,0.35)]'}`}
                >
                  <span className="w-[22px] h-[22px] shrink-0 flex items-center justify-center opacity-80">
                    <img src={`${A}child-icon.svg`} className="w-full h-full object-contain" alt="" />
                  </span>
                  <span className="flex-1 text-center">Child</span>
                </button>
                <button
                  onClick={() => setAgeGroup('adult')}
                  className={`border border-[#322116] border-solid rounded-[20px] py-2.5 pl-4 pr-8 text-[16px] font-medium cursor-pointer flex items-center gap-2 select-none transition-colors duration-150 !text-[#322318] justify-start ${ageGroup === 'adult' ? 'cp-pill-active' : 'bg-[rgba(246,246,246,0.35)]'}`}
                >
                  <span className="w-[22px] h-[22px] shrink-0 flex items-center justify-center opacity-80">
                    <img src={`${A}adult-icon.png`} className="max-w-full max-h-full" alt="" />
                  </span>
                  <span className="flex-1 text-center">Adult</span>
                </button>
                <button
                  onClick={() => setAgeGroup('elderly')}
                  className={`border border-[#322116] border-solid rounded-[20px] py-2.5 pl-4 pr-4 text-[16px] font-medium cursor-pointer flex items-center gap-2 select-none transition-colors duration-150 !text-[#322318] justify-start ${ageGroup === 'elderly' ? 'cp-pill-active' : 'bg-[rgba(246,246,246,0.35)]'}`}
                >
                  <span className="w-[22px] h-[22px] shrink-0 flex items-center justify-center opacity-80">
                    <img src={`${A}elderly-icon.png`} className="max-w-full max-h-full" alt="" />
                  </span>
                  <span className="flex-1 text-center">Elderly</span>
                </button>
                <button
                  onClick={() => setAgeGroup('unknown')}
                  className={`border border-[#322116] border-solid rounded-[20px] py-2.5 pl-4 pr-4 text-[16px] font-medium cursor-pointer flex items-center gap-2 select-none transition-colors duration-150 !text-[#322318] justify-start ${ageGroup === 'unknown' ? 'cp-pill-active' : 'bg-[rgba(246,246,246,0.35)]'}`}
                >
                  <QuestionMarkCircleIcon className="w-[26px] h-[26px] shrink-0 text-[#322318]/80" />
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
