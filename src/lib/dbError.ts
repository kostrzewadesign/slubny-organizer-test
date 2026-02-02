// Database error logging utility
export const logDbError = (scope: string, err: any, extra?: any) => {
  console.error(`[${scope}] Database error:`, {
    code: err?.code,
    message: err?.message,
    details: err?.details,
    hint: err?.hint,
    status: err?.status,
    ...extra,
  });
};

// Validation helper for guest data
export const validateGuestData = (data: any) => {
  const errors: string[] = [];
  
  // Required fields validation
  if (!data.firstName?.trim()) {
    errors.push('Imię jest wymagane');
  }
  
  if (!data.lastName?.trim()) {
    errors.push('Nazwisko jest wymagane');
  }
  
  // Ensure no null values for required fields
  const sanitized = {
    ...data,
    firstName: String(data.firstName || '').trim(),
    lastName: String(data.lastName || '').trim(),
    email: data.email || null,
    phone: data.phone || null,
    notes: data.notes || null,
    dietaryRestrictions: data.dietaryRestrictions || null,
  };
  
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
  
  return sanitized;
};