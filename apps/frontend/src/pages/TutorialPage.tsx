import { useEffect } from 'react';

const imgTexture     = "https://www.figma.com/api/mcp/asset/be43bcc9-8322-45b1-8da2-07024385cf70";
const imgStep01Phone = "https://www.figma.com/api/mcp/asset/c7700438-a224-4aa6-b1fe-a25fc9155553";
const imgStep01Scr   = "https://www.figma.com/api/mcp/asset/80143c9c-7833-457c-a6f1-213e15ad3a35";
const imgStep01Arrow = "https://www.figma.com/api/mcp/asset/85a6f5a0-8312-4a6c-b85b-9988b7c0f684";
const imgStep02Ctrl  = "https://www.figma.com/api/mcp/asset/36066e66-b10a-443c-b0d3-206fdea791a5";
const imgStep02Arrow = "https://www.figma.com/api/mcp/asset/2ea0795e-b8fa-4ed3-9d9e-d621267967cc";
const imgStep03Ready = "https://www.figma.com/api/mcp/asset/582ac4d8-1973-4ba3-bddc-f75758e05b11";
const imgStep03Scr   = "https://www.figma.com/api/mcp/asset/814ebf82-9638-4acf-b6a4-479a06395b1b";
const imgArrowBtn    = "https://www.figma.com/api/mcp/asset/88c2f280-5283-440b-b491-aaacff538fc7";
const imgGreenDot    = "https://www.figma.com/api/mcp/asset/6362d35e-005c-4996-b406-ac6d18e622bc";

// Watermark positions (absolute px within the 402-wide frame)
const WATERMARKS = [
  { top:  28, left:  -29, gradient: 'linear-gradient(172.64deg, #ffc481 11.1%, #ffa86d 78.9%)' },
  { top:  47, left:  147, gradient: 'linear-gradient(172.64deg, #ffba6d 11.1%, #ffa86d 78.9%)' },
  { top: 130, left: -113, gradient: 'linear-gradient(172.64deg, #ffbc71 11.1%, #ffa86d 78.9%)' },
  { top:  86, left:  273, gradient: 'linear-gradient(172.64deg, #f9b066 11.1%, #ffa86d 78.9%)' },
  { top: 169, left:   13, gradient: 'linear-gradient(172.64deg, #f9af64 11.1%, #ffa86d 78.9%)' },
];

export function TutorialPage({ onNext, patientLabel = 'Survivor #3' }: { onNext: () => void; patientLabel?: string }) {
  useEffect(() => {
    document.body.style.backgroundColor = '#ff8b3a';
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  return (
    <div
      className="min-h-dvh relative overflow-hidden flex justify-center font-sans"
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
            MedKit
          </span>
        ))}
      </div>

      {/* Page frame — matches the 402×874 Figma canvas */}
      <div className="relative z-[1] w-full max-w-[402px] h-[874px]">

        {/* Patient label */}
        <div className="absolute left-[37px] top-[133px] flex items-center gap-[11px] -translate-y-1/2">
          <img src={imgGreenDot} alt="" className="w-[11px] h-[11px] block" />
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
        {/* Step 01 — screen content overlay */}
        <div
          className="absolute overflow-hidden rounded-[11px] flex items-center justify-center"
          style={{ left: 44.34, top: 329.08, width: 163.022, height: 74.971 }}
        >
          <img
            src={imgStep01Scr}
            alt=""
            style={{ width: 74.971, height: 163.022, transform: 'rotate(-90deg)', objectFit: 'cover', borderRadius: 11 }}
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
          <img
            src={imgStep02Arrow}
            alt=""
            style={{ width: 83.968, height: 31.123, transform: 'rotate(90.6deg)', objectFit: 'cover' }}
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

        {/* Start button */}
        <div className="absolute" style={{ left: 37, top: 801, width: 330 }}>
          <button
            onClick={onNext}
            className="w-full h-[44px] bg-[rgba(9,9,9,0.8)] text-white rounded-[20px] border-none cursor-pointer flex items-center justify-center gap-3"
          >
            <span className="text-[20px] font-sans font-normal leading-[30px]">Start</span>
            <img src={imgArrowBtn} alt="→" className="w-[18px] h-[18px] block" />
          </button>
        </div>
      </div>
    </div>
  );
}
