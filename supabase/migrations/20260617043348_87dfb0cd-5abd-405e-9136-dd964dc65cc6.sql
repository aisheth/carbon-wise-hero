
REVOKE EXECUTE ON FUNCTION public.get_leaderboard(integer) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_challenge_progress() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_challenge_progress() TO authenticated;
