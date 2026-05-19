import { useEffect, useRef } from 'react';
import { ArrowLongRightIcon } from '@heroicons/react/24/solid';
import { NextButton } from '../components/NextButton';

const imgTexture     = "/tutorial/texture.png";
const imgStep01Phone = "/tutorial/step01-phone.png";
const imgStep01Arrow = "/tutorial/step01-arrow.svg";
const imgStep02Ctrl  = "/tutorial/step02-ctrl.png";
const imgStep03Ready = "/tutorial/step03-ready.png";
const imgStep03Scr   = "/tutorial/step03-scr.png";

export const TUTORIAL_IMAGE_URLS = [
  imgTexture, imgStep01Phone, imgStep01Arrow,
  imgStep02Ctrl, imgStep03Ready, imgStep03Scr,
];

// Watermark positions (absolute px within the 402-wide frame)
const WATERMARKS = [
  { top:  28, left:  -29, gradient: 'linear-gradient(172.64deg, #ffc481 11.1%, #ffa86d 78.9%)' },
  { top:  47, left:  147, gradient: 'linear-gradient(172.64deg, #ffba6d 11.1%, #ffa86d 78.9%)' },
  { top: 130, left: -113, gradient: 'linear-gradient(172.64deg, #ffbc71 11.1%, #ffa86d 78.9%)' },
  { top:  86, left:  273, gradient: 'linear-gradient(172.64deg, #f9b066 11.1%, #ffa86d 78.9%)' },
  { top: 169, left:   13, gradient: 'linear-gradient(172.64deg, #f9af64 11.1%, #ffa86d 78.9%)' },
];

export function TutorialPage({ onNext, patientLabel = 'Survivor #3' }: { onNext: () => void; patientLabel?: string }) {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.backgroundColor = '#ff8b3a';
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  useEffect(() => {
    const update = () => {
      if (!frameRef.current) return;
      const scale = Math.min(window.innerWidth / 402, window.innerHeight / 874, 1);
      frameRef.current.style.transform = `scale(${scale})`;
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden flex justify-center font-sans"
      style={{ background: 'linear-gradient(180deg, #ff8b3a 0%, #f7c37f 42.3%, #edebde 100%)' }}
    >
      {/* Texture */}
      <div className="absolute inset-0 pointer-events-none mix-blend-color-burn opacity-25 z-0">
        <img alt="" className="absolute inset-0 w-full h-full object-cover" src={imgTexture} />
      </div>

      {/* Watermarks */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {WATERMARKS.map((wm, i) => (
          <span
            key={i}
            className="absolute text-[84px] font-display font-semibold select-none whitespace-nowrap leading-[71px]"
            style={{
              top: wm.top,
              left: wm.left,
              transform: 'rotate(-17.21deg)',
              backgroundImage: wm.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Kairos
          </span>
        ))}
      </div>

      {/* Page frame — 402×874 Figma canvas, scaled to fit viewport */}
      <div ref={frameRef} className="relative z-[1] w-[402px] h-[874px] origin-top">

        {/* Patient label */}
        <div className="absolute left-[37px] top-[133px] flex items-center gap-[11px] -translate-y-1/2">
          <span className="w-[11px] h-[11px] rounded-full block shrink-0" style={{ background: '#0FB61B' }} />
          <span className="text-[16px] text-black font-sans leading-[26px]">{patientLabel}</span>
        </div>

        {/* Title */}
        <div className="absolute left-[37px] top-[211px] -translate-y-1/2">
          <h2 className="text-[40px] font-display font-bold text-black leading-[38px] m-0">
            Rotate, attach,<br />ready to go.
          </h2>
        </div>

        {/* Step 01 — phone rotating */}
        <div
          className="absolute flex items-center justify-center"
          style={{ left: 13, top: 256, width: 222.935, height: 222.935 }}
        >
          <img
            src={imgStep01Phone}
            alt="Rotate your phone"
            style={{ width: 222.935, height: 222.935, transform: 'rotate(-90deg)', objectFit: 'cover' }}
          />
        </div>
        {/* Step 01 — curved arrow */}
        <div
          className="absolute flex items-center justify-center"
          style={{ left: 190.33, top: 305.72, width: 41.079, height: 44.775 }}
        >
          <img
            src={imgStep01Arrow}
            alt=""
            style={{ width: 37.663, height: 32.436, transform: 'rotate(75deg)' }}
          />
        </div>

        {/* Step 02 — phone attaching to controller */}
        <div className="absolute" style={{ left: 28, top: 454.28, width: 131.893, height: 145.381 }}>
          <img src={imgStep02Ctrl} alt="Attach to controller" className="w-full h-full object-cover" />
        </div>
        {/* Step 02 — upward arrow */}
        <div
          className="absolute flex items-center justify-center"
          style={{ left: 77.15, top: 443, width: 31.996, height: 84.288 }}
        >
          <ArrowLongRightIcon
            style={{ width: 83.968, height: 31.123, transform: 'rotate(90.6deg)' }}
            className="text-black"
          />
        </div>

        {/* Step 03 — controller + phone ready */}
        <div className="absolute" style={{ left: 187, top: 439, width: 148.446, height: 187.433 }}>
          <img src={imgStep03Ready} alt="Ready to go" className="w-full h-full object-cover" />
        </div>
        {/* Step 03 — screen overlay */}
        <div
          className="absolute overflow-hidden rounded-[7px]"
          style={{ left: 207.56, top: 462.73, width: 111.7, height: 52.031 }}
        >
          <img src={imgStep03Scr} alt="" className="w-full h-full object-cover" />
        </div>

      </div>
      <div className="fixed bottom-0 inset-x-0 flex justify-center px-5 pb-7 z-10">
        <NextButton onClick={onNext} label="Start" className="w-[82%]" />
      </div>
    </div>
  );
}
