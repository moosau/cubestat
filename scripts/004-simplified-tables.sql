-- Drop existing tables and recreate with simpler structure
DROP TABLE IF EXISTS public.solve_records;
DROP TABLE IF EXISTS public.profiles;

-- Create profiles table with simpler structure
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create solve_records table
CREATE TABLE public.solve_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  time_ms INTEGER NOT NULL,
  solve_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solve_records ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create policies for solve_records
CREATE POLICY "Users can view own solve records" ON public.solve_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own solve records" ON public.solve_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own solve records" ON public.solve_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own solve records" ON public.solve_records
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.solve_records TO authenticated;
GRANT SELECT ON public.profiles TO anon;
