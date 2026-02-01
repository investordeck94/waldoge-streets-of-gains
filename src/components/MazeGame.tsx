import { FC, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Trophy, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import waldogeMascot from "@/assets/waldoge-mascot.png";

interface Position {
  x: number;
  y: number;
}

interface MazeGameProps {
  onClose?: () => void;
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

export const MazeGame: FC<MazeGameProps> = ({ onClose }) => {
  const [currentMaze, setCurrentMaze] = useState(0);
  const [maze, setMaze] = useState(MAZE_TEMPLATES[0]);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 1, y: 1 });
  const [waldogePos, setWaldogePos] = useState<Position>({ x: 9, y: 9 });
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [bestScores, setBestScores] = useState<number[]>([0, 0, 0]);
  const [gameStarted, setGameStarted] = useState(false);

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

  const initGame = useCallback((mazeIndex: number) => {
    const selectedMaze = MAZE_TEMPLATES[mazeIndex];
    setMaze(selectedMaze);
    setPlayerPos({ x: 1, y: 1 });
    setWaldogePos(findWaldogePosition(selectedMaze));
    setMoves(0);
    setWon(false);
    setCurrentMaze(mazeIndex);
    setGameStarted(true);
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
  }, []);

  // Check win condition
  useEffect(() => {
    if (playerPos.x === waldogePos.x && playerPos.y === waldogePos.y) {
      setWon(true);
      // Update best score
      const newScores = [...bestScores];
      if (newScores[currentMaze] === 0 || moves < newScores[currentMaze]) {
        newScores[currentMaze] = moves;
        setBestScores(newScores);
        localStorage.setItem("waldoge-maze-scores", JSON.stringify(newScores));
      }
    }
  }, [playerPos, waldogePos, moves, currentMaze, bestScores]);

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
    if (!gameStarted) return;
    
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
  }, [movePlayer, gameStarted]);

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
          {["Easy", "Medium", "Hard"].map((difficulty, i) => (
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
            Level {currentMaze + 1}: {["Easy", "Medium", "Hard"][currentMaze]}
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

              <div className="flex gap-2 justify-center">
                <Button onClick={() => initGame(currentMaze)}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Play Again
                </Button>
                <Button variant="outline" onClick={() => setGameStarted(false)}>
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