import { useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import trialEndedImage from '@/assets/trial-ended.webp';

export function TrialEndedModal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Query to check trial and payment status
  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', 'trial', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('created_at, has_paid')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching trial status:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  // Calculate if trial has ended (5 days since account creation)
  const trialEnded = useMemo(() => {
    if (!profile?.created_at) return false;
    
    const createdAt = new Date(profile.created_at);
    const now = new Date();
    const daysSinceCreation = Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceCreation >= 5;
  }, [profile?.created_at]);

  // Show modal if trial ended AND user hasn't paid
  const shouldShowModal = !isLoading && profile && trialEnded && !profile.has_paid;

  // Body scroll lock
  useEffect(() => {
    if (!shouldShowModal) return;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [shouldShowModal]);

  // Focus trap and keyboard handling (no escape - modal is blocking)
  useEffect(() => {
    if (!shouldShowModal) return;

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements?.[0] as HTMLElement;
    const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Block escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleTab);
    document.addEventListener('keydown', handleEscape);
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleTab);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [shouldShowModal]);

  const handleUnlockAccess = () => {
    navigate('/pricing');
  };

  // Don't render if no need to show
  if (!shouldShowModal) {
    return null;
  }

  return (
    <>
      {/* Overlay with blur - no click handler, modal is blocking */}
      <div
        className="fixed inset-0 bg-primary/20 backdrop-blur-[8px] z-50 animate-fade-in"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="trial-ended-modal-title"
        aria-describedby="trial-ended-modal-description"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-[520px] bg-background rounded-2xl shadow-card p-6 sm:p-7 animate-scale-in"
      >
        {/* X button - goes to pricing (modal is blocking) */}
        <button
          ref={closeButtonRef}
          onClick={handleUnlockAccess}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Odblokuj dostęp"
        >
          <X size={24} weight="regular" className="text-foreground" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center pt-2">
          {/* Lock/ended image */}
          <img
            src={trialEndedImage}
            alt=""
            className="h-32 sm:h-40 w-auto mb-4"
            aria-hidden="true"
          />

          {/* Title */}
          <h2
            id="trial-ended-modal-title"
            className="font-cormorant font-semibold text-3xl sm:text-4xl text-foreground mb-3"
          >
            Twój darmowy dostęp<br />dobiegł końca.
          </h2>

          {/* Description */}
          <p
            id="trial-ended-modal-description"
            className="font-barlow text-base text-foreground/80 max-w-[44ch] leading-relaxed mb-6"
          >
            Dziękujemy, że testujesz nasz planer ślubny! Aby zachować wszystkie 
            dane i korzystać dalej z aplikacji, odblokuj pełną wersję jednorazową 
            opłatą <strong className="text-foreground">59 zł</strong>.
          </p>

          {/* Button */}
          <div className="w-full">
            <Button
              onClick={handleUnlockAccess}
              className="w-full py-6 text-base font-barlow font-medium rounded-lg"
            >
              Odblokuj pełny dostęp
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
