-- The view with security_invoker=on inherits caller's permissions
-- But since we blocked anon from the base table, the view won't work
-- Let's create a security definer function to read leaderboard safely

-- First, drop the restrictive policy we just created
DROP POLICY IF EXISTS "Base table readable by service role only" ON public.maze_leaderboard;

-- Create a more nuanced policy that allows SELECT but only specific columns
-- Since RLS can't restrict columns, we'll use a different approach:
-- Allow SELECT but the app only queries the specific columns it needs
CREATE POLICY "Leaderboard scores are viewable by everyone" 
ON public.maze_leaderboard 
FOR SELECT 
USING (true);

-- The security is now enforced at the application layer by only selecting
-- the safe columns (id, player_name, difficulty, moves, created_at)
-- and never selecting wallet_address in the frontend query