import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import dividerImage from '@/assets/divider.png';
import appImage from '@/assets/image-app.webp';
import checklistImage from '@/assets/onboarding-checklist.webp';
import budgetImage from '@/assets/onboarding-budget.webp';
import guestsImage from '@/assets/onboarding-guests.webp';
import seatingImage from '@/assets/onboarding-seating.webp';

const onboardingData = [
  {
    title: 'Witaj w Aplikacji',
    subtitle: 'Zobacz, jak prosto zorganizować każdy element Waszego ślubu.',
    description: '',
    image: appImage,
    showDivider: true
  },
  {
    title: 'Lista zadań',
    subtitle: 'Zaplanuj każdy szczegół.',
    description: 'Twórz i śledź listę ślubnych zadań, aby nic nie umknęło w wirze przygotowań.',
    image: checklistImage,
    showDivider: false
  },
  {
    title: 'Budżet',
    subtitle: 'Kontroluj wydatki.',
    description: 'Zarządzaj budżetem weselnym, porównuj koszty i zachowaj spokój aż do dnia ślubu.',
    image: budgetImage,
    showDivider: false
  },
  {
    title: 'Lista Gości',
    subtitle: 'Zadbaj o wszystkich.',
    description: 'Twórz listę gości, śledź potwierdzenia obecności i notuj specjalne potrzeby.',
    image: guestsImage,
    showDivider: false
  },
  {
    title: 'Plan stołów',
    subtitle: 'Rozmieść gości z harmonią.',
    description: 'Ułóż idealny plan stołów, by każdy czuł się wyjątkowo podczas Waszego dnia.',
    image: seatingImage,
    showDivider: false
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Touch gesture handling
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const minSwipeDistance = 50;

  const handleNext = () => {
    if (currentStep < onboardingData.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user || isCompleting) return;

    setIsCompleting(true);
    console.log('🔵 [Onboarding] Starting handleComplete for user:', user.id);

    try {
      // First check current state
      const { data: currentProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('has_completed_onboarding, setup_completed')
        .eq('user_id', user.id)
        .single();

      console.log('🔍 [Onboarding] Current profile state:', currentProfile);

      if (checkError) {
        console.error('❌ [Onboarding] Error reading current profile:', checkError);
      }

      // Update onboarding flag
      const { error, status } = await supabase
        .from('user_profiles')
        .update({ has_completed_onboarding: true })
        .eq('user_id', user.id);

      console.log('📝 [Onboarding] Update result:', { error, status });

      if (error) {
        console.error('❌ [Onboarding] Update failed:', {
          status,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      // Verify the update
      const { data: verifyProfile, error: verifyError } = await supabase
        .from('user_profiles')
        .select('has_completed_onboarding, setup_completed')
        .eq('user_id', user.id)
        .single();

      console.log('✅ [Onboarding] Profile after update:', verifyProfile);

      if (verifyError) {
        console.error('❌ [Onboarding] Error verifying update:', verifyError);
      }

      // Invalidate user profile cache to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['userProfile', user.id] });
      console.log('🔄 [Onboarding] Cache invalidated');

      // Small delay to ensure cache is updated
      setTimeout(() => {
        console.log('🚀 [Onboarding] Navigating to /setup');
        navigate('/setup', { replace: true });
      }, 100);
    } catch (error) {
      console.error('❌ [Onboarding] Critical error completing onboarding:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  // Touch event handlers for swipe gestures
  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = 0; // Reset
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && !isLastStep) {
      handleNext();
    }
    if (isRightSwipe && !isFirstStep) {
      handlePrev();
    }
  };

  const currentSlide = onboardingData[currentStep];
  const isLastStep = currentStep === onboardingData.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Botanical background */}
      <div 
        className="absolute top-0 left-0 right-0 h-80 opacity-30 bg-no-repeat bg-center bg-cover pointer-events-none animate-float" 
        style={{ backgroundImage: 'url(/lovable-uploads/7238c2ee-740c-44af-b1a5-e7f0f6131661.png)' }}
      />

      {/* Navigation icons */}
      <div className="relative z-10 flex items-center justify-between p-4">
        <button
          onClick={handlePrev}
          disabled={isFirstStep}
          className={`w-10 md:w-12 h-10 md:h-12 flex items-center justify-center bg-primary rounded-lg md:rounded-xl transition-colors transition-transform duration-200 active:scale-95 ${isFirstStep ? 'invisible' : ''}`}
        >
          <CaretLeft size={24} weight="light" color="#FFFFFF" />
        </button>
        
        <button
          onClick={handleNext}
          disabled={isLastStep}
          className={`w-10 md:w-12 h-10 md:h-12 flex items-center justify-center bg-primary rounded-lg md:rounded-xl transition-colors transition-transform duration-200 active:scale-95 ${isLastStep ? 'invisible' : ''}`}
        >
          <CaretRight size={24} weight="light" color="#FFFFFF" />
        </button>
      </div>

      {/* Main content - with touch gesture support */}
      <div 
        className="relative z-10 max-w-lg mx-auto px-6 pb-12 flex flex-col items-center justify-center min-h-[60vh]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >

        {/* Content slide with fade animation */}
        <div 
          key={currentStep} 
          className="w-full space-y-4 text-center mb-6 animate-fade-in"
        >
          <h2 className="text-3xl md:text-4xl font-cormorant font-semibold text-[#1E1E1E] animate-fade-in">
            {currentSlide.title}
          </h2>
          
          <h3 className="text-xl md:text-2xl font-barlow font-medium text-primary animate-fade-in">
            {currentSlide.subtitle}
          </h3>
          
          {currentSlide.showDivider && (
            <div className="flex justify-center py-2 animate-fade-in">
              <img 
                src={dividerImage} 
                alt="Divider"
                className="w-48 md:w-64 object-contain"
              />
            </div>
          )}
          
          {currentSlide.description && (
            <p className="text-base text-muted-foreground font-barlow max-w-md mx-auto animate-fade-in">
              {currentSlide.description}
            </p>
          )}

          {/* Image */}
          <div className="flex justify-center py-4">
            <img 
              src={currentSlide.image} 
              alt={currentSlide.title}
              className={`${currentStep === 0 ? 'w-80 h-80' : 'w-60 h-60'} object-contain animate-float`}
            />
          </div>
        </div>

        {/* Pagination dots */}
        <div className="flex gap-2 mb-8">
          {onboardingData.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep 
                  ? 'w-8 bg-primary' 
                  : 'w-2 bg-primary/30'
              }`}
            />
          ))}
        </div>

        {/* Action button - only on last step */}
        {isLastStep && (
          <div className="w-full max-w-md">
            <Button
              onClick={handleComplete}
              disabled={isCompleting}
              className="w-full h-14 rounded-2xl text-base font-barlow font-medium bg-primary hover:bg-primary-dark text-white shadow-lg"
            >
              {isCompleting ? 'Zapisywanie...' : 'Zaczynamy!'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
