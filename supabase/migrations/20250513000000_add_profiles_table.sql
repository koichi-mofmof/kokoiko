-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view any profile
CREATE POLICY "Allow users to view any profile" ON public.profiles
  FOR SELECT USING (true);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Allow users to insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Set up Storage for profile images
INSERT INTO storage.buckets (id, name, public) VALUES ('profile_images', 'profile_images', true) ON CONFLICT DO NOTHING;

-- Create policy to read profile images
CREATE POLICY "Anyone can view profile images" ON storage.objects FOR SELECT
USING (bucket_id = 'profile_images');

-- Create policy to upload profile images
CREATE POLICY "Users can upload their own profile image" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile_images' AND auth.uid() = owner);

-- Create policy to update profile images
CREATE POLICY "Users can update their own profile image" ON storage.objects FOR UPDATE
USING (bucket_id = 'profile_images' AND auth.uid() = owner);

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, 'user_' || substr(NEW.id::text, 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 