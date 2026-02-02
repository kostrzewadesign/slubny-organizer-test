-- Fix critical security issue: Enable RLS on wedding_templates
-- Currently templates are publicly readable but should be secured

-- Enable Row Level Security on wedding_templates
ALTER TABLE public.wedding_templates ENABLE ROW LEVEL SECURITY;

-- Update the existing policy to be more specific
DROP POLICY IF EXISTS "Templates are publicly readable" ON public.wedding_templates;

-- Create new policy allowing only authenticated users to read templates
CREATE POLICY "Templates are readable by authenticated users" ON public.wedding_templates
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role to manage templates (for initial data seeding)
CREATE POLICY "Service role can manage templates" ON public.wedding_templates
  FOR ALL USING (auth.role() = 'service_role');