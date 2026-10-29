import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource-variable/besley/wght.css';
import '@fontsource-variable/besley/wght-italic.css';
import './ui/styles.css';
import './ui/components.css';
import './ui/screens.css';
import { App } from './App';
import { AppStateProvider } from './state/store';
import { GlossaryProvider } from './ui/Term';

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppStateProvider>
      <GlossaryProvider>
        <App />
      </GlossaryProvider>
    </AppStateProvider>
  </StrictMode>,
);
