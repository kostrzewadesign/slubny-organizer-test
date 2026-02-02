import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        const access_token = searchParams.get('access_token');
        const refresh_token = searchParams.get('refresh_token');
        
        // Handle different auth callback scenarios
        if (access_token && refresh_token) {
          // Direct session from URL (magic link, etc.)
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });
          
          if (error) {
            console.error('Session error:', error);
            toast({
              title: "Błąd sesji",
              description: "Nie udało się utworzyć sesji. Spróbuj zalogować się ponownie.",
              variant: "destructive",
            });
            navigate('/auth');
            return;
          }
        } else if (token_hash && type) {
          // OTP verification (email confirmation, password reset, etc.)
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });

          if (error) {
            console.error('Auth verification error:', error);
            
            // More specific error messages
            let description = "Nie udało się potwierdzić konta.";
            if (error.message.includes('expired')) {
              description = "Link weryfikacyjny wygasł. Poproś o nowy link.";
            } else if (error.message.includes('invalid')) {
              description = "Link weryfikacyjny jest nieprawidłowy.";
            }
            
            toast({
              title: "Błąd potwierdzenia",
              description,
              variant: "destructive",
            });
            navigate('/auth');
            return;
          }
        } else {
          throw new Error('Missing required authentication parameters');
        }

        // Success - user should be authenticated now
        toast({
          title: "Konto potwierdzone!",
          description: "Twoje konto zostało pomyślnie potwierdzone. Witamy!",
        });
        navigate('/dashboard');
        
      } catch (error) {
        console.error('Auth callback error:', error);
        toast({
          title: "Błąd",
          description: "Wystąpił problem podczas potwierdzania konta.",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <h2 className="text-xl font-semibold">Potwierdzanie konta...</h2>
        <p className="text-muted-foreground">Proszę czekać, trwa weryfikacja Twojego konta.</p>
      </div>
    </div>
  );
};

export default AuthCallback;