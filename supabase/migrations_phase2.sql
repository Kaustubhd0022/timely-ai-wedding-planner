-- Phase 2 Migration Script

-- 1. Create Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wedding_id uuid REFERENCES public.weddings(id) ON DELETE CASCADE,
  category text NOT NULL, -- e.g., 'Venue', 'Catering'
  estimated_amount numeric DEFAULT 0,
  actual_amount numeric DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partially Paid', 'Paid')),
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Create Guests Table
CREATE TABLE IF NOT EXISTS public.guests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wedding_id uuid REFERENCES public.weddings(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text,
  group_tag text, -- e.g., 'Bride Family', 'Groom Family', 'Friends'
  email text,
  phone text,
  rsvp_status text DEFAULT 'Pending' CHECK (rsvp_status IN ('Pending', 'Attending', 'Declined')),
  dietary_requirements text,
  plus_one boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Create Collaborators Table (For Multi-user Support)
CREATE TABLE IF NOT EXISTS public.collaborators (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wedding_id uuid REFERENCES public.weddings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'Editor' CHECK (role IN ('Owner', 'Editor', 'Viewer')),
  invited_email text,
  joined_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(wedding_id, user_id)
);

-- 4. Update Weddings Table for Phase 2
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS total_budget numeric DEFAULT 0;

-- 5. RLS Updates (Allowing Authenticated Users to see their collaborations)
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budgets if they are collaborators" 
ON public.budgets FOR ALL 
USING (
  wedding_id IN (
    SELECT wedding_id FROM public.collaborators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view guests if they are collaborators" 
ON public.guests FOR ALL 
USING (
  wedding_id IN (
    SELECT wedding_id FROM public.collaborators WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can see their own collaborations" 
ON public.collaborators FOR ALL 
USING (user_id = auth.uid());
