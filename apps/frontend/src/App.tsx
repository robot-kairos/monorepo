import { useEffect, useState } from 'react';
import { OnboardingPage } from './pages/OnboardingPage';
import { TutorialPage } from './pages/TutorialPage';
import { StepExecutionPage } from './pages/StepExecutionPage';
import { CreateProfilePage } from './pages/CreateProfilePage';

type Screen = 'onboarding' | 'tutorial' | 'execution' | 'create-profile';

function readIsWrongLandscape(): boolean {
  const wo = (window as Window & { orientation?: number }).orientation;
  if (typeof wo === 'number') return wo === -90 || wo === 270;
  return screen.orientation?.type === 'landscape-secondary';
}

function WithOrientation({ mode, children }: { mode: 'portrait' | 'landscape'; children: React.ReactNode }) {
  // JS state only needed for landscape-left vs landscape-right distinction.
  // The basic portrait↔landscape gate is handled by CSS (hide-in-landscape / hide-in-portrait)
  // so it fires instantly without a render cycle.
  const [wrongLandscape, setWrongLandscape] = useState(
    () => mode === 'landscape' && readIsWrongLandscape()
  );

  useEffect(() => {
    if (mode !== 'landscape') return;
    const update = () => setWrongLandscape(readIsWrongLandscape());
    window.addEventListener('orientationchange', update);
    window.addEventListener('resize', update);
    screen.orientation?.addEventListener('change', update);
    return () => {
      window.removeEventListener('orientationchange', update);
      window.removeEventListener('resize', update);
      screen.orientation?.removeEventListener('change', update);
    };
  }, [mode]);

  const phoneIcon = (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#322116" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <g transform={mode === 'landscape' ? 'rotate(-90, 12, 12)' : undefined}>
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M12 18h.01" />
      </g>
    </svg>
  );

  const overlay = (msg: string, cssHideClass?: string) => (
    <div
      className={`${cssHideClass ?? ''} fixed inset-0 flex flex-col items-center justify-center gap-4 bg-[#efecde]`}
      style={{ zIndex: 100 }}
    >
      {phoneIcon}
      <p className="text-[#322116] text-[15px] font-medium">{msg}</p>
    </div>
  );

  return (
    <>
      {children}
      {/* CSS-instant gate — responds to media query with no JS delay */}
      {mode === 'landscape'
        ? overlay('Rotate your device horizontally', 'hide-in-landscape')
        : overlay('Rotate your device vertically',   'hide-in-portrait')}
      {/* JS gate — landscape direction; slight delay is acceptable for this edge case */}
      {wrongLandscape && overlay('Rotate your device the other way')}
    </>
  );
}

const CREATE_PROFILE_ASSETS = [
  '/create-profile/card-bg.png',
  '/create-profile/texture-tile.webp',
  '/create-profile/bottom-envelope.png',
];

function preloadCreateProfile() {
  CREATE_PROFILE_ASSETS.forEach(src => { new Image().src = src; });
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding');

  return (
    <>
      {screen === 'onboarding' && (
        <WithOrientation mode="portrait">
          <OnboardingPage onStart={() => setScreen('tutorial')} />
        </WithOrientation>
      )}
      {screen === 'tutorial' && (
        <WithOrientation mode="portrait">
          <TutorialPage onNext={() => setScreen('execution')} />
        </WithOrientation>
      )}
      {screen === 'execution' && (
        <WithOrientation mode="landscape">
          <StepExecutionPage onComplete={() => setScreen('create-profile')} onBack={() => setScreen('tutorial')} onMounted={preloadCreateProfile} />
        </WithOrientation>
      )}
      {screen === 'create-profile' && (
        <WithOrientation mode="landscape">
          <CreateProfilePage onComplete={() => setScreen('onboarding')} />
        </WithOrientation>
      )}
    </>
  );
}
