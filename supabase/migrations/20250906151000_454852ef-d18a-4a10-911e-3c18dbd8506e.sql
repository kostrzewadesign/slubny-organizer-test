-- Fix wedding templates security warning by restricting access
-- Only allow reading templates during user onboarding/setup, not general access

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can read templates" ON public.wedding_templates;

-- Create a more restrictive policy that only allows reading templates
-- when a user doesn't have existing tasks/expenses (during initial setup)
CREATE POLICY "Users can read templates during setup only" 
ON public.wedding_templates 
FOR SELECT 
TO authenticated
USING (
  -- Allow access only if user has no tasks yet (indicating they're in setup phase)
  NOT EXISTS (
    SELECT 1 FROM public.tasks WHERE user_id = auth.uid()
  )
  OR
  -- Or if user has no expenses yet (also indicating setup phase)
  NOT EXISTS (
    SELECT 1 FROM public.expenses WHERE user_id = auth.uid()
  )
);

-- Keep the service role policy for system operations
-- The "Service role manages templates" policy remains unchanged