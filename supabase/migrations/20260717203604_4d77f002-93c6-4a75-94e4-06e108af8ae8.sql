
-- Remove public read on diary/dreams (internal-only content)
DROP POLICY IF EXISTS "Public read diary" ON public.bark_zero_diary;
DROP POLICY IF EXISTS "Public read dreams" ON public.bark_zero_dreams;

-- Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated;
-- keep service_role only (edge functions call them with the service key).
REVOKE EXECUTE ON FUNCTION public.is_valid_maze_score(integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_maze_rate_limit(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_usage_count(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_leaderboard(integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_and_increment_usage(text, text, integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.is_valid_maze_score(integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_maze_rate_limit(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_usage_count(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_and_increment_usage(text, text, integer) TO service_role;
