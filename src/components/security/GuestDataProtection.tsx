import React from 'react';
import { Guest } from '@/context/GuestContext';
import { maskEmail, maskPhone, sanitizeGuestData } from '@/lib/security';

interface ProtectedGuestDataProps {
  guest: Guest;
  showSensitiveData?: boolean;
  onSensitiveDataAccess?: (guestId: string) => void;
}

/**
 * Component that safely displays guest data with automatic masking of sensitive information
 * Provides granular control over what sensitive data is displayed
 */
export function ProtectedGuestData({ 
  guest, 
  showSensitiveData = false,
  onSensitiveDataAccess 
}: ProtectedGuestDataProps) {
  const sanitizedGuest = sanitizeGuestData(guest);

  const handleSensitiveAccess = () => {
    if (onSensitiveDataAccess) {
      onSensitiveDataAccess(guest.id);
    }
  };

  return {
    ...sanitizedGuest,
    // Protected email display
    email: showSensitiveData 
      ? sanitizedGuest.email 
      : sanitizedGuest.email ? maskEmail(sanitizedGuest.email) : undefined,
    
    // Protected phone display  
    phone: showSensitiveData 
      ? sanitizedGuest.phone 
      : sanitizedGuest.phone ? maskPhone(sanitizedGuest.phone) : undefined,

    // Expose method to reveal sensitive data with logging
    _revealSensitiveData: () => {
      handleSensitiveAccess();
      return {
        email: sanitizedGuest.email,
        phone: sanitizedGuest.phone
      };
    }
  };
}

/**
 * Hook for safely accessing guest data with automatic security logging
 */
export function useProtectedGuestData(guest: Guest, requireSensitiveAccess = false) {
  const [showSensitive, setShowSensitive] = React.useState(!requireSensitiveAccess);

  const revealSensitiveData = React.useCallback(() => {
    // Log the access for security audit
    import('@/lib/security').then(({ logSecurityEvent }) => {
      void logSecurityEvent('SELECT_guest', {
        targetGuestId: guest.id,
        metadata: {
          guestName: `${guest.firstName} ${guest.lastName}`,
          timestamp: new Date().toISOString(),
          accessReason: 'user_requested'
        }
      }).catch(err => console.warn('[GuestDataProtection] Audit log failed:', err));
    });
    
    setShowSensitive(true);
  }, [guest.id, guest.firstName, guest.lastName]);

  return {
    protectedGuest: ProtectedGuestData({ 
      guest, 
      showSensitiveData: showSensitive 
    }),
    showSensitive,
    revealSensitiveData
  };
}