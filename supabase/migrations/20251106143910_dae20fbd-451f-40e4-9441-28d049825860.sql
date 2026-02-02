-- Create function to initialize default tasks from templates if user has none
CREATE OR REPLACE FUNCTION public.init_default_tasks_if_needed()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH ins AS (
    INSERT INTO tasks (user_id, title, description, category, is_priority, completed, created_at)
    SELECT 
      auth.uid(),
      wt.title,
      wt.description,
      wt.category,
      COALESCE(wt.is_priority, false),
      false,
      NOW()
    FROM wedding_templates wt
    WHERE wt.template_type = 'task'
      AND NOT EXISTS (
        SELECT 1 FROM tasks t WHERE t.user_id = auth.uid()
      )
    ORDER BY wt.order_index
    RETURNING 1
  )
  SELECT COUNT(*)::integer FROM ins;
$function$;
