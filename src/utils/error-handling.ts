/**
 * Safe localStorage operations with error handling
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  }
};

/**
 * Safe JSON parsing with fallback
 */
export const safeJsonParse = <T>(jsonString: string | null, fallback: T): T => {
  if (!jsonString) return fallback;
  
  try {
    const parsed = JSON.parse(jsonString);
    return parsed ?? fallback;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallback;
  }
};

/**
 * Safe division with zero protection
 */
export const safeDivision = (numerator: number, denominator: number, fallback = 0): number => {
  if (denominator === 0 || !isFinite(denominator) || !isFinite(numerator)) {
    return fallback;
  }
  return numerator / denominator;
};

/**
 * Validate and sanitize user input
 */
export const validateInput = {
  name: (name: string): string => {
    if (typeof name !== 'string') return '';
    return name.trim().substring(0, 100); // Max 100 characters
  },

  positiveNumber: (value: any): number => {
    const num = Number(value);
    return isFinite(num) && num >= 0 ? num : 0;
  },

  email: (email: string): boolean => {
    if (typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }
};