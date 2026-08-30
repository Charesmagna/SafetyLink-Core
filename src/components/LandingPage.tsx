import { Home } from './landing/Home';

interface LandingPageProps {
  onLogin?: () => void;
  onRegisterUser?: () => void;
  onRegisterOrg?: () => void;
}

export function LandingPage({ onLogin, onRegisterUser, onRegisterOrg }: LandingPageProps) {
  return <Home onLogin={onLogin || (() => {})} onRegisterOrg={onRegisterOrg || (() => {})} onRegisterUser={onRegisterUser || (() => {})} />;
}
