-- Drop the overly permissive policy
DROP POLICY "Anyone can submit scores" ON public.maze_leaderboard;

-- Add a more restrictive insert policy with basic validation
-- Limit name length and require valid wallet format
CREATE POLICY "Submit scores with validation" 
ON public.maze_leaderboard 
FOR INSERT 
WITH CHECK (
  length(player_name) >= 1 AND 
  length(player_name) <= 20 AND
  length(wallet_address) >= 32 AND
  length(wallet_address) <= 50
);