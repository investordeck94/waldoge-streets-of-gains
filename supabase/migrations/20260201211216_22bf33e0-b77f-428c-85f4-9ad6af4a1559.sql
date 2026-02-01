-- Better approach: Create a security definer function that returns only safe columns
-- This prevents direct table access from exposing wallet_address

-- Drop the permissive policy
DROP POLICY IF EXISTS "Leaderboard scores are viewable by everyone" ON public.maze_leaderboard;

-- Create restrictive policy - deny all direct SELECT access
CREATE POLICY "No direct SELECT access to leaderboard" 
ON public.maze_leaderboard 
FOR SELECT 
USING (false);

-- Create a security definer function to safely read leaderboard
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_difficulty INTEGER, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  player_name TEXT,
  difficulty INTEGER,
  moves INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ml.id,
    ml.player_name,
    ml.difficulty,
    ml.moves,
    ml.created_at
  FROM public.maze_leaderboard ml
  WHERE ml.difficulty = p_difficulty
  ORDER BY ml.moves ASC
  LIMIT LEAST(p_limit, 100);  -- Cap at 100 max
END;
$$;