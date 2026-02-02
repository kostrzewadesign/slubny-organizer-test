import { safeLocalStorage } from './error-handling';

/**
 * Enhanced localStorage utilities with security features
 */

// Encryption key derived from session (simple XOR for demo - use proper crypto in production)
const getStorageKey = (): string => {
  return window.location.hostname + '_secure';
};

// Simple XOR encryption (replace with proper encryption in production)
const encrypt = (text: string, key: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
};

const decrypt = (encryptedText: string, key: string): string => {
  try {
    const text = atob(encryptedText);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return '';
  }
};

export const secureStorage = {
  /**
   * Store data with encryption and TTL
   */
  setItem: (key: string, value: any, ttlMinutes = 60): boolean => {
    try {
      const encryptionKey = getStorageKey();
      const data = {
        value,
        timestamp: Date.now(),
        ttl: ttlMinutes * 60 * 1000, // Convert to milliseconds
      };
      
      const encryptedData = encrypt(JSON.stringify(data), encryptionKey);
      return safeLocalStorage.setItem(`app_secure_${key}`, encryptedData);
    } catch (error) {
      console.error('Error storing secure data:', error);
      return false;
    }
  },

  /**
   * Retrieve and decrypt data, checking TTL
   */
  getItem: <T>(key: string): T | null => {
    try {
      const encryptionKey = getStorageKey();
      const encryptedData = safeLocalStorage.getItem(`app_secure_${key}`);
      
      if (!encryptedData) return null;
      
      const decryptedData = decrypt(encryptedData, encryptionKey);
      if (!decryptedData) return null;
      
      const data = JSON.parse(decryptedData);
      
      // Check TTL
      if (Date.now() - data.timestamp > data.ttl) {
        secureStorage.removeItem(key);
        return null;
      }
      
      return data.value as T;
    } catch (error) {
      console.error('Error retrieving secure data:', error);
      secureStorage.removeItem(key); // Clean up corrupted data
      return null;
    }
  },

  /**
   * Remove encrypted data
   */
  removeItem: (key: string): boolean => {
    return safeLocalStorage.removeItem(`app_secure_${key}`);
  },

  /**
   * Clear all secure storage (call on logout)
   */
  clearAll: (): void => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('app_secure_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing secure storage:', error);
    }
  },

  /**
   * Clean up expired items
   */
  cleanup: (): void => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('app_secure_')) {
          const encryptionKey = getStorageKey();
          const encryptedData = localStorage.getItem(key);
          
          if (encryptedData) {
            try {
              const decryptedData = decrypt(encryptedData, encryptionKey);
              const data = JSON.parse(decryptedData);
              
              // Remove expired items
              if (Date.now() - data.timestamp > data.ttl) {
                localStorage.removeItem(key);
              }
            } catch {
              // Remove corrupted items
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.error('Error during storage cleanup:', error);
    }
  }
};

// Automatic cleanup on page load
if (typeof window !== 'undefined') {
  secureStorage.cleanup();
  
  // Clean up expired items every 5 minutes
  setInterval(() => {
    secureStorage.cleanup();
  }, 5 * 60 * 1000);
}