import { useEffect, type CSSProperties } from 'react';
import { TUTORIAL_IMAGE_URLS } from './TutorialPage';
import {
  CircleStackIcon,
  CameraIcon,
  SpeakerWaveIcon,
  HeartIcon,
  UserIcon,
} from '@heroicons/react/24/solid';
import { NextButton } from '../components/NextButton';

interface Props {
  onStart: () => void;
}

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

interface FolderItem {
  order: number;
  number: number;
  label: string;
  bg: string;
  Icon: IconComponent;
}

const FOLDERS: FolderItem[] = [
  { order: 0, number: 5, label: 'Data Entry',         bg: '#CDDE6B', Icon: CircleStackIcon },
  { order: 1, number: 4, label: 'Take Photos',         bg: '#AF9BFF', Icon: CameraIcon },
  { order: 2, number: 3, label: 'Consciousness check', bg: '#80DEDF', Icon: SpeakerWaveIcon },
  { order: 3, number: 2, label: 'Life vitals',         bg: '#FE8F40', Icon: HeartIcon },
];

const CARD_H = 130;
const OVERLAP = 58;

const gradientTextStyle: CSSProperties = {
  background: 'linear-gradient(180deg, #2c3300 9.615%, #8f8f8f 105.77%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

export function OnboardingPage({ onStart }: Props) {
  useEffect(() => {
    document.body.style.backgroundColor = '#f1efe3';
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  useEffect(() => {
    TUTORIAL_IMAGE_URLS.forEach(src => { new Image().src = src; });
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#f1efe3] flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Logo */}
      <div className="pt-10 pb-10 text-center shrink-0">
        <h1 className="font-display font-semibold text-[76px] text-[#ef7519] m-0 leading-none">
          MedKit
        </h1>
        <p className="font-sans text-[20px] text-[#ef7519] mt-2 mb-0">
          save resources, save lives
        </p>
      </div>

      {/* Folder stack + hero */}
      <div className="flex-1 flex flex-col min-h-0 px-[13px]">
        {FOLDERS.map((folder, idx) => (
          <div
            key={folder.number}
            className="relative shrink-0"
            style={{ height: CARD_H, marginTop: idx === 0 ? 0 : -OVERLAP, zIndex: folder.order }}
          >
            {/* Folder tab — peeks above the card in front when stacked */}
            <div
              className="absolute right-0 top-0 rounded-t-[12px]"
              style={{ width: '43%', height: 46, background: folder.bg }}
            />
            {/* Card body */}
            <div
              className="absolute inset-x-0 bottom-0 rounded-[20px] overflow-hidden"
              style={{ top: 10, background: folder.bg, boxShadow: '0 6px 2px rgba(0,0,0,0.25)' }}
            >
              {/* Visible content strip — exactly matches the 46px that stays visible above the overlap */}
              <div className="flex items-center h-[46px] px-5 pt-5">
                <folder.Icon className="w-[26px] h-[26px] shrink-0 text-black" />
                <span className="ml-3 font-display text-[22px] text-black flex-1">
                  {folder.label}
                </span>
              </div>
              {/* Watermark number — decorative, fills the hidden lower portion */}
              <span
                className="absolute right-5 font-display italic text-[90px] leading-none pointer-events-none"
                style={{ top: '-8px', opacity: 0.08, ...gradientTextStyle }}
              >
                {folder.number}
              </span>
            </div>
          </div>
        ))}

        {/* Hero: Reaching the survivor */}
        <div
          className="flex-1 relative mx-[-13px]"
          style={{ marginTop: -OVERLAP, zIndex: 5 }}
        >
          {/* Folder tab */}
          <div
            className="absolute right-0 top-0 rounded-tl-[34px] rounded-tr-[12px]"
            style={{ width: '43%', height: 46, background: '#FFC541' }}
          />
          {/* Card body */}
          <div
            className="absolute inset-x-0 bottom-0 flex flex-col"
            style={{ top: 20, background: '#FFC541', borderRadius: '20px 20px 0 0', boxShadow: '0 6px 2px rgba(0,0,0,0.25)' }}
          >
            {/* Watermark "1" */}
            <span
              className="absolute right-6 font-display italic text-[120px] leading-none pointer-events-none"
              style={{ top: '-20px', opacity: 0.08, ...gradientTextStyle }}
            >
              1
            </span>

            {/* Heading */}
            <div className="relative px-6 flex items-center gap-3 mb-3 pt-9">
              <UserIcon className="w-[28px] h-[28px] shrink-0 text-black" />
              <h2 className="font-display font-medium text-[32px] text-black m-0 leading-tight whitespace-nowrap" style={{ letterSpacing: '-0.5px' }}>
                Reaching the survivor
              </h2>
            </div>

            {/* Description */}
            <p className="relative font-sans text-[18px] text-black leading-[1.45] m-0 px-6" style={{ letterSpacing: '-0.5px' }}>
              You will be guided through the process of setting up and moving the robot. Relevant
              data will be collected automatically.
            </p>

          </div>
        </div>
      </div>
      <div className="fixed bottom-0 inset-x-0 flex justify-center px-5 pb-7 z-10">
        <NextButton onClick={onStart} label="Next" className="w-[82%]" />
      </div>
    </div>
  );
}
