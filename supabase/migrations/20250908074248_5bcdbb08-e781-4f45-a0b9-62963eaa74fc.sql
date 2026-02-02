-- Fix handle_new_user function to use 'completed' instead of 'status' and add missing fields to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS guest_count integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS notes text;

-- Drop and recreate the handle_new_user function with fixes
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  profile_id UUID;
BEGIN
  -- Create user profile with better error handling
  BEGIN
    INSERT INTO public.user_profiles (user_id, bride_name, groom_name, total_budget, location, guest_count, notes)
    VALUES (NEW.id, '', '', 50000, '', 50, '')
    RETURNING id INTO profile_id;
    
    -- Log successful profile creation
    RAISE NOTICE 'User profile created successfully for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    -- Still return NEW so the user creation doesn't fail
    RETURN NEW;
  END;

  -- Try to create default tasks from templates (non-critical, can fail)
  BEGIN
    -- Create default high-priority tasks from wedding_templates
    INSERT INTO public.tasks (user_id, title, description, category, is_priority, completed, created_at)
    SELECT 
      NEW.id,
      wt.title,
      wt.description,
      wt.category,
      COALESCE(wt.is_priority, false),
      false,  -- Use 'completed' instead of 'status'
      NOW()
    FROM public.wedding_templates wt
    WHERE wt.template_type = 'task'
    ORDER BY wt.order_index
    LIMIT 20; -- Start with most important tasks
      
    RAISE NOTICE 'Default tasks created for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log warning but don't fail
    RAISE WARNING 'Failed to create default tasks for user %: %', NEW.id, SQLERRM;
  END;

  -- Try to create default budget categories from templates (non-critical, can fail)  
  BEGIN
    INSERT INTO public.expenses (user_id, title, category, amount, payment_status, created_at)
    SELECT 
      NEW.id,
      wt.title,
      wt.category,
      0, -- Start with 0 amounts as templates
      COALESCE(wt.payment_status, 'planned'),
      NOW()
    FROM public.wedding_templates wt
    WHERE wt.template_type = 'expense'
    ORDER BY wt.order_index;
      
    RAISE NOTICE 'Default expenses created for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log warning but don't fail
    RAISE WARNING 'Failed to create default expenses for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$function$;