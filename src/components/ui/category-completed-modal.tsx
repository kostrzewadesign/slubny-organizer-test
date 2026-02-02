import React, { useEffect, useRef } from 'react';
import { X } from '@phosphor-icons/react';
import confettiImage from '@/assets/image-confetti.webp';

interface CategoryCompletedModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  context?: 'tasks' | 'budget';
}

export function CategoryCompletedModal({ isOpen, onClose, categoryName, context = 'tasks' }: CategoryCompletedModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Separate effect for body scroll lock - runs ONLY when isOpen changes
  useEffect(() => {
    if (!isOpen) return;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      // Remove overflow style completely (don't set to empty string)
      document.body.style.overflow = '';
    };
  }, [isOpen]); // Only depends on isOpen

  // Separate effect for modal behavior (timer, focus trap, keyboard)
  useEffect(() => {
    if (!isOpen) return;

    // Auto-close after 5s
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    // Focus trap
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

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleTab);
    document.addEventListener('keydown', handleEscape);

    // Focus close button on open
    closeButtonRef.current?.focus();

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleTab);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay with blur */}
      <div
        className="fixed inset-0 bg-primary/20 backdrop-blur-[8px] z-50 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-[520px] bg-background rounded-2xl shadow-card p-6 sm:p-7 animate-scale-in"
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Zamknij"
        >
          <X size={24} weight="regular" className="text-foreground" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center pt-2">
          {/* Confetti image */}
          <img
            src={confettiImage}
            alt=""
            className="h-32 sm:h-40 w-auto mb-4"
            aria-hidden="true"
          />

          {/* Title */}
          <h2
            id="modal-title"
            className="font-cormorant font-semibold text-3xl sm:text-4xl text-foreground mb-3"
          >
            Gotowe!
          </h2>

          {/* Description */}
          <p
            id="modal-description"
            className="font-barlow text-base text-foreground/80 max-w-[44ch] leading-relaxed"
          >
            {context === 'budget' 
              ? 'Ta kategoria jest już w pełni opłacona. Sprawdź ją w sekcji „Opłacone wydatki" na dole strony.'
              : 'Ta kategoria jest już w pełni wykonana. Sprawdź ją w sekcji „Ukończone zadania" na dole strony.'
            }
          </p>
        </div>
      </div>
    </>
  );
}
