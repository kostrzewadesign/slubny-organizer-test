-- Create trigger function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  profile_id UUID;
BEGIN
  -- Create user profile with better error handling
  BEGIN
    INSERT INTO public.user_profiles (user_id, bride_name, groom_name, total_budget)
    VALUES (NEW.id, '', '', 50000)
    RETURNING id INTO profile_id;
    
    -- Log successful profile creation
    RAISE NOTICE 'User profile created successfully for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    -- Still return NEW so the user creation doesn't fail
    RETURN NEW;
  END;

  -- Try to create default tasks (non-critical, can fail)
  BEGIN
    -- Create default high-priority tasks for new users
    INSERT INTO public.tasks (user_id, title, description, category, is_priority, status, created_at)
    VALUES 
      (NEW.id, 'Ustal datę ślubu', 'Wybierz datę ceremonii ślubnej i przyjęcia', 'Podstawy', true, 'pending', NOW()),
      (NEW.id, 'Wybierz miejsce ceremonii', 'Znajdź i zarezerwuj miejsce ceremonii ślubnej', 'Podstawy', true, 'pending', NOW()),
      (NEW.id, 'Ustal budżet ślubu', 'Określ całkowity budżet na organizację ślubu', 'Finanse', true, 'pending', NOW()),
      (NEW.id, 'Lista gości', 'Stwórz listę osób zaproszonych na ślub', 'Goście', true, 'pending', NOW());
      
    RAISE NOTICE 'Default tasks created for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log warning but don't fail
    RAISE WARNING 'Failed to create default tasks for user %: %', NEW.id, SQLERRM;
  END;

  -- Try to create default budget categories (non-critical, can fail)  
  BEGIN
    INSERT INTO public.expenses (user_id, title, category, amount, payment_status, created_at)
    VALUES 
      (NEW.id, 'Sala weselna', 'Miejsce', 15000, 'planned', NOW()),
      (NEW.id, 'Catering', 'Jedzenie', 12000, 'planned', NOW()),
      (NEW.id, 'Fotograf', 'Usługi', 5000, 'planned', NOW()),
      (NEW.id, 'Muzyka/DJ', 'Rozrywka', 3000, 'planned', NOW()),
      (NEW.id, 'Kwiaty i dekoracje', 'Dekoracje', 3000, 'planned', NOW()),
      (NEW.id, 'Suknia ślubna', 'Strój', 4000, 'planned', NOW()),
      (NEW.id, 'Garnitur', 'Strój', 2000, 'planned', NOW()),
      (NEW.id, 'Obrączki', 'Biżuteria', 2000, 'planned', NOW()),
      (NEW.id, 'Inne wydatki', 'Inne', 4000, 'planned', NOW());
      
    RAISE NOTICE 'Default expenses created for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log warning but don't fail
    RAISE WARNING 'Failed to create default expenses for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Create trigger that fires when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();