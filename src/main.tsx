import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// After a deploy, a tab opened earlier may request page files that no longer exist.
// Reload once to pick up the new build; the timestamp guard prevents a reload loop.
window.addEventListener('vite:preloadError', () => {
  const key = 'yinxu-reloaded-for-new-build';
  const last = Number(sessionStorage.getItem(key) ?? 0);
  if (Date.now() - last < 10_000) return;
  sessionStorage.setItem(key, String(Date.now()));
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
