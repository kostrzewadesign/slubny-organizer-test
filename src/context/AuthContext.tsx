import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logSecurityEvent } from '@/lib/security';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authReady: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

// Supabase localStorage key
const SUPABASE_STORAGE_KEY = 'sb-irxrkutczxskuqbpgntd-auth-token';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    console.log('[AuthContext] Setting up auth');
    let mounted = true;
    let authEventReceived = false;

    // FIRST: Set up auth state listener before any auth calls
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('[AuthContext] onAuthStateChange:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          timestamp: new Date().toISOString()
        });

        authEventReceived = true;

        // Update React state
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setAuthReady(true);

        // Notify supabase-adapters
        console.log('[AuthContext] Dispatching auth-context-ready');
        window.dispatchEvent(new Event('auth-context-ready'));

        // Log security events
        if (event === 'SIGNED_IN' && session?.user) {
          logSecurityEvent('USER_LOGIN', {
            userId: session.user.id,
            userAgent: navigator.userAgent,
            metadata: { authEvent: event }
          }).catch(e => console.warn('[AuthContext] Failed to log login:', e));
        } else if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] 🔴 User signed out');
          logSecurityEvent('USER_LOGOUT', { metadata: { authEvent: event } })
            .catch(e => console.warn('[AuthContext] Failed to log logout:', e));
        }

        window.dispatchEvent(new Event('auth-changed'));
      }
    );

    // THEN: Trigger session restoration by calling getSession
    // This will cause onAuthStateChange to fire with the session
    const initSession = async () => {
      console.log('[AuthContext] Calling getSession to trigger restoration...');

      try {
        // Wait up to 5 seconds for getSession
        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => {
            console.warn('[AuthContext] ⚠️ getSession timeout after 5s');
            resolve(null);
          }, 5000);
        });

        const sessionPromise = supabase.auth.getSession().then(r => r.data.session);
        const session = await Promise.race([sessionPromise, timeoutPromise]);

        // If we got a session but onAuthStateChange hasn't fired yet, set state manually
        if (session && !authEventReceived && mounted) {
          console.log('[AuthContext] getSession returned session, setting state manually');
          setSession(session);
          setUser(session.user);
          setLoading(false);
          setAuthReady(true);
          window.dispatchEvent(new Event('auth-context-ready'));
        } else if (!session && !authEventReceived && mounted) {
          // No session and no event - user is not logged in
          console.log('[AuthContext] No session found, user not logged in');
          setSession(null);
          setUser(null);
          setLoading(false);
          setAuthReady(true);
          window.dispatchEvent(new Event('auth-context-ready'));
        }
      } catch (e) {
        console.error('[AuthContext] getSession error:', e);
        if (mounted && !authEventReceived) {
          setLoading(false);
          setAuthReady(true);
          window.dispatchEvent(new Event('auth-context-ready'));
        }
      }
    };

    initSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Synchronize auth state across browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Check if auth token was removed in another tab
      if (e.key === 'sb-irxrkutczxskuqbpgntd-auth-token' && e.newValue === null) {
        console.log('[AuthContext] Session cleared in another tab, logging out locally');
        setSession(null);
        setUser(null);
      }
      // Check if auth token was added/updated in another tab
      else if (e.key === 'sb-irxrkutczxskuqbpgntd-auth-token' && e.newValue !== null) {
        console.log('[AuthContext] Session updated in another tab, refreshing local state');
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setUser(session?.user ?? null);
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const signOut = async () => {
    console.log('[AuthContext] Starting signOut process');
    
    try {
      // Log signout attempt with timeout (non-blocking)
      if (user) {
        try {
          const logPromise = logSecurityEvent('USER_LOGOUT', { 
            userId: user.id,
            userAgent: navigator.userAgent 
          });
          await Promise.race([
            logPromise, 
            new Promise(resolve => setTimeout(resolve, 2000))
          ]);
          console.log('[AuthContext] Security event logged');
        } catch (e) {
          console.warn('[AuthContext] Failed to log logout event:', e);
        }
      }
      
      // Sign out from Supabase with timeout
      console.log('[AuthContext] Signing out from Supabase');
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SignOut timeout')), 5000)
      );
      
      try {
        await Promise.race([signOutPromise, timeoutPromise]);
        console.log('[AuthContext] Supabase signout completed');
      } catch (timeoutError) {
        console.warn('[AuthContext] SignOut timed out, forcing local logout');
      }
      
      // Force clear local auth state regardless of Supabase response
      setSession(null);
      setUser(null);
      
      // Clear any cached auth data from localStorage
      localStorage.removeItem('sb-irxrkutczxskuqbpgntd-auth-token');
      
      console.log('[AuthContext] Local state cleared');
      
    } catch (error) {
      console.error('[AuthContext] Error during signOut:', error);
      // Still clear local state on error
      setSession(null);
      setUser(null);
      localStorage.removeItem('sb-irxrkutczxskuqbpgntd-auth-token');
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    authReady,
    signOut,
  };

  // Debug logging for auth state
  useEffect(() => {
    console.log('🔵 [AuthContext] State changed:', {
      hasUser: !!user,
      userId: user?.id,
      loading,
      authReady,
      hasSession: !!session
    });
  }, [user, loading, authReady, session]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};