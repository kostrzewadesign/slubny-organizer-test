-- Fix the handle_new_user() function to create ALL tasks (remove LIMIT 20)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  profile_id UUID;
BEGIN
  -- Create user profile with better error handling
  BEGIN
    INSERT INTO public.user_profiles (user_id, bride_name, groom_name, total_budget, location, guest_count, notes)
    VALUES (NEW.id, '', '', 50000, '', 50, '')
    RETURNING id INTO profile_id;
    
    RAISE NOTICE 'User profile created successfully for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
  END;

  -- Create ALL default tasks from templates (removed LIMIT 20)
  BEGIN
    INSERT INTO public.tasks (user_id, title, description, category, is_priority, completed, created_at)
    SELECT 
      NEW.id,
      wt.title,
      wt.description,
      wt.category,
      COALESCE(wt.is_priority, false),
      false,
      NOW()
    FROM public.wedding_templates wt
    WHERE wt.template_type = 'task'
    ORDER BY wt.order_index;
      
    RAISE NOTICE 'All default tasks created for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create default tasks for user %: %', NEW.id, SQLERRM;
  END;

  -- Create ALL default budget categories from templates  
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
      
    RAISE NOTICE 'All default expenses created for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create default expenses for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$function$;