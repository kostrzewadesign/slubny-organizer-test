import DOMPurify from 'dompurify';

// Rate limiting for authentication attempts
const authAttempts = new Map<string, { count: number; lastAttempt: number }>();
const AUTH_RATE_LIMIT = 5; // Max attempts
const AUTH_RATE_WINDOW = 15 * 60 * 1000; // 15 minutes

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
};

// Sanitize HTML content while allowing safe tags
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'],
    ALLOWED_ATTR: []
  });
};

// Rate limiting check for authentication
export const checkAuthRateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const attempts = authAttempts.get(identifier);
  
  if (!attempts) {
    authAttempts.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Reset if window expired
  if (now - attempts.lastAttempt > AUTH_RATE_WINDOW) {
    authAttempts.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Check if limit exceeded
  if (attempts.count >= AUTH_RATE_LIMIT) {
    return false;
  }
  
  // Increment attempt count
  attempts.count++;
  attempts.lastAttempt = now;
  authAttempts.set(identifier, attempts);
  
  return true;
};

// Generic error messages to prevent user enumeration
export const getGenericAuthError = (error: string): string => {
  // Don't expose specific error details
  if (error.includes('Invalid login credentials') || 
      error.includes('User not found') ||
      error.includes('Wrong password')) {
    return "Nieprawidłowy email lub hasło";
  }
  
  if (error.includes('User already registered') ||
      error.includes('Email already exists')) {
    return "Wystąpił problem z rejestracją. Spróbuj się zalogować.";
  }
  
  return "Wystąpił błąd. Spróbuj ponownie.";
};

// Mask sensitive data for display
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) return email;
  
  const masked = localPart.slice(0, 2) + '*'.repeat(localPart.length - 2);
  return `${masked}@${domain}`;
};

export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 6) return phone;
  
  const visible = phone.slice(-3);
  const masked = '*'.repeat(phone.length - 3);
  return `${masked}${visible}`;
};

// Password strength validation with enhanced security
export const validatePasswordStrength = async (password: string): Promise<{ 
  isValid: boolean; 
  errors: string[] 
}> => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Hasło musi mieć co najmniej 8 znaków");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Hasło musi zawierać wielką literę");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Hasło musi zawierać małą literę");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Hasło musi zawierać cyfrę");
  }

  // Enhanced compromised password check using database validation
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.rpc('validate_password_security', {
      password_input: password
    });
    
    if (error) {
      console.warn('Password security validation failed:', error);
    } else if (data === false) {
      errors.push('To hasło zostało skompromitowane i nie może być użyte');
    }
  } catch (err) {
    console.warn('Failed to validate password security:', err);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Enhanced security audit logging
export const logSecurityEvent = async (action: string, details: {
  userId?: string;
  targetGuestId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}): Promise<void> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Use enhanced security logging function
    const { error } = await supabase.rpc('log_enhanced_security_event', {
      event_action: action,
      event_details: {
        target_guest_id: details.targetGuestId,
        ip_address: details.ipAddress,
        user_agent: details.userAgent || navigator.userAgent,
        metadata: details.metadata,
        timestamp: new Date().toISOString()
      }
    });
    
    if (error) {
      console.warn('[security_audit] Failed to log event:', action, error);
    }
  } catch (err) {
    console.warn('[security_audit] Exception during logging:', action, err);
    // Never throw - logging must not block application functionality
  }
};

// Legacy function for backward compatibility
export const logSensitiveDataAccess = (action: string, guestId: string, userId: string) => {
  logSecurityEvent(action, { 
    userId, 
    targetGuestId: guestId,
    metadata: { legacyCall: true }
  });
};

// Sanitize guest data before display to prevent any potential XSS
export const sanitizeGuestData = (guest: any) => {
  if (!guest) return guest;
  
  return {
    ...guest,
    firstName: guest.firstName ? sanitizeInput(guest.firstName) : guest.firstName,
    lastName: guest.lastName ? sanitizeInput(guest.lastName) : guest.lastName,
    email: guest.email ? sanitizeInput(guest.email) : guest.email,
    phone: guest.phone ? sanitizeInput(guest.phone) : guest.phone,
    notes: guest.notes ? sanitizeInput(guest.notes) : guest.notes,
    dietaryRestrictions: guest.dietaryRestrictions ? sanitizeInput(guest.dietaryRestrictions) : guest.dietaryRestrictions
  };
};

// Session security tracking
const activeSessions = new Map<string, { 
  userId: string; 
  lastActivity: number; 
  ipAddress?: string; 
  userAgent?: string;
}>();

export const trackUserSession = (userId: string, sessionData?: {
  ipAddress?: string;
  userAgent?: string;
}) => {
  activeSessions.set(userId, {
    userId,
    lastActivity: Date.now(),
    ipAddress: sessionData?.ipAddress,
    userAgent: sessionData?.userAgent || navigator.userAgent
  });
};

export const updateSessionActivity = (userId: string) => {
  const session = activeSessions.get(userId);
  if (session) {
    session.lastActivity = Date.now();
    activeSessions.set(userId, session);
  }
};

export const removeUserSession = (userId: string) => {
  activeSessions.delete(userId);
};

// Session timeout (30 minutes of inactivity)
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Enhanced security monitoring for suspicious patterns
export const detectSuspiciousActivity = (userId: string): boolean => {
  const session = activeSessions.get(userId);
  if (!session) return false;

  // Check for session timeout
  const now = Date.now();
  if (now - session.lastActivity > SESSION_TIMEOUT) {
    removeUserSession(userId);
    return true;
  }

  return false;
};

// Data encryption utilities for sensitive guest data
export const encryptSensitiveData = (data: string): string => {
  // In a real implementation, use proper encryption
  // For now, this is a placeholder that shows the pattern
  if (!data) return data;
  
  // Simple masking for demonstration - replace with actual encryption
  const sensitive = data.length > 4 ? 
    data.substring(0, 2) + '*'.repeat(data.length - 4) + data.slice(-2) :
    '*'.repeat(data.length);
    
  return sensitive;
};


// Enhanced password security
export const checkPasswordCompromise = (password: string): boolean => {
  // Common compromised passwords list (simplified)
  const commonPasswords = [
    'password', '123456', 'password123', 'admin', 'qwerty',
    'letmein', 'welcome', 'monkey', '1234567890', 'password1'
  ];
  
  return commonPasswords.includes(password.toLowerCase());
};

// Clean up rate limiting data and session data periodically
setInterval(() => {
  const now = Date.now();
  
  // Clean auth attempts
  for (const [key, data] of authAttempts.entries()) {
    if (now - data.lastAttempt > AUTH_RATE_WINDOW) {
      authAttempts.delete(key);
    }
  }
  
  // Clean expired sessions
  for (const [userId, session] of activeSessions.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      activeSessions.delete(userId);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes