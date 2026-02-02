import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Heart, Loader2 } from 'lucide-react';
import { 
  sanitizeInput, 
  checkAuthRateLimit, 
  getGenericAuthError, 
  validatePasswordStrength,
  checkPasswordCompromise,
  logSecurityEvent
} from '@/lib/security';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Show logout success message
    const logoutParam = searchParams.get('logout');
    if (logoutParam === 'success') {
      toast({
        title: "Wylogowano pomyślnie",
        description: "Do zobaczenia wkrótce!",
      });
      // Clean up URL parameter
      window.history.replaceState({}, '', '/auth');
    }

    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('🔵 [Auth] User already logged in, checking profile status...');

        // Check profile to determine where to redirect
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('has_completed_onboarding, setup_completed')
          .eq('user_id', session.user.id)
          .single();

        console.log('🔍 [Auth] Profile status:', profile);

        if (!profile?.has_completed_onboarding) {
          console.log('🚀 [Auth] Redirecting to /onboarding');
          navigate('/onboarding', { replace: true });
        } else if (!profile?.setup_completed) {
          console.log('🚀 [Auth] Redirecting to /setup');
          navigate('/setup', { replace: true });
        } else {
          console.log('🚀 [Auth] Redirecting to /dashboard');
          navigate('/dashboard', { replace: true });
        }
      }
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        console.log('🔵 [Auth] Auth state changed, checking profile status...');

        try {
          console.log('⏱️ [Auth] Starting profile query with 5s timeout...');

          // Check profile to determine where to redirect with timeout
          const profilePromise = supabase
            .from('user_profiles')
            .select('has_completed_onboarding, setup_completed')
            .eq('user_id', session.user.id)
            .single();

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Profile query timeout after 5s')), 5000)
          );

          const { data: profile, error: profileError } = await Promise.race([
            profilePromise,
            timeoutPromise
          ]) as any;

          console.log('🔍 [Auth] Profile query result:', { profile, profileError });

          if (profileError) {
            console.error('❌ [Auth] Error fetching profile:', profileError);
            // Default to onboarding on error
            console.log('🚀 [Auth] Error - defaulting to /onboarding');
            navigate('/onboarding', { replace: true });
            return;
          }

          if (!profile?.has_completed_onboarding) {
            console.log('🚀 [Auth] Redirecting to /onboarding');
            navigate('/onboarding', { replace: true });
          } else if (!profile?.setup_completed) {
            console.log('🚀 [Auth] Redirecting to /setup');
            navigate('/setup', { replace: true });
          } else {
            console.log('🚀 [Auth] Redirecting to /dashboard');
            navigate('/dashboard', { replace: true });
          }
        } catch (error) {
          console.error('❌ [Auth] Critical error in profile check:', error);
          navigate('/onboarding', { replace: true });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, searchParams, toast]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Rate limiting check
    if (!checkAuthRateLimit(email)) {
      // Log as console warning - not security audit
      console.warn('[Auth] Rate limit exceeded:', sanitizeInput(email));
      
      toast({
        title: "Zbyt wiele prób",
        description: "Spróbuj ponownie za 15 minut",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const sanitizedEmail = sanitizeInput(email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (error) {
        // Log as console warning - not security audit
        console.warn('[Auth] Signin failed:', sanitizedEmail, error.message);
        
        toast({
          title: "Błąd logowania",
          description: getGenericAuthError(error.message),
          variant: "destructive",
        });
      }
      // Success - let PublicRoute handle navigation
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił nieoczekiwany błąd",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Enhanced rate limiting check
      if (!checkAuthRateLimit(email)) {
        toast({
          title: "Zbyt wiele prób",
          description: "Spróbuj ponownie za 15 minut",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Enhanced email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast({
          title: "Nieprawidłowy email",
          description: "Wprowadź poprawny adres email",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Password strength validation
      const passwordValidation = await validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        toast({
          title: "Słabe hasło",
          description: passwordValidation.errors.join(', '),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Check for compromised passwords
      if (checkPasswordCompromise(password)) {
        // Log as console warning - not security audit
        console.warn('[Auth] Compromised password attempt:', sanitizeInput(email));
        
        toast({
          title: "Niebezpieczne hasło",
          description: "To hasło jest powszechnie używane i niebezpieczne. Wybierz inne.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const sanitizedEmail = sanitizeInput(email);
      
      // Simple signup without emailRedirectTo since email confirmation is disabled
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password
      });

      if (error) {
        // Log as console warning - not security audit
        console.warn('[Auth] Signup failed:', sanitizedEmail, error.message);
        
        toast({
          title: "Błąd rejestracji",
          description: getGenericAuthError(error.message),
          variant: "destructive",
        });
      } else {
        // Log success in console only - USER_LOGIN will be logged in AuthContext
        console.log('[Auth] Signup successful:', sanitizedEmail);
        
        // Since email confirmation is disabled, user should be logged in immediately
        if (data?.user && data?.session) {
          navigate('/onboarding', { replace: true });
        } else if (data?.user) {
          setActiveTab('signin');
        }
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił nieoczekiwany błąd",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4 overflow-visible">
            <img 
              src="/lovable-uploads/23f2ce9e-e5a9-486b-bfd8-fdefd350e427.png" 
              alt="Ślubny Organizer" 
              className="max-w-full max-h-24 w-auto object-contain"
            />
          </div>
          <CardDescription>
            Zaloguj się lub utwórz konto, aby zarządzać swoim ślubem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Logowanie</TabsTrigger>
              <TabsTrigger value="signup">Rejestracja</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="twoj@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Hasło</Label>
                  <PasswordInput
                    id="signin-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logowanie...
                    </>
                  ) : (
                    'Zaloguj się'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="twoj@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Hasło</Label>
                  <PasswordInput
                    id="signup-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Hasło musi mieć min. 8 znaków, wielką i małą literę oraz cyfrę
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Tworzenie konta...
                    </>
                  ) : (
                    'Utwórz konto'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;