import { supabase } from '@/integrations/supabase/client';

// Helper to mask sensitive token data
function maskToken(token: string | undefined): string {
  if (!token || token.length < 10) return '[MASKED]';
  return `${token.substring(0, 6)}...${token.substring(token.length - 4)}`;
}

export async function debugSession() {
  // Safety guard - never run in production
  if (!import.meta.env.DEV) {
    console.warn('[debugSession] Blocked in production');
    return;
  }

  console.group('🔍 Supabase Session Debug Info');
  
  try {
    // Check session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Session check:', {
      hasSession: !!sessionData.session,
      hasUser: !!sessionData.session?.user,
      userId: sessionData.session?.user?.id,
      email: sessionData.session?.user?.email,
      expiresAt: sessionData.session?.expires_at 
        ? new Date(sessionData.session.expires_at * 1000).toISOString() 
        : 'N/A',
      expiresIn: sessionData.session?.expires_at 
        ? Math.round((sessionData.session.expires_at * 1000 - Date.now()) / 1000) + 's'
        : 'N/A',
      hasRefreshToken: !!sessionData.session?.refresh_token,
      // MASKED: Don't expose actual tokens even in dev logs
      refreshTokenPreview: maskToken(sessionData.session?.refresh_token),
      accessTokenPreview: maskToken(sessionData.session?.access_token),
      error: sessionError
    });
    
    // Check localStorage - show keys only, not values
    const localStorageKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('auth')
    );
    
    console.log('localStorage auth keys (names only):', localStorageKeys);
    
    // Try getUser (network call)
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    console.log('User check (network):', {
      hasUser: !!userData.user,
      userId: userData.user?.id,
      error: userError
    });
    
    // Overall health
    const isHealthy = !!(sessionData.session?.user && userData.user);
    
    console.log('%c Session Health: ' + (isHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'), 
      `color: ${isHealthy ? 'green' : 'red'}; font-weight: bold; font-size: 14px`
    );
    
  } catch (error) {
    console.error('Error checking session:', error);
  }
  
  console.groupEnd();
}

// Only expose to window in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).debugSession = debugSession;
  console.debug('[Debug] window.debugSession available - DEV mode only');
} else if (typeof window !== 'undefined') {
  // Explicitly ensure it's not available in production (defense in depth)
  delete (window as any).debugSession;
}
