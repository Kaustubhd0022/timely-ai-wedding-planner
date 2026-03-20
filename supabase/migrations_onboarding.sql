-- Migration: Onboarding upgrades
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS groom_name text;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS bride_name text;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS groom_whatsapp text;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS bride_whatsapp text;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS user_city text;
