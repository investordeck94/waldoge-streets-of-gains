import { FC, useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Trophy, Gamepad2, Medal, Users, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import waldogeMaze from "@/assets/waldoge-maze.png";
import susdogImage from "@/assets/susdog.png";

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
  // Easy maze (13x13) - more complex with dead ends
  [
    [0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,0,1,1,1,0,1,1,1,0],
    [0,0,0,1,0,1,0,1,0,0,0,1,0],
    [0,1,1,1,1,1,0,1,1,1,0,1,0],
    [0,1,0,0,0,0,0,0,0,1,0,1,0],
    [0,1,0,1,1,1,1,1,0,1,1,1,0],
    [0,1,0,1,0,0,0,1,0,0,0,0,0],
    [0,1,1,1,0,1,0,1,1,1,1,1,0],
    [0,0,0,0,0,1,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,1,0,1,0],
    [0,1,0,0,0,0,0,0,0,1,0,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  // Medium maze (15x15) - twisty with multiple paths
  [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,0,1,1,1,0,1,1,1,0,1,1,1,0],
    [0,1,0,1,0,1,0,1,0,1,0,1,0,0,0],
    [0,1,1,1,0,1,1,1,0,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,0,1,0],
    [0,1,0,0,0,0,0,0,0,0,0,1,0,1,0],
    [0,1,0,1,1,1,1,1,1,1,0,1,1,1,0],
    [0,1,0,1,0,0,0,0,0,1,0,0,0,0,0],
    [0,1,0,1,0,1,1,1,0,1,1,1,1,1,0],
    [0,1,0,1,0,1,0,1,0,0,0,0,0,1,0],
    [0,1,1,1,0,1,0,1,1,1,1,1,0,1,0],
    [0,0,0,0,0,1,0,0,0,0,0,1,0,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  // Hard maze (17x17) - very challenging labyrinth
  [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,0,1,0,1,1,1,0,1,1,1,1,1,0],
    [0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0],
    [0,1,1,1,0,1,1,1,0,1,0,1,0,1,1,1,0],
    [0,1,0,0,0,0,0,1,0,1,0,1,0,1,0,0,0],
    [0,1,1,1,1,1,0,1,0,1,1,1,0,1,1,1,0],
    [0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,1,0],
    [0,1,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0],
    [0,1,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0],
    [0,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,0],
    [0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,0,1,0,1,1,1,1,1,0,1,0],
    [0,1,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
];

const DIFFICULTY_NAMES = ["Easy", "Medium", "Hard"];
const SUSDOG_SPEEDS = [2500, 1800, 1200]; // ms between moves for each difficulty

export const MazeGame: FC = () => {
  const { publicKey } = useWallet();
  const [currentMaze, setCurrentMaze] = useState(0);
  const [maze, setMaze] = useState(MAZE_TEMPLATES[0]);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 1, y: 1 });
  const [goalPos, setGoalPos] = useState<Position>({ x: 11, y: 11 });
  const [susdogPos, setSusdogPos] = useState<Position>({ x: 7, y: 7 });
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [caught, setCaught] = useState(false);
  const [bestScores, setBestScores] = useState<number[]>([0, 0, 0]);
  const [gameStarted, setGameStarted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardDifficulty, setLeaderboardDifficulty] = useState(0);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [pendingScore, setPendingScore] = useState<{ difficulty: number; moves: number } | null>(null);
  const susdogIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // BFS pathfinding to find shortest path from susdog to player
  const findPath = useCallback((from: Position, to: Position, mazeGrid: number[][]): Position[] => {
    const queue: { pos: Position; path: Position[] }[] = [{ pos: from, path: [] }];
    const visited = new Set<string>();
    visited.add(`${from.x},${from.y}`);

    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.pos.x === to.x && current.pos.y === to.y) {
        return current.path;
      }

      for (const dir of directions) {
        const newX = current.pos.x + dir.dx;
        const newY = current.pos.y + dir.dy;
        const key = `${newX},${newY}`;

        if (
          newY >= 0 && newY < mazeGrid.length &&
          newX >= 0 && newX < mazeGrid[0].length &&
          mazeGrid[newY][newX] === 1 &&
          !visited.has(key)
        ) {
          visited.add(key);
          queue.push({
            pos: { x: newX, y: newY },
            path: [...current.path, { x: newX, y: newY }],
          });
        }
      }
    }

    return [];
  }, []);

  // Find goal position (far corner from start)
  const findGoalPosition = useCallback((mazeGrid: number[][]) => {
    const validPositions: Position[] = [];
    const minDistance = Math.floor(mazeGrid.length * 0.6);
    for (let y = 0; y < mazeGrid.length; y++) {
      for (let x = 0; x < mazeGrid[y].length; x++) {
        if (mazeGrid[y][x] === 1 && (x >= minDistance || y >= minDistance)) {
          validPositions.push({ x, y });
        }
      }
    }
    const cornerPositions = validPositions.filter(p => 
      p.x >= mazeGrid[0].length - 3 && p.y >= mazeGrid.length - 3
    );
    const positionsToUse = cornerPositions.length > 0 ? cornerPositions : validPositions;
    return positionsToUse[Math.floor(Math.random() * positionsToUse.length)] || { x: mazeGrid[0].length - 2, y: mazeGrid.length - 2 };
  }, []);

  // Find susdog starting position (middle area, not too close to player or goal)
  const findSusdogStart = useCallback((mazeGrid: number[][], playerStart: Position, goal: Position) => {
    const validPositions: Position[] = [];
    const midX = Math.floor(mazeGrid[0].length / 2);
    const midY = Math.floor(mazeGrid.length / 2);
    
    for (let y = 0; y < mazeGrid.length; y++) {
      for (let x = 0; x < mazeGrid[y].length; x++) {
        if (mazeGrid[y][x] === 1) {
          const distToPlayer = Math.abs(x - playerStart.x) + Math.abs(y - playerStart.y);
          const distToGoal = Math.abs(x - goal.x) + Math.abs(y - goal.y);
          // Start in middle area, at least 3 steps from player
          if (distToPlayer >= 3 && distToGoal >= 2) {
            const distToMid = Math.abs(x - midX) + Math.abs(y - midY);
            if (distToMid <= 5) {
              validPositions.push({ x, y });
            }
          }
        }
      }
    }
    
    if (validPositions.length === 0) {
      // Fallback: find any valid position at least 3 steps from player
      for (let y = 0; y < mazeGrid.length; y++) {
        for (let x = 0; x < mazeGrid[y].length; x++) {
          if (mazeGrid[y][x] === 1) {
            const distToPlayer = Math.abs(x - playerStart.x) + Math.abs(y - playerStart.y);
            if (distToPlayer >= 3) {
              validPositions.push({ x, y });
            }
          }
        }
      }
    }
    
    return validPositions[Math.floor(Math.random() * validPositions.length)] || { x: midX, y: midY };
  }, []);

  const fetchLeaderboard = useCallback(async (difficulty: number) => {
    setIsLoadingLeaderboard(true);
    try {
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
      
      fetchLeaderboard(difficulty);
    } catch (error) {
      console.error("Error submitting score:", error);
      toast.error("Failed to submit score");
    }
  }, [publicKey, fetchLeaderboard]);

  const stopSusdog = useCallback(() => {
    if (susdogIntervalRef.current) {
      clearInterval(susdogIntervalRef.current);
      susdogIntervalRef.current = null;
    }
  }, []);

  const initGame = useCallback((mazeIndex: number) => {
    stopSusdog();
    const selectedMaze = MAZE_TEMPLATES[mazeIndex];
    const playerStart = { x: 1, y: 1 };
    const goal = findGoalPosition(selectedMaze);
    const susdogStart = findSusdogStart(selectedMaze, playerStart, goal);
    
    setMaze(selectedMaze);
    setPlayerPos(playerStart);
    setGoalPos(goal);
    setSusdogPos(susdogStart);
    setMoves(0);
    setWon(false);
    setCaught(false);
    setCurrentMaze(mazeIndex);
    setGameStarted(true);
    setShowLeaderboard(false);
  }, [findGoalPosition, findSusdogStart, stopSusdog]);

  // Susdog AI movement
  useEffect(() => {
    if (!gameStarted || won || caught) {
      stopSusdog();
      return;
    }

    const moveSusdog = () => {
      setSusdogPos(currentSusdogPos => {
        // Get current player position
        const path = findPath(currentSusdogPos, playerPos, maze);
        if (path.length > 0) {
          return path[0]; // Move to next position on path
        }
        return currentSusdogPos;
      });
    };

    susdogIntervalRef.current = setInterval(moveSusdog, SUSDOG_SPEEDS[currentMaze]);
    
    return () => stopSusdog();
  }, [gameStarted, won, caught, currentMaze, playerPos, maze, findPath, stopSusdog]);

  // Check collision with susdog
  useEffect(() => {
    if (playerPos.x === susdogPos.x && playerPos.y === susdogPos.y && !won && !caught) {
      setCaught(true);
      stopSusdog();
    }
  }, [playerPos, susdogPos, won, caught, stopSusdog]);

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
    
    const savedName = localStorage.getItem("waldoge-player-name");
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  // Check win condition
  useEffect(() => {
    if (playerPos.x === goalPos.x && playerPos.y === goalPos.y && !won && !caught) {
      setWon(true);
      stopSusdog();
      const newScores = [...bestScores];
      if (newScores[currentMaze] === 0 || moves < newScores[currentMaze]) {
        newScores[currentMaze] = moves;
        setBestScores(newScores);
        localStorage.setItem("waldoge-maze-scores", JSON.stringify(newScores));
      }
      
      setPendingScore({ difficulty: currentMaze, moves });
      setShowNameInput(true);
    }
  }, [playerPos, goalPos, moves, currentMaze, bestScores, won, caught, stopSusdog]);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (won || caught) return;
    
    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;
    
    if (
      newY >= 0 && newY < maze.length &&
      newX >= 0 && newX < maze[0].length &&
      maze[newY][newX] === 1
    ) {
      setPlayerPos({ x: newX, y: newY });
      setMoves(m => m + 1);
    }
  }, [playerPos, maze, won, caught]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => stopSusdog();
  }, [stopSusdog]);

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

        <div className="glass-card p-4">
          {isLoadingLeaderboard ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No scores yet. Be the first to escape Susdog!
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
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <img 
                src={waldogeMaze} 
                alt="WALDOGE" 
                className="w-16 h-16 object-contain drop-shadow-[0_0_20px_hsl(45,95%,55%,0.4)]"
                style={{ transform: "scaleX(0.85)" }}
              />
            </motion.div>
            <span className="text-2xl">VS</span>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <img 
                src={susdogImage} 
                alt="Susdog" 
                className="w-16 h-16 object-contain rounded-lg drop-shadow-[0_0_20px_hsl(0,70%,50%,0.4)]"
              />
            </motion.div>
          </div>
          <h2 className="font-display text-2xl font-bold text-gradient-gold mb-2">
            Escape Susdog!
          </h2>
          <p className="text-muted-foreground text-sm">
            You are WALDOGE 🐕 — Reach the goal 🏆 before Susdog catches you!
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
          Use arrow keys or WASD to move • Susdog is hunting you!
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
        <Button variant="ghost" size="sm" onClick={() => { stopSusdog(); setGameStarted(false); }}>
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
              const isGoal = goalPos.x === x && goalPos.y === y;
              const isSusdog = susdogPos.x === x && susdogPos.y === y;
              const isWall = cell === 0;

              return (
                <div
                  key={`${x}-${y}`}
                  className={cn(
                    "w-6 h-6 sm:w-8 sm:h-8 rounded-sm flex items-center justify-center transition-colors relative",
                    isWall ? "bg-muted" : "bg-card border border-border/50",
                    isGoal && !isPlayer && "bg-primary/20 border-primary/50"
                  )}
                >
                  <AnimatePresence>
                    {isPlayer && (
                      <motion.img
                        key="player"
                        src={waldogeMaze}
                        alt="WALDOGE (You)"
                        className="w-5 h-6 sm:w-6 sm:h-7 object-contain z-10"
                        style={{ transform: "scaleX(0.85)" }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    )}
                    {isGoal && !isPlayer && (
                      <motion.div
                        key="goal"
                        className="text-lg"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      >
                        🏆
                      </motion.div>
                    )}
                    {isSusdog && !isPlayer && (
                      <motion.img
                        key="susdog"
                        src={susdogImage}
                        alt="Susdog"
                        className="w-5 h-5 sm:w-6 sm:h-6 object-cover rounded-sm"
                        animate={{ 
                          scale: [1, 1.05, 1],
                        }}
                        transition={{ repeat: Infinity, duration: 0.5 }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <img src={waldogeMaze} alt="" className="w-4 h-4 object-contain" style={{ transform: "scaleX(0.85)" }} />
          <span>You</span>
        </div>
        <div className="flex items-center gap-1">
          <span>🏆</span>
          <span>Goal</span>
        </div>
        <div className="flex items-center gap-1">
          <img src={susdogImage} alt="" className="w-4 h-4 object-cover rounded-sm" />
          <span>Susdog</span>
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
            disabled={won || caught}
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <div />
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => movePlayer(-1, 0)}
            disabled={won || caught}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => movePlayer(0, 1)}
            disabled={won || caught}
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => movePlayer(1, 0)}
            disabled={won || caught}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Arrow keys / WASD to move • Escape Susdog!
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
                  src={waldogeMaze} 
                  alt="WALDOGE" 
                  className="w-20 h-24 mx-auto mb-4 object-contain drop-shadow-[0_0_30px_hsl(45,95%,55%,0.5)]"
                  style={{ transform: "scaleX(0.85)" }}
                />
              </motion.div>
              
              <h2 className="font-display text-2xl font-bold text-gradient-gold mb-2">
                You Escaped! 🎉
              </h2>
              
              <p className="text-sm text-muted-foreground mb-4">
                Susdog couldn't catch you!
              </p>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="text-lg">{moves} moves</span>
                {moves === bestScores[currentMaze] && (
                  <span className="text-xs text-primary bg-primary/20 px-2 py-0.5 rounded-full">
                    New Best!
                  </span>
                )}
              </div>

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

      {/* Caught Modal */}
      <AnimatePresence>
        {caught && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <div className="glass-card p-8 text-center max-w-sm mx-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                <img 
                  src={susdogImage} 
                  alt="Susdog" 
                  className="w-20 h-20 mx-auto mb-4 object-cover rounded-lg drop-shadow-[0_0_30px_hsl(0,70%,50%,0.5)]"
                />
              </motion.div>
              
              <h2 className="font-display text-2xl font-bold text-destructive mb-2 flex items-center justify-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                CAUGHT!
              </h2>
              
              <p className="text-muted-foreground mb-6">
                Susdog got you after {moves} moves! 😱
              </p>

              <div className="flex gap-2 justify-center">
                <Button onClick={() => initGame(currentMaze)} variant="default">
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Try Again
                </Button>
                <Button variant="ghost" onClick={() => {
                  setGameStarted(false);
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
