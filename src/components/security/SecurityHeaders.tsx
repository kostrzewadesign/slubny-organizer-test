import { useEffect } from 'react';

/**
 * Component that sets security headers via meta tags for CSP and other security measures
 */
export function SecurityHeaders() {
  useEffect(() => {
    // Set Content Security Policy
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!existingCSP) {
      const cspMeta = document.createElement('meta');
      cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
      cspMeta.setAttribute('content', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://irxrkutczxskuqbpgntd.supabase.co; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' https://irxrkutczxskuqbpgntd.supabase.co wss://irxrkutczxskuqbpgntd.supabase.co; " +
        "frame-ancestors 'none';"
      );
      document.head.appendChild(cspMeta);
    }

    // Set X-Frame-Options
    const existingFrameOptions = document.querySelector('meta[http-equiv="X-Frame-Options"]');
    if (!existingFrameOptions) {
      const frameMeta = document.createElement('meta');
      frameMeta.setAttribute('http-equiv', 'X-Frame-Options');
      frameMeta.setAttribute('content', 'DENY');
      document.head.appendChild(frameMeta);
    }

    // Set X-Content-Type-Options
    const existingContentType = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
    if (!existingContentType) {
      const contentTypeMeta = document.createElement('meta');
      contentTypeMeta.setAttribute('http-equiv', 'X-Content-Type-Options');
      contentTypeMeta.setAttribute('content', 'nosniff');
      document.head.appendChild(contentTypeMeta);
    }

    // Set Referrer Policy
    const existingReferrer = document.querySelector('meta[name="referrer"]');
    if (!existingReferrer) {
      const referrerMeta = document.createElement('meta');
      referrerMeta.setAttribute('name', 'referrer');
      referrerMeta.setAttribute('content', 'strict-origin-when-cross-origin');
      document.head.appendChild(referrerMeta);
    }
  }, []);

  return null; // This component doesn't render anything
}