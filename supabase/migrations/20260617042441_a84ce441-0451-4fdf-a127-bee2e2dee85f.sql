
-- MISSION VERIFICATION
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS proof_url TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- CHALLENGES
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  goal_co2_kg NUMERIC NOT NULL DEFAULT 1000,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '30 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.challenges TO authenticated, anon;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Challenges readable" ON public.challenges FOR SELECT USING (true);

CREATE TABLE public.challenge_participants (
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  contributed_kg NUMERIC NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (challenge_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_participants TO authenticated;
GRANT ALL ON public.challenge_participants TO service_role;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own participation rows" ON public.challenge_participants
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Aggregated, safe progress view exposed via SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.get_challenge_progress()
RETURNS TABLE (
  challenge_id UUID,
  participant_count BIGINT,
  total_kg NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT challenge_id,
         COUNT(*)::BIGINT AS participant_count,
         COALESCE(SUM(contributed_kg), 0) AS total_kg
  FROM public.challenge_participants
  GROUP BY challenge_id;
$$;

-- Seed starter challenges
INSERT INTO public.challenges (slug, name, description, category, goal_co2_kg, ends_at) VALUES
  ('meatless-may', 'Meatless Month', 'Cut meat from your diet for 30 days and log your savings.', 'food', 5000, now() + INTERVAL '30 days'),
  ('cycle-to-work', 'Cycle to Work', 'Replace 10 commutes with biking or walking.', 'transport', 2500, now() + INTERVAL '30 days'),
  ('unplug-week', 'Unplug Week', 'Cut phantom load and reduce home electricity by 15%.', 'electricity', 1500, now() + INTERVAL '14 days')
ON CONFLICT (slug) DO NOTHING;
