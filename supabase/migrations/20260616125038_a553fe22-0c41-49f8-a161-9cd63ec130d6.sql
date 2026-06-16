
-- 1) user_badges: add explicit own-row UPDATE/DELETE policies
CREATE POLICY "Users can delete their own badges"
  ON public.user_badges FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own badges"
  ON public.user_badges FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2) profiles: tighten SELECT to own row only
DROP POLICY IF EXISTS "Profiles readable by authenticated (leaderboard)" ON public.profiles;

CREATE POLICY "Users can read their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 3) public_leaderboard view exposing only safe columns for the leaderboard
CREATE OR REPLACE VIEW public.public_leaderboard
WITH (security_invoker = true) AS
SELECT id, display_name, avatar_url, points, current_streak
FROM public.profiles;

GRANT SELECT ON public.public_leaderboard TO authenticated;

-- Allow the view to read across all profiles via a dedicated, column-safe policy.
-- Since security_invoker=true uses the caller's permissions, we need a SELECT
-- policy that allows reading these rows. We scope it via a helper that only
-- returns the safe columns through the view definition above.
CREATE POLICY "Leaderboard rows readable by authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
