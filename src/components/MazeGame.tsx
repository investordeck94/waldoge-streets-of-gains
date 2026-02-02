import { FC, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Trophy, Gamepad2, Medal, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import waldogeMaze from "@/assets/waldoge-maze.png";

interface Position {
  x: number;
  y: number;
}

interface LeaderboardEntry {
  id: string;
  player_name: string;
  difficulty: number;
  moves: number;
  created_at: string;
}

// Maze cell types: 0 = wall, 1 = path
const MAZE_TEMPLATES = [
  // Easy maze (11x11)
  [
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,0,1,1,1,1,1,0],
    [0,1,0,1,0,1,0,0,0,1,0],
    [0,1,0,1,1,1,1,1,0,1,0],
    [0,1,0,0,0,0,0,1,0,1,0],
    [0,1,1,1,1,1,0,1,1,1,0],
    [0,0,0,0,0,1,0,0,0,1,0],
    [0,1,1,1,0,1,1,1,0,1,0],
    [0,1,0,1,0,0,0,1,0,1,0],
    [0,1,0,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0],
  ],
  // Medium maze
  [
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,1,0,1,1,1,1,1,0,1,0],
    [0,1,0,1,0,0,0,1,0,1,0],
    [0,1,1,1,0,1,1,1,1,1,0],
    [0,0,0,1,0,1,0,0,0,0,0],
    [0,1,1,1,0,1,1,1,1,1,0],
    [0,1,0,0,0,0,0,0,0,1,0],
    [0,1,0,1,1,1,1,1,0,1,0],
    [0,1,0,1,0,0,0,1,0,1,0],
    [0,1,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0],
  ],
  // Hard maze
  [
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,0,1,0,1,1,1,0],
    [0,0,0,1,0,1,0,1,0,1,0],
    [0,1,1,1,1,1,1,1,0,1,0],
    [0,1,0,0,0,1,0,0,0,1,0],
    [0,1,0,1,1,1,0,1,1,1,0],
    [0,1,0,1,0,0,0,1,0,0,0],
    [0,1,1,1,0,1,1,1,1,1,0],
    [0,0,0,1,0,1,0,0,0,1,0],
    [0,1,1,1,1,1,0,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0],
  ],
];

const DIFFICULTY_NAMES = ["Easy", "Medium", "Hard"];

