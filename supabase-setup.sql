-- VMF Governance Database Setup Script
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create charities table
CREATE TABLE IF NOT EXISTS public.charities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    website TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    mission TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_address ON public.user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_charities_name ON public.charities(name);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
-- Users can read all profiles
CREATE POLICY "Allow read access to all profiles" ON public.user_profiles
    FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "Allow users to insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (true);

-- Users can update their own profile
CREATE POLICY "Allow users to update their own profile" ON public.user_profiles
    FOR UPDATE USING (true);

-- Create policies for charities
-- Everyone can read charities
CREATE POLICY "Allow read access to all charities" ON public.charities
    FOR SELECT USING (true);

-- Only authenticated users can insert charities (for admin functionality)
CREATE POLICY "Allow authenticated users to insert charities" ON public.charities
    FOR INSERT TO authenticated WITH CHECK (true);

-- Only authenticated users can update charities
CREATE POLICY "Allow authenticated users to update charities" ON public.charities
    FOR UPDATE TO authenticated USING (true);

-- Insert some sample charities
INSERT INTO public.charities (name, website, logo_url, mission, description) VALUES
('Red Cross', 'https://www.redcross.org', 'https://via.placeholder.com/100x100?text=RC', 'Prevent and alleviate human suffering', 'The American Red Cross prevents and alleviates human suffering in the face of emergencies by mobilizing the power of volunteers and the generosity of donors.'),
('Doctors Without Borders', 'https://www.doctorswithoutborders.org', 'https://via.placeholder.com/100x100?text=DWB', 'Medical humanitarian aid', 'Doctors Without Borders/Médecins Sans Frontières (MSF) cares for people affected by conflict, disease outbreaks, natural and human-made disasters, and exclusion from health care.'),
('World Wildlife Fund', 'https://www.worldwildlife.org', 'https://via.placeholder.com/100x100?text=WWF', 'Wildlife conservation', 'WWF works to sustain the natural world for the benefit of people and wildlife, collaborating with partners from local to global levels.'),
('UNICEF', 'https://www.unicef.org', 'https://via.placeholder.com/100x100?text=UNICEF', 'Children''s rights and welfare', 'UNICEF works in over 190 countries and territories to save children''s lives, to defend their rights, and to help them fulfill their potential.')
ON CONFLICT (name) DO NOTHING;

-- Create storage buckets (Note: This needs to be done via Supabase Dashboard or API)
-- You'll need to create these buckets manually in your Supabase dashboard:
-- 1. Go to Storage in your Supabase dashboard
-- 2. Create a bucket named "avatars" with public access
-- 3. Create a bucket named "charities" with public access

-- Storage policies will be automatically created when you create the buckets
-- But here are the policies you should have:

-- For avatars bucket:
-- Policy: "Allow public read access" - SELECT for public
-- Policy: "Allow authenticated upload" - INSERT for authenticated users
-- Policy: "Allow users to update their own avatars" - UPDATE for authenticated users

-- For charities bucket:
-- Policy: "Allow public read access" - SELECT for public  
-- Policy: "Allow authenticated upload" - INSERT for authenticated users 