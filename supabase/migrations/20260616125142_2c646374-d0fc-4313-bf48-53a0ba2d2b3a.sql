
DROP VIEW IF EXISTS public.public_leaderboard;

CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit int DEFAULT 20)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  points int,
  current_streak int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, display_name, avatar_url, points, current_streak
  FROM public.profiles
  ORDER BY points DESC
  LIMIT GREATEST(1, LEAST(_limit, 100));
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(int) TO authenticated;
