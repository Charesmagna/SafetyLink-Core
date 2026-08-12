import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Global Fetch Interceptor for Trial Lock
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  try {
    const clone = response.clone();
    const data = await clone.json();
    if (data && data.code === 'TRIAL_EXPIRED') {
      window.dispatchEvent(new Event('trial_expired'));
    }
  } catch (e) {
    // Ignore JSON parse errors for non-JSON responses
  }
  return response;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
