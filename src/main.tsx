import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './styles/index.css';

if (typeof window !== 'undefined') {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);

  (window as any).__DARADIK_GEMINI_KEY__ =
    (import.meta as any).env?.VITE_GEMINI_API_KEY || (window as any).__DARADIK_GEMINI_KEY__ || '';
  (window as any).__DARADIK_GEMINI_MODEL__ =
    (import.meta as any).env?.VITE_GEMINI_MODEL || (window as any).__DARADIK_GEMINI_MODEL__ || 'gemini-3.5-flash-lite';
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
