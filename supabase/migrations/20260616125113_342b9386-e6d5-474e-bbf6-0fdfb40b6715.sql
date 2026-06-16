
-- Drop the broad policy we just added; profiles should only be readable by owner directly.
DROP POLICY IF EXISTS "Leaderboard rows readable by authenticated" ON public.profiles;

-- Recreate the leaderboard view with security_invoker = false (definer),
-- so it can read safe columns across all profiles without exposing the full table.
DROP VIEW IF EXISTS public.public_leaderboard;

CREATE VIEW public.public_leaderboard
WITH (security_invoker = false) AS
SELECT id, display_name, avatar_url, points, current_streak
FROM public.profiles;

GRANT SELECT ON public.public_leaderboard TO authenticated;
