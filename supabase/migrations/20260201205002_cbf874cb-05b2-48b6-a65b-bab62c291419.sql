-- Create function to validate reasonable move counts based on difficulty
-- Minimum moves are based on the shortest possible path through each maze
CREATE OR REPLACE FUNCTION public.is_valid_maze_score(p_difficulty INTEGER, p_moves INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Minimum realistic moves for each difficulty level
  -- Easy maze: minimum ~15 moves, Medium: ~18 moves, Hard: ~20 moves
  RETURN CASE p_difficulty
    WHEN 0 THEN p_moves >= 12  -- Easy
    WHEN 1 THEN p_moves >= 15  -- Medium
    WHEN 2 THEN p_moves >= 18  -- Hard
    ELSE FALSE
  END;
END;
$$;

-- Create function to check rate limit (max 5 submissions per wallet per hour)
CREATE OR REPLACE FUNCTION public.check_maze_rate_limit(p_wallet TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.maze_leaderboard
  WHERE wallet_address = p_wallet
    AND created_at > NOW() - INTERVAL '1 hour';
  
  RETURN recent_count < 5;
END;
$$;

-- Drop old insert policy
DROP POLICY IF EXISTS "Submit scores with validation" ON public.maze_leaderboard;

-- Create new insert policy with score validation and rate limiting
CREATE POLICY "Submit validated scores with rate limit" 
ON public.maze_leaderboard 
FOR INSERT 
WITH CHECK (
  length(player_name) >= 1 AND 
  length(player_name) <= 20 AND
  length(wallet_address) >= 32 AND
  length(wallet_address) <= 50 AND
  public.is_valid_maze_score(difficulty, moves) AND
  public.check_maze_rate_limit(wallet_address)
);