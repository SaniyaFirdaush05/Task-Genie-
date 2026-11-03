import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with auto-update & caching strategy
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[Service Worker] New content available.');
  },
  onOfflineReady() {
    console.log('[Service Worker] Task Genie is ready for offline operation.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
