import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logSecurityEvent } from '@/lib/security';

interface SecurityHardeningResult {
  rlsVerification: any[] | null;
  securityStatus: 'loading' | 'secure' | 'warning' | 'error';
  lastChecked: Date | null;
}

export const useSecurityHardening = () => {
  const [result, setResult] = useState<SecurityHardeningResult>({
    rlsVerification: null,
    securityStatus: 'loading',
    lastChecked: null
  });

  useEffect(() => {
    const verifySecurityMeasures = async () => {
      try {
        // Verify RLS isolation
        const { data: rlsData, error: rlsError } = await supabase.rpc('verify_rls_isolation');
        
        if (rlsError) {
          console.error('RLS verification failed:', rlsError);
          setResult({
            rlsVerification: null,
            securityStatus: 'error',
            lastChecked: new Date()
          });
          return;
        }

        // Check if all critical tables are secure
        const secureStatus = rlsData?.every((table: any) => table.test_result === 'SECURE');
        
        setResult({
          rlsVerification: rlsData,
          securityStatus: secureStatus ? 'secure' : 'warning',
          lastChecked: new Date()
        });

        // Log security verification in console only
        console.log('[Security Hardening] Verification completed:', {
          rlsStatus: secureStatus ? 'secure' : 'warning',
          tableCount: rlsData?.length || 0
        });

      } catch (error) {
        console.error('Security verification failed:', error);
        setResult({
          rlsVerification: null,
          securityStatus: 'error',
          lastChecked: new Date()
        });
      }
    };

    // Run verification on mount
    verifySecurityMeasures();

    // Run periodic checks every 5 minutes
    const interval = setInterval(verifySecurityMeasures, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const runManualVerification = async () => {
    setResult(prev => ({ ...prev, securityStatus: 'loading' }));
    
    try {
      const { data: rlsData, error } = await supabase.rpc('verify_rls_isolation');
      
      if (error) throw error;
      
      const secureStatus = rlsData?.every((table: any) => table.test_result === 'SECURE');
      
      setResult({
        rlsVerification: rlsData,
        securityStatus: secureStatus ? 'secure' : 'warning',
        lastChecked: new Date()
      });

      // Log manual verification in console only
      console.log('[Security Hardening] Manual verification completed:', {
        status: secureStatus ? 'secure' : 'warning'
      });

    } catch (error) {
      console.error('Manual verification failed:', error);
      setResult(prev => ({
        ...prev,
        securityStatus: 'error',
        lastChecked: new Date()
      }));
    }
  };

  return {
    ...result,
    runManualVerification
  };
};