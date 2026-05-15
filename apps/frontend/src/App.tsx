import { useState } from 'react';
import { OnboardingPage } from './pages/OnboardingPage';
import { TutorialPage } from './pages/TutorialPage';
import { StepExecutionPage } from './pages/StepExecutionPage';
import { CreateProfilePage } from './pages/CreateProfilePage';

type Screen = 'onboarding' | 'tutorial' | 'execution' | 'create-profile';

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding');

  return (
    <>
      {screen === 'onboarding' && (
        <OnboardingPage onStart={() => setScreen('tutorial')} />
      )}
      {screen === 'tutorial' && (
        <TutorialPage onNext={() => setScreen('execution')} />
      )}
      {screen === 'execution' && (
        <StepExecutionPage onComplete={() => setScreen('create-profile')} onBack={() => setScreen('tutorial')} />
      )}
      {screen === 'create-profile' && (
        <CreateProfilePage onComplete={() => setScreen('onboarding')} />
      )}
    </>
  );
}
