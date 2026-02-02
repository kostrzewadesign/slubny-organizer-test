import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSetup } from '@/hooks/use-setup';

interface SetupRedirectProps {
  children: React.ReactNode;
}

export function SetupRedirect({ children }: SetupRedirectProps) {
  const { user, loading: authLoading } = useAuth();
  const { isSetupComplete, loading: setupLoading } = useSetup();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect if still loading or not authenticated
    if (authLoading || setupLoading || !user) {
      return;
    }

    // Don't redirect if on auth page or auth callback
    if (location.pathname === '/auth' || location.pathname === '/auth/callback') {
      return;
    }

    // Only proceed if we have a definitive setup status (not null)
    if (isSetupComplete === null) {
      return;
    }

    // Route guard: redirect to setup if incomplete and not on setup page
    // ONLY protects other pages from being accessed without setup
    // Does NOT redirect from /setup to /dashboard (Setup.tsx handles that)
    if (!isSetupComplete && location.pathname !== '/setup') {
      navigate('/setup', { replace: true });
      return;
    }
  }, [user, isSetupComplete, authLoading, setupLoading, navigate, location.pathname]);

  // Show loading if we're checking setup status
  if (authLoading || (user && setupLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Ładowanie...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}