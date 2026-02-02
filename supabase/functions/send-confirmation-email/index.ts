import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthWebhookPayload {
  user: {
    id: string;
    email: string;
    created_at: string;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

const generatePolishConfirmationEmail = (token: string, confirmationUrl: string, email: string) => {
  return `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Potwierdź swoje konto - Ślubny Organizer</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background-color: #f9f9f9; 
          margin: 0; 
          padding: 20px; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 12px; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
          overflow: hidden;
        }
        .header { 
          background: linear-gradient(135deg, #A3B368 0%, #8FA055 100%); 
          color: white; 
          padding: 30px; 
          text-align: center; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 28px; 
          font-weight: 600; 
        }
        .header .subtitle { 
          margin: 8px 0 0 0; 
          font-size: 16px; 
          opacity: 0.9; 
        }
        .content { 
          padding: 40px 30px; 
        }
        .content h2 { 
          color: #2d3748; 
          margin: 0 0 20px 0; 
          font-size: 24px; 
        }
        .content p { 
          margin: 16px 0; 
          font-size: 16px; 
          line-height: 1.7; 
        }
        .button { 
          display: inline-block; 
          background: #A3B368; 
          color: white; 
          text-decoration: none; 
          padding: 16px 32px; 
          border-radius: 8px; 
          font-weight: 600; 
          margin: 24px 0; 
          transition: background-color 0.3s;
        }
        .button:hover { 
          background: #8FA055; 
        }
        .token-box { 
          background: #f7fafc; 
          border: 2px dashed #A3B368; 
          border-radius: 8px; 
          padding: 20px; 
          margin: 20px 0; 
          text-align: center; 
        }
        .token { 
          font-family: monospace; 
          font-size: 18px; 
          font-weight: bold; 
          color: #2d3748; 
          letter-spacing: 2px; 
        }
        .footer { 
          background: #f7fafc; 
          padding: 30px; 
          text-align: center; 
          border-top: 1px solid #e2e8f0; 
        }
        .footer p { 
          margin: 8px 0; 
          font-size: 14px; 
          color: #718096; 
        }
        .warning { 
          background: #fef5e7; 
          border-left: 4px solid #f6ad55; 
          padding: 16px; 
          margin: 20px 0; 
          border-radius: 0 8px 8px 0; 
        }
        .heart { 
          color: #e53e3e; 
          font-size: 20px; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://your-domain.com/logo.webp" alt="Ślubny Organizer" style="max-width: 180px; height: auto; margin: 0 auto 15px auto; display: block;" />
          <h1 style="margin-top: 0;">Ślubny Organizer</h1>
          <p class="subtitle">Twój asystent w organizacji wymarzonego ślubu</p>
        </div>
        
        <div class="content">
          <h2>Witamy w Ślubnym Organizerze!</h2>
          
          <p>Cześć!</p>
          
          <p>Dziękujemy za rejestrację w <strong>Ślubnym Organizerze</strong>. Aby rozpocząć planowanie swojego wymarzonego ślubu, musisz potwierdzić swój adres email.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" class="button">
              ✅ Potwierdź moje konto
            </a>
          </div>
          
          <p>Jeśli przycisk nie działa, skopiuj i wklej poniższy link do przeglądarki:</p>
          <p style="word-break: break-all; background: #f7fafc; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 14px;">
            ${confirmationUrl}
          </p>
          
          <div class="token-box">
            <p style="margin: 0 0 10px 0; font-weight: 600;">Lub użyj kodu potwierdzającego:</p>
            <div class="token">${token}</div>
          </div>
          
          <div class="warning">
            <p style="margin: 0; font-size: 14px;">
              <strong>Ważne:</strong> Link jest ważny przez 24 godziny. Jeśli nie potwierdzisz konta w tym czasie, będziesz musiał zarejestrować się ponownie.
            </p>
          </div>
          
          <p>Po potwierdzeniu konta będziesz mógł:</p>
          <ul style="margin: 16px 0; padding-left: 20px;">
            <li>📋 Tworzyć i zarządzać listą zadań ślubnych</li>
            <li>💰 Planować i śledzić budżet ślubu</li>
            <li>👥 Zarządzać listą gości</li>
            <li>🪑 Planować rozsadzenie gości</li>
            <li>📅 Śledzić harmonogram przygotowań</li>
          </ul>
          
          <p>Życzymy Ci wspaniałych przygotowań do ślubu!</p>
        </div>
        
        <div class="footer">
          <p><strong>Zespół Ślubnego Organizera</strong></p>
          <p>Jeśli nie rejestrowałeś/aś się w naszym serwisie, zignoruj ten email.</p>
          <p style="margin-top: 20px;">
            <small>Ten email został wysłany na adres: ${email}</small>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  console.log('Auth webhook received:', req.method);
  
  // Enhanced security logging
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  console.log(`[SECURITY] Webhook request from IP: ${clientIP}, User-Agent: ${userAgent}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    console.log(`[SECURITY] Invalid method attempted: ${req.method} from IP: ${clientIP}`);
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Secure webhook verification enabled
    if (!hookSecret) {
      console.error('[SECURITY] Webhook secret not configured');
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(hookSecret);
    
    let webhookData: AuthWebhookPayload;
    try {
      webhookData = wh.verify(payload, headers) as AuthWebhookPayload;
      console.log('[SECURITY] Webhook signature verified successfully');
    } catch (err) {
      console.error('[SECURITY] Webhook signature verification failed:', err);
      console.log('[SECURITY] Failed verification from IP:', clientIP);
      return new Response(JSON.stringify({ error: "Unauthorized webhook request" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { user, email_data } = webhookData;
    
    // Enhanced validation
    if (!user || !user.email || !email_data || !email_data.token) {
      console.error('Missing user or email_data in webhook payload');
      return new Response(JSON.stringify({ error: "Missing required data" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      console.error('Invalid email format:', user.email);
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Only handle signup confirmations
    if (email_data.email_action_type !== 'signup') {
      console.log('Skipping non-signup email type:', email_data.email_action_type);
      return new Response(JSON.stringify({ message: "Email type not handled" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Build confirmation URL using hardcoded app domain (ignore site_url from Supabase)
    const APP_DOMAIN = 'https://app.slubnyorganizer.pl';
    const confirmationUrl = `${APP_DOMAIN}/auth/callback?token_hash=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${encodeURIComponent(email_data.redirect_to || '/dashboard')}`;
    
    console.log('Sending email to:', user.email);
    console.log('Original site_url from Supabase:', email_data.site_url);
    console.log('Modified confirmation URL:', confirmationUrl);

    // Generate Polish email content
    const htmlContent = generatePolishConfirmationEmail(
      email_data.token, 
      confirmationUrl, 
      user.email
    );

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Ślubny Organizer <noreply@slubnyorganizer.pl>",
      to: [user.email],
      subject: "Potwierdź swoje konto - Ślubny Organizer 💖",
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log successful email send for security monitoring
    console.log('Security audit: Email sent to:', user.email, 'IP:', clientIP, 'User-Agent:', userAgent);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Polish confirmation email sent",
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-confirmation-email function:", error);
    
    // Enhanced error logging for security monitoring
    console.log('Security audit: Email send failed, IP:', clientIP, 'User-Agent:', userAgent, 'Error:', error.message);
    
    // Handle webhook verification errors specifically
    if (error.message?.includes('signature') || error.message?.includes('webhook')) {
      return new Response(JSON.stringify({ 
        error: 'Webhook signature verification failed'
      }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // Don't expose internal error details to prevent information leakage
    return new Response(JSON.stringify({ 
      error: "Failed to send email",
      details: Deno.env.get("ENVIRONMENT") === 'development' ? error.message : 'Internal server error'
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);