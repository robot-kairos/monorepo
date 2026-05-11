import { useState } from 'react';
import { SurvivorProfile } from './types';
import { OnboardingPage } from './pages/OnboardingPage';
import { TutorialPage } from './pages/TutorialPage';
import { CreateProfilePage } from './pages/CreateProfilePage';
import { StepExecutionPage } from './pages/StepExecutionPage';
import { WaitingPage } from './pages/WaitingPage';
import { MedicalFeedbackPage } from './pages/MedicalFeedbackPage';

type Screen = 'onboarding' | 'create-profile' | 'tutorial' | 'execution' | 'waiting' | 'medical-feedback';

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [profile, setProfile] = useState<SurvivorProfile | null>(null);

  function handleProfileCreated(p: SurvivorProfile) {
    setProfile(p);
    setScreen('tutorial');
  }

  return (
    <>
      {screen === 'onboarding' && (
        <OnboardingPage onStart={() => setScreen('create-profile')} />
      )}
      {screen === 'create-profile' && (
        <CreateProfilePage onComplete={handleProfileCreated} />
      )}
      {screen === 'tutorial' && (
        <TutorialPage onNext={() => setScreen('execution')} />
      )}
      {screen === 'execution' && profile && (
        <StepExecutionPage profile={profile} onComplete={() => setScreen('waiting')} onBack={() => setScreen('tutorial')} />
      )}
      {screen === 'waiting' && (
        <WaitingPage onNext={() => setScreen('medical-feedback')} />
      )}
      {screen === 'medical-feedback' && (
        <MedicalFeedbackPage onDone={() => setScreen('onboarding')} />
      )}
    </>
  );
}