export const MazeGame: FC = () => {
  const { publicKey } = useWallet();
  const [currentMaze, setCurrentMaze] = useState(0);
  const [maze, setMaze] = useState(MAZE_TEMPLATES[0]);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 1, y: 1 });
  const [waldogePos, setWaldogePos] = useState<Position>({ x: 9, y: 9 });
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [bestScores, setBestScores] = useState<number[]>([0, 0, 0]);
  const [gameStarted, setGameStarted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardDifficulty, setLeaderboardDifficulty] = useState(0);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [pendingScore, setPendingScore] = useState<{ difficulty: number; moves: number } | null>(null);

  // Find valid positions for Waldoge (far from start)
  const findWaldogePosition = useCallback((mazeGrid: number[][]) => {
    const validPositions: Position[] = [];
    for (let y = 0; y < mazeGrid.length; y++) {
      for (let x = 0; x < mazeGrid[y].length; x++) {
        if (mazeGrid[y][x] === 1 && (x > 5 || y > 5)) {
          validPositions.push({ x, y });
        }
      }
    }
    return validPositions[Math.floor(Math.random() * validPositions.length)] || { x: 9, y: 9 };
  }, []);

  const fetchLeaderboard = useCallback(async (difficulty: number) => {
    setIsLoadingLeaderboard(true);
    try {
      // Use security definer function to read leaderboard without exposing wallet_address
      const { data, error } = await supabase.rpc("get_leaderboard", {
        p_difficulty: difficulty,
        p_limit: 10,
      });

      if (error) throw error;
      setLeaderboard((data as LeaderboardEntry[]) || []);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      toast.error("Failed to load leaderboard");
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, []);

  const submitScore = useCallback(async (name: string, difficulty: number, moveCount: number) => {
    if (!publicKey) {
      toast.error("Connect wallet to submit score");
      return;
    }

    const trimmedName = name.trim().slice(0, 20);
    if (!trimmedName) {
      toast.error("Please enter a name");
      return;
    }

    try {
      const { error } = await supabase
        .from("maze_leaderboard")
        .insert({
          player_name: trimmedName,
          wallet_address: publicKey.toBase58(),
          difficulty,
          moves: moveCount,
        });

      if (error) throw error;
      
      toast.success("Score submitted to leaderboard! 🏆");
      setShowNameInput(false);
      setPendingScore(null);
      
      // Refresh leaderboard
      fetchLeaderboard(difficulty);
    } catch (error) {
      console.error("Error submitting score:", error);
      toast.error("Failed to submit score");
    }
  }, [publicKey, fetchLeaderboard]);

  const initGame = useCallback((mazeIndex: number) => {
    const selectedMaze = MAZE_TEMPLATES[mazeIndex];
    setMaze(selectedMaze);
    setPlayerPos({ x: 1, y: 1 });
    setWaldogePos(findWaldogePosition(selectedMaze));
    setMoves(0);
    setWon(false);
    setCurrentMaze(mazeIndex);
    setGameStarted(true);
    setShowLeaderboard(false);
  }, [findWaldogePosition]);

  // Load best scores from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("waldoge-maze-scores");
    if (saved) {
      try {
        setBestScores(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
    
    // Load saved player name
    const savedName = localStorage.getItem("waldoge-player-name");
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  // Check win condition
  useEffect(() => {
    if (playerPos.x === waldogePos.x && playerPos.y === waldogePos.y && !won) {
      setWon(true);
      // Update best score
      const newScores = [...bestScores];
      if (newScores[currentMaze] === 0 || moves < newScores[currentMaze]) {
        newScores[currentMaze] = moves;
        setBestScores(newScores);
        localStorage.setItem("waldoge-maze-scores", JSON.stringify(newScores));
      }
      
      // Prompt to submit score
      setPendingScore({ difficulty: currentMaze, moves });
      setShowNameInput(true);
    }
  }, [playerPos, waldogePos, moves, currentMaze, bestScores, won]);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (won) return;
    
    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;
    
    // Check bounds and walls
    if (
      newY >= 0 && newY < maze.length &&
      newX >= 0 && newX < maze[0].length &&
      maze[newY][newX] === 1
    ) {
      setPlayerPos({ x: newX, y: newY });
      setMoves(m => m + 1);
    }
  }, [playerPos, maze, won]);

  // Keyboard controls
  useEffect(() => {
    if (!gameStarted || showLeaderboard) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          movePlayer(0, -1);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          movePlayer(0, 1);
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          movePlayer(-1, 0);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          movePlayer(1, 0);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movePlayer, gameStarted, showLeaderboard]);

  // Leaderboard view
  if (showLeaderboard) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Leaderboard
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setShowLeaderboard(false)}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>

        {/* Difficulty tabs */}
        <div className="flex gap-2">
          {DIFFICULTY_NAMES.map((name, i) => (
            <Button
              key={name}
              variant={leaderboardDifficulty === i ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setLeaderboardDifficulty(i);
                fetchLeaderboard(i);
              }}
            >
              {name}
            </Button>
          ))}
        </div>

        {/* Leaderboard list */}
        <div className="glass-card p-4">
          {isLoadingLeaderboard ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No scores yet. Be the first to complete this level!
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    i === 0 ? "bg-primary/20 border border-primary/30" :
                    i === 1 ? "bg-muted/50" :
                    i === 2 ? "bg-accent/10" : "bg-card/50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    i === 0 ? "bg-primary text-primary-foreground" :
                    i === 1 ? "bg-muted-foreground/30 text-foreground" :
                    i === 2 ? "bg-accent/30 text-accent-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {i === 0 ? <Medal className="w-4 h-4" /> : i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{entry.player_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-primary">{entry.moves}</p>
                    <p className="text-xs text-muted-foreground">moves</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="inline-block mb-4"
          >
            <img 
              src={waldogeMascot} 
              alt="WALDOGE" 
              className="w-20 h-20 object-contain drop-shadow-[0_0_20px_hsl(45,95%,55%,0.4)]"
            />
          </motion.div>
          <h2 className="font-display text-2xl font-bold text-gradient-gold mb-2">
            Find WALDOGE!
          </h2>
          <p className="text-muted-foreground text-sm">
            Navigate the maze and find the cosmic explorer
          </p>
        </div>

        <div className="grid gap-3">
          {DIFFICULTY_NAMES.map((difficulty, i) => (
            <Button
              key={difficulty}
              onClick={() => initGame(i)}
              variant="outline"
              className="w-full py-6 text-lg"
            >
              <Gamepad2 className="w-5 h-5 mr-2" />
              {difficulty}
              {bestScores[i] > 0 && (
                <span className="ml-auto text-sm text-primary">
                  Best: {bestScores[i]} moves
                </span>
              )}
            </Button>
          ))}
        </div>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            setShowLeaderboard(true);
            fetchLeaderboard(0);
          }}
        >
          <Users className="w-4 h-4 mr-2" />
          View Leaderboard
        </Button>

        <div className="text-center text-xs text-muted-foreground">
          Use arrow keys or WASD to move
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold">
            Level {currentMaze + 1}: {DIFFICULTY_NAMES[currentMaze]}
          </h3>
          <p className="text-sm text-muted-foreground">
            Moves: {moves} {bestScores[currentMaze] > 0 && `• Best: ${bestScores[currentMaze]}`}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setGameStarted(false)}>
          <RotateCcw className="w-4 h-4 mr-1" />
          Menu
        </Button>
      </div>

      {/* Maze Grid */}
      <div className="flex justify-center">
        <div 
          className="grid gap-0.5 p-2 glass-card"
          style={{ 
            gridTemplateColumns: `repeat(${maze[0].length}, 1fr)`,
          }}
        >
          {maze.map((row, y) =>
            row.map((cell, x) => {
              const isPlayer = playerPos.x === x && playerPos.y === y;
              const isWaldoge = waldogePos.x === x && waldogePos.y === y;
              const isWall = cell === 0;

              return (
                <div
                  key={`${x}-${y}`}
                  className={cn(
                    "w-6 h-6 sm:w-8 sm:h-8 rounded-sm flex items-center justify-center transition-colors",
                    isWall ? "bg-muted" : "bg-card border border-border/50"
                  )}
                >
                  <AnimatePresence>
                    {isPlayer && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-primary flex items-center justify-center text-xs"
                      >
                        🎮
                      </motion.div>
                    )}
                    {isWaldoge && !isPlayer && (
                      <motion.img
                        src={waldogeMascot}
                        alt="WALDOGE"
                        className="w-5 h-5 sm:w-7 sm:h-7 object-contain"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Touch Controls */}
      <div className="flex justify-center">
        <div className="grid grid-cols-3 gap-1 w-fit">
          <div />
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => movePlayer(0, -1)}
            disabled={won}
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <div />
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => movePlayer(-1, 0)}
            disabled={won}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => movePlayer(0, 1)}
            disabled={won}
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => movePlayer(1, 0)}
            disabled={won}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Arrow keys / WASD to move
      </p>

      {/* Win Modal */}
      <AnimatePresence>
        {won && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <div className="glass-card p-8 text-center max-w-sm mx-4">
              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <img 
                  src={waldogeMascot} 
                  alt="WALDOGE" 
                  className="w-24 h-24 mx-auto mb-4 drop-shadow-[0_0_30px_hsl(45,95%,55%,0.5)]"
                />
              </motion.div>
              
              <h2 className="font-display text-2xl font-bold text-gradient-gold mb-2">
                You Found WALDOGE! 🎉
              </h2>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="text-lg">{moves} moves</span>
                {moves === bestScores[currentMaze] && (
                  <span className="text-xs text-primary bg-primary/20 px-2 py-0.5 rounded-full">
                    New Best!
                  </span>
                )}
              </div>

              {/* Name input for leaderboard */}
              {showNameInput && publicKey && (
                <div className="mb-4 space-y-2">
                  <p className="text-sm text-muted-foreground">Submit your score to the leaderboard!</p>
                  <Input
                    placeholder="Enter your name (max 20 chars)"
                    value={playerName}
                    onChange={(e) => {
                      const name = e.target.value.slice(0, 20);
                      setPlayerName(name);
                      localStorage.setItem("waldoge-player-name", name);
                    }}
                    maxLength={20}
                  />
                  <Button 
                    className="w-full"
                    onClick={() => pendingScore && submitScore(playerName, pendingScore.difficulty, pendingScore.moves)}
                    disabled={!playerName.trim()}
                  >
                    <Trophy className="w-4 h-4 mr-1" />
                    Submit to Leaderboard
                  </Button>
                </div>
              )}

              {!publicKey && showNameInput && (
                <p className="text-sm text-muted-foreground mb-4">
                  Connect wallet to submit score
                </p>
              )}

              <div className="flex gap-2 justify-center">
                <Button onClick={() => initGame(currentMaze)} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Play Again
                </Button>
                <Button variant="ghost" onClick={() => {
                  setGameStarted(false);
                  setShowNameInput(false);
                }}>
                  Menu
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};