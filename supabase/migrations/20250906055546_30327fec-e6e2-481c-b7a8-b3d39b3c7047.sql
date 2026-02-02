-- Create user profiles table
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bride_name TEXT,
  groom_name TEXT,
  wedding_date DATE,
  total_budget DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  is_priority BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  task_type TEXT DEFAULT 'wedding' CHECK (task_type IN ('wedding', 'budget')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'planned' CHECK (payment_status IN ('planned', 'partial', 'paid')),
  paid_amount DECIMAL(10,2) DEFAULT 0,
  note TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create guests table
CREATE TABLE public.guests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  guest_group TEXT DEFAULT 'family',
  status TEXT DEFAULT 'invited',
  child_age INTEGER,
  rsvp_status TEXT DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'confirmed', 'declined', 'attending')),
  email TEXT,
  phone TEXT,
  accommodation BOOLEAN DEFAULT false,
  transport BOOLEAN DEFAULT false,
  dietary_restrictions TEXT,
  is_child BOOLEAN DEFAULT false,
  is_service_provider BOOLEAN DEFAULT false,
  discount_type TEXT,
  companion_of_guest_id UUID REFERENCES public.guests(id),
  table_assignment UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on guests
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- Create tables table
CREATE TABLE public.tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  seats INTEGER NOT NULL DEFAULT 8,
  table_type TEXT DEFAULT 'round',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tables
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- Create table_assignments table
CREATE TABLE public.table_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(guest_id, table_id)
);

-- Enable RLS on table_assignments
ALTER TABLE public.table_assignments ENABLE ROW LEVEL SECURITY;

-- Create custom_categories table
CREATE TABLE public.custom_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  category_type TEXT NOT NULL CHECK (category_type IN ('task', 'expense')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_name, category_type)
);

-- Enable RLS on custom_categories
ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

-- Create wedding_templates table (global templates)
CREATE TABLE public.wedding_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_type TEXT NOT NULL CHECK (template_type IN ('task', 'expense')),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  is_priority BOOLEAN DEFAULT false,
  amount DECIMAL(10,2),
  payment_status TEXT DEFAULT 'planned',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON public.user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for tasks
CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for expenses
CREATE POLICY "Users can view own expenses" ON public.expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON public.expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON public.expenses
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for guests
CREATE POLICY "Users can view own guests" ON public.guests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own guests" ON public.guests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own guests" ON public.guests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own guests" ON public.guests
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for tables
CREATE POLICY "Users can view own tables" ON public.tables
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tables" ON public.tables
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tables" ON public.tables
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tables" ON public.tables
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for table_assignments
CREATE POLICY "Users can view own table assignments" ON public.table_assignments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own table assignments" ON public.table_assignments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own table assignments" ON public.table_assignments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own table assignments" ON public.table_assignments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for custom_categories
CREATE POLICY "Users can view own categories" ON public.custom_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON public.custom_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.custom_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON public.custom_categories
  FOR DELETE USING (auth.uid() = user_id);

-- Wedding templates are publicly readable
CREATE POLICY "Templates are publicly readable" ON public.wedding_templates
  FOR SELECT USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updating timestamps
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_guests_updated_at
  BEFORE UPDATE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tables_updated_at
  BEFORE UPDATE ON public.tables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (user_id, bride_name, groom_name)
  VALUES (NEW.id, 'Panna Młoda', 'Pan Młody');
  
  -- Initialize default tasks from templates
  INSERT INTO public.tasks (user_id, title, description, category, is_priority, task_type)
  SELECT 
    NEW.id,
    title,
    description,
    category,
    is_priority,
    template_type
  FROM public.wedding_templates
  WHERE template_type = 'task';
  
  -- Initialize default expenses from templates
  INSERT INTO public.expenses (user_id, title, category, amount, payment_status)
  SELECT 
    NEW.id,
    title,
    category,
    COALESCE(amount, 0),
    COALESCE(payment_status, 'planned')
  FROM public.wedding_templates
  WHERE template_type = 'expense';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for new user initialization
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default wedding task templates
INSERT INTO public.wedding_templates (template_type, title, category, description, is_priority, order_index) VALUES
('task', 'Ustal datę ślubu', 'Podstawy', 'Wybór daty ceremonii ślubnej', true, 1),
('task', 'Zarezerwuj kościół/USC', 'Ceremonia', 'Rezerwacja miejsca ceremonii', true, 2),
('task', 'Znajdź salę weselną', 'Wesele', 'Rezerwacja sali na przyjęcie weselne', true, 3),
('task', 'Wybierz fotografa', 'Dokumentacja', 'Znalezienie fotografa ślubnego', true, 4),
('task', 'Zamów suknię ślubną', 'Stroje', 'Wybór i zamówienie sukni ślubnej', true, 5),
('task', 'Zamów garnitur', 'Stroje', 'Wybór i zamówienie garnituru', false, 6),
('task', 'Wybierz zespół muzyczny/DJ', 'Rozrywka', 'Rezerwacja oprawy muzycznej', false, 7),
('task', 'Zamów tort weselny', 'Catering', 'Wybór i zamówienie tortu', false, 8),
('task', 'Wyślij zaproszenia', 'Goście', 'Przygotowanie i wysłanie zaproszeń', false, 9),
('task', 'Zarezerwuj pokój hotelowy', 'Noc poślubna', 'Rezerwacja noclegu na pierwszą noc', false, 10);

-- Insert default wedding expense templates
INSERT INTO public.wedding_templates (template_type, title, category, amount, payment_status, order_index) VALUES
('expense', 'Sala weselna', 'Wesele', 15000.00, 'planned', 1),
('expense', 'Catering', 'Jedzenie i napoje', 12000.00, 'planned', 2),
('expense', 'Fotograf', 'Dokumentacja', 3500.00, 'planned', 3),
('expense', 'Suknia ślubna', 'Stroje', 3000.00, 'planned', 4),
('expense', 'Garnitur', 'Stroje', 1500.00, 'planned', 5),
('expense', 'Zespół muzyczny', 'Rozrywka', 2500.00, 'planned', 6),
('expense', 'Dekoracje', 'Dekoracje', 2000.00, 'planned', 7),
('expense', 'Tort weselny', 'Jedzenie i napoje', 800.00, 'planned', 8),
('expense', 'Zaproszenia', 'Papeteria', 500.00, 'planned', 9),
('expense', 'Transport', 'Transport', 1200.00, 'planned', 10);