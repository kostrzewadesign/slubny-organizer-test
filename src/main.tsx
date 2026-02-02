import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AppErrorBoundary } from '@/components/errors/AppErrorBoundary'

// Debug session only in development
if (import.meta.env.DEV) {
  import('./utils/debug-session');
}

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
