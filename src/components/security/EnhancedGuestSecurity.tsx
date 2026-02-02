import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { logSecurityEvent } from '@/lib/security';
import { createMaskedGuestData, MaskedGuestData } from '@/utils/data-masking';

interface EnhancedGuestSecurityProps {
  children: React.ReactNode;
}

/**
 * Enhanced security provider that wraps guest-related operations
 * Provides automatic logging and monitoring for guest data access
 */
export function EnhancedGuestSecurity({ children }: EnhancedGuestSecurityProps) {
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user) return;

    // Monitor for suspicious bulk guest operations
    let guestOperationCount = 0;
    const operationWindow = 60000; // 1 minute
    
    const resetCounter = () => {
      guestOperationCount = 0;
    };

    // Reset counter every minute
    const resetInterval = setInterval(resetCounter, operationWindow);

    // Monitor guest-related DOM mutations that might indicate bulk operations
    const observer = new MutationObserver((mutations) => {
      const guestRelatedMutations = mutations.filter(mutation => {
        const target = mutation.target as Element;
        return target.closest?.('[data-guest-id]') || 
               target.querySelector?.('[data-guest-id]') ||
               target.textContent?.includes('@') ||
               target.textContent?.includes('guest');
      });

      if (guestRelatedMutations.length > 0) {
        guestOperationCount++;
        
        // If more than 20 guest-related DOM changes in a minute, log as suspicious
        if (guestOperationCount > 20) {
          void logSecurityEvent('BULK_GUEST_OPERATIONS_DETECTED', {
            userId: user.id,
            metadata: {
              operationCount: guestOperationCount,
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent
            }
          }).catch(err => console.warn('[EnhancedGuestSecurity] Audit log failed:', err));
        }
      }
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      clearInterval(resetInterval);
      observer.disconnect();
    };
  }, [user]);

  return <>{children}</>;
}

/**
 * Hook for securely handling guest data with automatic masking and logging
 */
export function useSecureGuestData(guest: any) {
  const { user } = useAuth();
  const [showSensitive, setShowSensitive] = React.useState(false);

  const maskedGuest = React.useMemo(() => {
    if (!guest || !user) return null;
    return createMaskedGuestData(guest, user.id, showSensitive);
  }, [guest, user, showSensitive]);

  const revealSensitiveData = React.useCallback(async () => {
    if (!user || !guest) return;

    // Log the sensitive data access
    void logSecurityEvent('SELECT_guest', {
      userId: user.id,
      targetGuestId: guest.id,
      metadata: {
        guestName: `${guest.firstName} ${guest.lastName}`,
        timestamp: new Date().toISOString(),
        reason: 'user_requested_reveal'
      }
    }).catch(err => console.warn('[EnhancedGuestSecurity] Audit log failed:', err));

    setShowSensitive(true);
  }, [user, guest]);

  const hideSensitiveData = React.useCallback(() => {
    setShowSensitive(false);
  }, []);

  return {
    maskedGuest: maskedGuest as MaskedGuestData | null,
    showSensitive,
    revealSensitiveData,
    hideSensitiveData
  };
}