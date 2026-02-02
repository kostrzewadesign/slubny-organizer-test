import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import welcomeRings from '@/assets/welcome-rings.webp';

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Query to check welcome modal status
  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', 'welcomeModal', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('has_seen_welcome_modal, setup_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching welcome modal status:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  // Show modal only after setup is completed and user hasn't seen it yet
  useEffect(() => {
    if (!isLoading && profile && profile.setup_completed && !profile.has_seen_welcome_modal) {
      setIsOpen(true);
    }
  }, [isLoading, profile]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

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

    document.addEventListener('keydown', handleTab);
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleTab);
    };
  }, [isOpen]);

  const handleComplete = async () => {
    if (!user?.id) return;

    // Update welcome modal seen status in database
    await supabase
      .from('user_profiles')
      .update({ has_seen_welcome_modal: true })
      .eq('user_id', user.id);

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });

    setIsOpen(false);
  };

  const handleStartPlanning = () => {
    handleComplete();
  };

  const handleUnlockAccess = () => {
    handleComplete();
    navigate('/pricing');
  };

  // Don't render if loading or no need to show
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Overlay with blur */}
      <div
        className="fixed inset-0 bg-primary/20 backdrop-blur-[8px] z-50 animate-fade-in"
        onClick={handleStartPlanning}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-modal-title"
        aria-describedby="welcome-modal-description"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-[520px] bg-background rounded-2xl shadow-card p-6 sm:p-7 animate-scale-in"
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={handleStartPlanning}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Zamknij"
        >
          <X size={24} weight="regular" className="text-foreground" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center pt-2">
          {/* Welcome rings image */}
          <img
            src={welcomeRings}
            alt=""
            className="h-32 sm:h-40 w-auto mb-4"
            aria-hidden="true"
          />

          {/* Title */}
          <h2
            id="welcome-modal-title"
            className="font-cormorant font-semibold text-3xl sm:text-4xl text-foreground mb-3"
          >
            Zaczynamy Waszą<br />ślubną przygodę!
          </h2>

          {/* Description */}
          <p
            id="welcome-modal-description"
            className="font-barlow text-base text-foreground/80 max-w-[44ch] leading-relaxed mb-6"
          >
            Masz <strong className="text-foreground">5 dni darmowego dostępu</strong> do planera.
            Możesz też od razu odblokować pełną wersję bez limitu czasu.
          </p>

          {/* Buttons */}
          <div className="w-full space-y-3">
            <Button
              onClick={handleStartPlanning}
              variant="outline"
              className="w-full py-6 text-base font-barlow font-medium rounded-lg"
            >
              Zaczynam planować
            </Button>

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
