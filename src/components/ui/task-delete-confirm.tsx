import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface TaskDeleteConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle: string;
}

export function TaskDeleteConfirm({ isOpen, onClose, onConfirm, taskTitle }: TaskDeleteConfirmProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

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

    // Focus cancel button on open
    cancelButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleTab);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay with blur */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[5px] z-50 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-description"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-[520px] bg-background rounded-2xl shadow-card p-6 sm:p-7 animate-scale-in"
      >
        {/* Content */}
        <div className="flex flex-col items-center text-center">
          {/* Title */}
          <h2
            id="delete-modal-title"
            className="font-cormorant font-semibold text-3xl sm:text-4xl text-foreground mb-3"
          >
            Usunąć zadanie?
          </h2>

          {/* Description */}
          <p
            id="delete-modal-description"
            className="font-barlow text-base text-foreground/80 max-w-[44ch] leading-relaxed mb-6"
          >
            Zadanie "<span className="font-semibold">{taskTitle}</span>" zostanie trwale usunięte. Tej operacji nie można cofnąć.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:justify-center">
            <Button
              ref={cancelButtonRef}
              onClick={onClose}
              variant="outline"
              className="w-full sm:w-auto min-w-[120px] h-11 font-barlow font-medium rounded-xl"
            >
              Anuluj
            </Button>
            <Button
              onClick={handleConfirm}
              variant="destructive"
              className="w-full sm:w-auto min-w-[120px] h-11 font-barlow font-medium rounded-xl"
            >
              Usuń zadanie
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
