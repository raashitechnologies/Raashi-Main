import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { DomainsProvider } from './contexts/DomainsProvider.tsx'
import { ContentProvider } from './contexts/ContentProvider.tsx'

import { AppErrorBoundary } from '@shared/ui/AppErrorBoundary'

import { HelmetProvider } from 'react-helmet-async'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary variant="public">
      <HelmetProvider>
        <AuthProvider>
          <DomainsProvider>
            <ContentProvider>
              <App />
            </ContentProvider>
          </DomainsProvider>
        </AuthProvider>
      </HelmetProvider>
    </AppErrorBoundary>
  </StrictMode>,
)

// Dismiss intro loader after React has mounted + minimum display time
;(() => {
  const loader = document.getElementById('raashi-intro-loader');
  if (!loader || loader.style.display === 'none') return;

  const MIN_DISPLAY_MS = 2800; // let all animations play fully
  const mountedAt = performance.now();

  // Wait for the app to actually paint, then dismiss after min display time
  requestAnimationFrame(() => {
    const elapsed = performance.now() - mountedAt;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    setTimeout(() => {
      loader.classList.add('fade-out');
      sessionStorage.setItem('raashi_loaded', '1');
      setTimeout(() => loader.remove(), 600);
    }, remaining);
  });
})();
