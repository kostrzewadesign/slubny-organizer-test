-- Improve handle_new_user trigger with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
    INSERT INTO public.budget_categories (user_id, name, allocated_amount, spent_amount, created_at)
    VALUES 
      (NEW.id, 'Sala weselna', 15000, 0, NOW()),
      (NEW.id, 'Catering', 12000, 0, NOW()),
      (NEW.id, 'Fotograf', 5000, 0, NOW()),
      (NEW.id, 'Muzyka/DJ', 3000, 0, NOW()),
      (NEW.id, 'Kwiaty i dekoracje', 3000, 0, NOW()),
      (NEW.id, 'Strój panny młodej', 4000, 0, NOW()),
      (NEW.id, 'Strój pana młodego', 2000, 0, NOW()),
      (NEW.id, 'Obrączki', 2000, 0, NOW()),
      (NEW.id, 'Inne wydatki', 4000, 0, NOW());
      
    RAISE NOTICE 'Default budget categories created for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log warning but don't fail
    RAISE WARNING 'Failed to create default budget categories for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;