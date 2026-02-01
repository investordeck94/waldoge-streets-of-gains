-- Create a public view that excludes sensitive wallet_address column
CREATE VIEW public.maze_leaderboard_public
WITH (security_invoker=on) AS
  SELECT id, player_name, difficulty, moves, created_at
  FROM public.maze_leaderboard;

-- Drop the overly permissive SELECT policy on the base table
DROP POLICY IF EXISTS "Leaderboard is viewable by everyone" ON public.maze_leaderboard;

-- Create restrictive SELECT policy - only service role can read base table directly
-- This prevents direct access to wallet_address column
CREATE POLICY "Base table readable by service role only" 
ON public.maze_leaderboard 
FOR SELECT 
USING (auth.role() = 'service_role');

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.maze_leaderboard_public TO anon, authenticated;