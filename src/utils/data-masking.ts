import { logSecurityEvent } from '@/lib/security';

/**
 * Data masking utilities for UI display
 */

export const maskEmailForDisplay = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0]}*@${domain}`;
  }
  
  const visibleChars = Math.min(2, localPart.length - 1);
  const masked = localPart.slice(0, visibleChars) + '*'.repeat(Math.max(1, localPart.length - visibleChars));
  return `${masked}@${domain}`;
};

export const maskPhoneForDisplay = (phone: string): string => {
  if (!phone || phone.length < 4) return phone;
  
  // Show first 2 and last 2 digits, mask middle
  if (phone.length <= 6) {
    return phone.slice(0, 2) + '*'.repeat(phone.length - 4) + phone.slice(-2);
  }
  
  return phone.slice(0, 3) + '*'.repeat(phone.length - 6) + phone.slice(-3);
};

/**
 * Reveal sensitive data with security logging
 */
export const revealSensitiveData = async (
  type: 'email' | 'phone',
  guestId: string,
  userId: string,
  originalValue: string
): Promise<string> => {
  // Log the access
  void logSecurityEvent('SELECT_guest', {
    userId,
    targetGuestId: guestId,
    metadata: {
      dataType: type,
      timestamp: new Date().toISOString(),
      reason: 'user_requested_reveal'
    }
  }).catch(err => console.warn('[data-masking] Audit log failed:', err));
  
  return originalValue;
};

/**
 * Guest data wrapper with automatic masking
 */
export interface MaskedGuestData {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  group: string;
  rsvpStatus: string;
  // Add other non-sensitive fields as needed
  _revealEmail?: () => Promise<string>;
  _revealPhone?: () => Promise<string>;
}

export const createMaskedGuestData = (
  guest: any,
  userId: string,
  showSensitive = false
): MaskedGuestData => {
  const maskedData: MaskedGuestData = {
    id: guest.id,
    firstName: guest.firstName,
    lastName: guest.lastName,
    group: guest.group,
    rsvpStatus: guest.rsvpStatus,
    email: showSensitive ? guest.email : (guest.email ? maskEmailForDisplay(guest.email) : undefined),
    phone: showSensitive ? guest.phone : (guest.phone ? maskPhoneForDisplay(guest.phone) : undefined),
  };

  // Add reveal functions
  if (!showSensitive) {
    maskedData._revealEmail = () => revealSensitiveData('email', guest.id, userId, guest.email);
    maskedData._revealPhone = () => revealSensitiveData('phone', guest.id, userId, guest.phone);
  }

  return maskedData;
};