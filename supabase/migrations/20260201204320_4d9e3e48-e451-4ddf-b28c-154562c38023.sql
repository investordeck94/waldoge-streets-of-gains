-- Create leaderboard table for maze game
CREATE TABLE public.maze_leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty >= 0 AND difficulty <= 2),
  moves INTEGER NOT NULL CHECK (moves > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_maze_leaderboard_difficulty_moves ON public.maze_leaderboard (difficulty, moves ASC);
CREATE INDEX idx_maze_leaderboard_created_at ON public.maze_leaderboard (created_at DESC);

-- Enable RLS
ALTER TABLE public.maze_leaderboard ENABLE ROW LEVEL SECURITY;

-- Anyone can view leaderboard
CREATE POLICY "Leaderboard is viewable by everyone" 
ON public.maze_leaderboard 
FOR SELECT 
USING (true);

-- Anyone can insert scores (no auth required for game)
CREATE POLICY "Anyone can submit scores" 
ON public.maze_leaderboard 
FOR INSERT 
WITH CHECK (true);