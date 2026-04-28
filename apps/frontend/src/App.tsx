import { useState } from 'react';
import { SurvivorProfile } from './types';
import { OnboardingPage } from './pages/OnboardingPage';
import { TutorialPage } from './pages/TutorialPage';
import { CreateProfilePage } from './pages/CreateProfilePage';

type Screen = 'onboarding' | 'tutorial' | 'create-profile';

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding');

  function handleProfileCreated(_profile: SurvivorProfile) {
    // Profile saved — reset to onboarding for the next survivor
    setScreen('onboarding');
  }

  return (
    <>
      {screen === 'onboarding' && (
        <OnboardingPage onStart={() => setScreen('tutorial')} />
      )}
      {screen === 'tutorial' && (
        <TutorialPage onNext={() => setScreen('create-profile')} />
      )}
      {screen === 'create-profile' && (
        <CreateProfilePage onComplete={handleProfileCreated} />
      )}
    </>
  );
}
