import { FC, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trophy, RotateCcw, ChevronRight, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import level1 from "@/assets/level-1-dogpark.jpg";
import level2 from "@/assets/level-2-beach.jpg";
import level3 from "@/assets/level-3-amusement.jpg";
import level4 from "@/assets/level-4-haunted.jpg";
import level5 from "@/assets/level-5-jungle.jpg";
import level6 from "@/assets/level-6-wallstreet.jpg";
import waldogeSprite from "@/assets/waldoge-find.png";

interface SpawnPoint {
  position: { x: number; y: number };
  hint: string;
  rotation: number;
}

interface LevelConfig {
  id: number;
  name: string;
  scene: string;
  hitRadius: number;
  spriteSize: number;
  sceneMotion: string;
  spawns: SpawnPoint[];
}

interface Level {
  id: number;
  name: string;
  scene: string;
  waldogePosition: { x: number; y: number };
  hitRadius: number;
  hint: string;
  spriteSize: number;
  rotation?: number;
  sceneMotion: string;
}

const LEVEL_CONFIGS: LevelConfig[] = [
  {
    id: 1, name: "🐕 Dog Park", scene: level1, hitRadius: 3.5, spriteSize: 6, sceneMotion: "sceneDrift1",
    spawns: [
      { position: { x: 82, y: 18 }, hint: "Near the playground!", rotation: -3 },
      { position: { x: 15, y: 72 }, hint: "By the pond!", rotation: 2 },
      { position: { x: 50, y: 25 }, hint: "Among the dogs in the middle!", rotation: -1 },
      { position: { x: 88, y: 75 }, hint: "Bottom right corner!", rotation: 4 },
    ],
  },
  {
    id: 2, name: "🏖️ Beach", scene: level2, hitRadius: 3, spriteSize: 5.5, sceneMotion: "sceneDrift2",
    spawns: [
      { position: { x: 88, y: 55 }, hint: "Way down the beach...", rotation: 2 },
      { position: { x: 20, y: 75 }, hint: "Near the towels!", rotation: -2 },
      { position: { x: 55, y: 30 }, hint: "Close to the water!", rotation: 3 },
      { position: { x: 75, y: 82 }, hint: "By the sandcastle!", rotation: -1 },
    ],
  },
  {
    id: 3, name: "🎢 Amusement Park", scene: level3, hitRadius: 3, spriteSize: 5, sceneMotion: "sceneDrift3",
    spawns: [
      { position: { x: 12, y: 82 }, hint: "Near the cotton candy!", rotation: -2 },
      { position: { x: 80, y: 65 }, hint: "By the carousel!", rotation: 3 },
      { position: { x: 45, y: 45 }, hint: "In the middle of the crowd!", rotation: -1 },
      { position: { x: 90, y: 85 }, hint: "Far right near the games!", rotation: 2 },
    ],
  },
  {
    id: 4, name: "👻 Haunted House", scene: level4, hitRadius: 2.5, spriteSize: 5, sceneMotion: "sceneDrift4",
    spawns: [
      { position: { x: 88, y: 30 }, hint: "Look up high...", rotation: 4 },
      { position: { x: 15, y: 55 }, hint: "Near the armor!", rotation: -3 },
      { position: { x: 55, y: 80 }, hint: "On the ground floor!", rotation: 2 },
      { position: { x: 75, y: 60 }, hint: "By the doorway!", rotation: -1 },
    ],
  },
  {
    id: 5, name: "🌴 Jungle", scene: level5, hitRadius: 2.5, spriteSize: 4.5, sceneMotion: "sceneDrift5",
    spawns: [
      { position: { x: 15, y: 82 }, hint: "Among the flowers!", rotation: -5 },
      { position: { x: 78, y: 40 }, hint: "Near the waterfall!", rotation: 3 },
      { position: { x: 35, y: 25 }, hint: "Up in the canopy!", rotation: -2 },
      { position: { x: 85, y: 80 }, hint: "By the tiki masks!", rotation: 4 },
    ],
  },
  {
    id: 6, name: "📈 Wall Street", scene: level6, hitRadius: 2, spriteSize: 4, sceneMotion: "sceneDrift6",
    spawns: [
      { position: { x: 92, y: 78 }, hint: "Edge of the crowd!", rotation: 3 },
      { position: { x: 15, y: 65 }, hint: "Near a hot dog stand!", rotation: -2 },
      { position: { x: 50, y: 85 }, hint: "Lost among the suits!", rotation: 1 },
      { position: { x: 82, y: 35 }, hint: "Near the taxis!", rotation: -3 },
    ],
  },
];

function generateLevels(): Level[] {
  return LEVEL_CONFIGS.map((config) => {
    const spawn = config.spawns[Math.floor(Math.random() * config.spawns.length)];
    return {
      id: config.id,
      name: config.name,
      scene: config.scene,
      waldogePosition: spawn.position,
      hitRadius: config.hitRadius,
      hint: spawn.hint,
      spriteSize: config.spriteSize,
      rotation: spawn.rotation,
      sceneMotion: config.sceneMotion,
    };
  });
}

export const WheresWaldoge: FC = () => {
  const [gameState, setGameState] = useState<"menu" | "playing" | "found" | "complete">("menu");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [timer, setTimer] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [levels, setLevels] = useState<Level[]>(generateLevels);

  // Pan/drag state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(2);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  const level = levels[currentLevel];

  // Timer
  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = window.setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Reset pan when level changes
  useEffect(() => {
    if (gameState === "playing") {
      setPan({ x: 0, y: 0 });
      setZoom(2);
      setHintUsed(false);
      setShowHint(false);
      setAttempts(0);
    }
  }, [currentLevel, gameState]);

  const clampPan = useCallback(
    (x: number, y: number) => {
      if (!containerRef.current) return { x, y };
      const rect = containerRef.current.getBoundingClientRect();
      const maxX = (rect.width * (zoom - 1)) / 2;
      const maxY = (rect.height * (zoom - 1)) / 2;
      return {
        x: Math.max(-maxX, Math.min(maxX, x)),
        y: Math.max(-maxY, Math.min(maxY, y)),
      };
    },
    [zoom]
  );

  // Touch/mouse handlers for panning
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart({ ...pan });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const newPan = clampPan(panStart.x + dx, panStart.y + dy);
    setPan(newPan);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const dx = Math.abs(e.clientX - dragStart.x);
    const dy = Math.abs(e.clientY - dragStart.y);

    // If it was a tap (not a drag), check for Waldoge
    if (dx < 10 && dy < 10 && gameState === "playing") {
      handleTap(e);
    }
    setIsDragging(false);
  };

  const handleTap = (e: React.PointerEvent) => {
    if (!containerRef.current || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const tapX = ((e.clientX - rect.left) / rect.width) * 100;
    const tapY = ((e.clientY - rect.top) / rect.height) * 100;

    const dx = tapX - level.waldogePosition.x;
    const dy = tapY - level.waldogePosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= level.hitRadius) {
      // Found Waldoge!
      if (timerRef.current) clearInterval(timerRef.current);
      setTotalTime((t) => t + timer);
      setCompletedLevels((prev) => [...prev, currentLevel]);
      
      if (currentLevel === LEVELS.length - 1) {
        setGameState("complete");
        toast.success("🎉 You found Waldoge in all levels!");
      } else {
        setGameState("found");
        toast.success(`🐕 You found Waldoge in ${formatTime(timer)}!`);
      }
    } else {
      setAttempts((a) => a + 1);
      // Visual feedback for wrong tap
      if (distance < level.hitRadius * 3) {
        toast("🔥 Getting warmer!", { duration: 1500 });
      } else {
        toast("❄️ Cold... keep looking!", { duration: 1500 });
      }
    }
  };

  const startGame = () => {
    setGameState("playing");
    setCurrentLevel(0);
    setCompletedLevels([]);
    setTimer(0);
    setTotalTime(0);
  };

  const nextLevel = () => {
    setCurrentLevel((l) => l + 1);
    setTimer(0);
    setGameState("playing");
  };

  const handleZoom = (direction: "in" | "out") => {
    setZoom((z) => {
      const newZoom = direction === "in" ? Math.min(z + 0.5, 4) : Math.max(z - 0.5, 1);
      // Re-clamp pan for new zoom
      const clamped = clampPan(pan.x, pan.y);
      setPan(clamped);
      return newZoom;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Menu screen
  if (gameState === "menu") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 text-center max-w-lg mx-auto"
      >
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-display font-bold text-primary mb-2">
          Where's Waldoge?
        </h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Find the hidden Waldoge across 6 increasingly challenging scenes!
          Drag to pan around, tap to find him. Use hints if you get stuck.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {LEVELS.map((lvl, i) => (
            <div
              key={lvl.id}
              className="bg-muted/30 rounded-lg p-3 text-left border border-border/50"
            >
              <div className="text-sm font-medium">{lvl.name}</div>
              <div className="text-xs text-muted-foreground">Level {lvl.id}</div>
            </div>
          ))}
        </div>

        <Button
          onClick={startGame}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
          size="lg"
        >
          <Search className="w-5 h-5 mr-2" />
          Start Searching!
        </Button>
      </motion.div>
    );
  }

  // Complete screen
  if (gameState === "complete") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-6 text-center max-w-lg mx-auto"
      >
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-display font-bold text-primary mb-2">
          Congratulations!
        </h2>
        <p className="text-muted-foreground mb-4">
          You found Waldoge in all 6 locations!
        </p>

        <div className="bg-muted/30 rounded-xl p-4 mb-6 border border-primary/30">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Total Time</div>
              <div className="text-xl font-bold text-primary">{formatTime(totalTime + timer)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Levels</div>
              <div className="text-xl font-bold text-primary">6/6</div>
            </div>
          </div>
        </div>

        <Button onClick={startGame} className="w-full" size="lg">
          <RotateCcw className="w-4 h-4 mr-2" />
          Play Again
        </Button>
      </motion.div>
    );
  }

  // Found screen (between levels)
  if (gameState === "found") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-6 text-center max-w-lg mx-auto"
      >
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-xl font-display font-bold text-primary mb-2">
          Found Him!
        </h2>
        <p className="text-muted-foreground mb-1 text-sm">
          You found Waldoge at {level.name} in {formatTime(timer)}!
        </p>
        {hintUsed && (
          <p className="text-xs text-yellow-500 mb-4">(Hint was used)</p>
        )}
        <p className="text-muted-foreground mb-4 text-xs">
          Wrong taps: {attempts}
        </p>

        <div className="flex items-center justify-center gap-2 mb-6">
          {LEVELS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2",
                completedLevels.includes(i)
                  ? "bg-primary text-primary-foreground border-primary"
                  : i === currentLevel + 1
                  ? "border-primary/50 text-primary"
                  : "border-border text-muted-foreground"
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <Button onClick={nextLevel} className="w-full" size="lg">
          Next Level <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    );
  }

  // Playing screen
  return (
    <div className="flex flex-col gap-3 max-w-2xl mx-auto">
      {/* HUD */}
      <div className="glass-card p-3 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span className="font-bold text-primary">{level.name}</span>
          <span className="text-muted-foreground">
            Lv {level.id}/{LEVELS.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(timer)}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setShowHint(true);
              setHintUsed(true);
            }}
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Hint
          </Button>
        </div>
      </div>

      {/* Hint banner */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg px-4 py-2 text-sm text-yellow-300 text-center"
            onClick={() => setShowHint(false)}
          >
            💡 {level.hint} <span className="text-xs">(tap to dismiss)</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game viewport */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl border-2 border-border/50 bg-muted/20 touch-none select-none"
        style={{ height: "60vh", cursor: isDragging ? "grabbing" : "grab" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          ref={imageRef}
          className="absolute inset-0 origin-center transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: "100%",
            height: "100%",
          }}
        >
          {/* Scene background with motion */}
          <img
            src={level.scene}
            alt={level.name}
            className="w-full h-full object-cover"
            style={{
              animation: `${level.sceneMotion} 12s ease-in-out infinite`,
            }}
            draggable={false}
          />

          {/* Hidden Waldoge - fully visible, no transparency */}
          <div
            className="absolute"
            style={{
              left: `${level.waldogePosition.x}%`,
              top: `${level.waldogePosition.y}%`,
              transform: `translate(-50%, -50%) rotate(${level.rotation || 0}deg)`,
              width: `${level.spriteSize}%`,
              height: `${level.spriteSize * 1.5}%`,
              animation: `${level.sceneMotion} 12s ease-in-out infinite`,
            }}
          >
            <img
              src={waldogeSprite}
              alt="Waldoge"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-10">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleZoom("in");
            }}
          >
            +
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleZoom("out");
            }}
          >
            −
          </Button>
        </div>

        {/* Instructions overlay (fades after 3 seconds) */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 3, duration: 1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
        >
          <div className="bg-background/80 backdrop-blur-sm rounded-xl px-6 py-4 text-center">
            <Search className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">Drag to explore</p>
            <p className="text-xs text-muted-foreground">Tap when you find Waldoge!</p>
          </div>
        </motion.div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {LEVELS.map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-3 h-3 rounded-full transition-colors",
              completedLevels.includes(i)
                ? "bg-primary"
                : i === currentLevel
                ? "bg-primary/50 animate-pulse"
                : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
};
