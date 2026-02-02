-- Create a function to send confirmation email via edge function
CREATE OR REPLACE FUNCTION public.send_user_confirmation_email()
RETURNS TRIGGER AS $$
DECLARE
  user_data jsonb;
  email_data jsonb;
  payload jsonb;
  response jsonb;
BEGIN
  -- Only proceed if this is a new user signup (not email confirmation)
  IF NEW.email_confirmed_at IS NULL AND OLD.email_confirmed_at IS NULL THEN
    -- Build the payload structure expected by the edge function
    user_data := jsonb_build_object(
      'id', NEW.id::text,
      'email', NEW.email
    );
    
    email_data := jsonb_build_object(
      'token', NEW.confirmation_token,
      'token_hash', NEW.confirmation_token,
      'redirect_to', '/dashboard',
      'email_action_type', 'signup',
      'site_url', 'https://irxrkutczxskuqbpgntd.supabase.co'
    );
    
    payload := jsonb_build_object(
      'user', user_data,
      'email_data', email_data
    );
    
    -- Call the edge function
    SELECT content::jsonb INTO response
    FROM http((
      'POST',
      'https://irxrkutczxskuqbpgntd.supabase.co/functions/v1/send-confirmation-email',
      ARRAY[
        http_header('Content-Type', 'application/json'),
        http_header('Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true))
      ],
      payload::text
    ));
    
    -- Log the result (optional)
    RAISE LOG 'Confirmation email sent for user %: %', NEW.email, response;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically send confirmation emails
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.send_user_confirmation_email();

-- Enable the http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http;