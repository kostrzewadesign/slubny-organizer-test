import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Spinner } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type VerificationState = 'loading' | 'success' | 'error';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<VerificationState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        setState('error');
        setErrorMessage('Brak identyfikatora sesji płatności');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { session_id: sessionId },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data?.success) {
          setState('success');
          toast.success('Płatność zakończona pomyślnie!');
        } else {
          throw new Error(data?.error || 'Weryfikacja płatności nie powiodła się');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setState('error');
        setErrorMessage(err instanceof Error ? err.message : 'Wystąpił błąd podczas weryfikacji płatności');
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        {state === 'loading' && (
          <>
            <div className="flex justify-center">
              <Spinner size={64} className="text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-playfair font-semibold text-foreground">
              Weryfikuję płatność...
            </h1>
            <p className="text-muted-foreground font-barlow">
              Proszę czekać, trwa potwierdzanie transakcji.
            </p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="flex justify-center">
              <CheckCircle size={64} className="text-green-500" weight="fill" />
            </div>
            <h1 className="text-2xl font-playfair font-semibold text-foreground">
              Płatność zakończona!
            </h1>
            <p className="text-muted-foreground font-barlow">
              Dziękujemy za zakup! Masz teraz pełny dostęp do wszystkich funkcji Planera Ślubnego.
            </p>
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="w-full"
              size="lg"
            >
              Przejdź do aplikacji
            </Button>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="flex justify-center">
              <XCircle size={64} className="text-destructive" weight="fill" />
            </div>
            <h1 className="text-2xl font-playfair font-semibold text-foreground">
              Wystąpił problem
            </h1>
            <p className="text-muted-foreground font-barlow">
              {errorMessage}
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/pricing')} 
                className="w-full"
                size="lg"
              >
                Spróbuj ponownie
              </Button>
              <Button 
                onClick={() => navigate('/contact')} 
                variant="outline"
                className="w-full"
              >
                Skontaktuj się z nami
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
