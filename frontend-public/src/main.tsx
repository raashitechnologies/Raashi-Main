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


