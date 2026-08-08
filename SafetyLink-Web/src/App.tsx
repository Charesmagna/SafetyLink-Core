import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [route, setRoute] = useState(window.location.pathname);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('safetylink_token'));

  useEffect(() => {
    const handlePopState = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setRoute(path);
  };

  const handleLogin = (token: string, orgName: string, orgCode: string) => {
    localStorage.setItem('safetylink_token', token);
    localStorage.setItem('safetylink_orgName', orgName);
    localStorage.setItem('safetylink_orgCode', orgCode);
    setIsAuthenticated(true);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('safetylink_token');
    localStorage.removeItem('safetylink_orgName');
    localStorage.removeItem('safetylink_orgCode');
    setIsAuthenticated(false);
    navigate('/');
  };

  if (route === '/dashboard') {
    return isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <LoginPage onLogin={handleLogin} onBack={() => navigate('/')} />;
  }
  if (route === '/login') {
    return <LoginPage onLogin={handleLogin} onBack={() => navigate('/')} />;
  }
  
  return <LandingPage onNavigate={navigate} />;
}
