import { useRef, useState } from "react";

/**
 * Touch analogue joystick — pure input adapter. Emits the same direction
 * intents the old LEFT/RIGHT buttons produced; never touches physics.
 */
export interface JoystickDir { x: -1 | 0 | 1; y: -1 | 0 | 1 }

interface Props {
  onChange: (dir: JoystickDir) => void;
  /** Horizontal dead zone as a fraction of radius. */
  deadZone?: number;
  /** Vertical threshold (higher so diagonals don't trigger ladder/jump). */
  verticalThreshold?: number;
  size?: number;
}

export function VirtualJoystick({ onChange, deadZone = 0.25, verticalThreshold = 0.65, size = 112 }: Props) {
  const baseRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const last = useRef<JoystickDir>({ x: 0, y: 0 });
  const [thumb, setThumb] = useState({ x: 0, y: 0 });
  const radius = size / 2;
  const maxTravel = radius * 0.6;

  const emit = (d: JoystickDir) => {
    if (d.x !== last.current.x || d.y !== last.current.y) { last.current = d; onChange(d); }
  };

  const update = (clientX: number, clientY: number) => {
    const r = baseRef.current!.getBoundingClientRect();
    let dx = clientX - (r.left + r.width / 2);
    let dy = clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > maxTravel) { dx = (dx / len) * maxTravel; dy = (dy / len) * maxTravel; }
    setThumb({ x: dx, y: dy });
    const nx = dx / maxTravel, ny = dy / maxTravel;
    emit({
      x: nx < -deadZone ? -1 : nx > deadZone ? 1 : 0,
      y: ny < -verticalThreshold ? -1 : ny > verticalThreshold ? 1 : 0,
    });
  };

  const release = (e: React.PointerEvent) => {
    if (pointerId.current !== e.pointerId) return;
    pointerId.current = null;
    setThumb({ x: 0, y: 0 });
    emit({ x: 0, y: 0 });
  };

  return (
    <div
      ref={baseRef}
      role="application"
      aria-label="Movement joystick"
      onPointerDown={(e) => {
        if (pointerId.current !== null) return;
        pointerId.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => { if (pointerId.current === e.pointerId) update(e.clientX, e.clientY); }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(e) => e.preventDefault()}
      className="relative rounded-full glass-card border-2 border-primary/40 touch-none select-none shrink-0"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-[18%] rounded-full border border-primary/20 pointer-events-none" />
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-primary/50 text-xs pointer-events-none">◀</span>
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-primary/50 text-xs pointer-events-none">▶</span>
      <div
        className="absolute left-1/2 top-1/2 rounded-full bg-primary/80 border-2 border-primary shadow-lg pointer-events-none"
        style={{
          width: size * 0.42, height: size * 0.42,
          transform: `translate(calc(-50% + ${thumb.x}px), calc(-50% + ${thumb.y}px))`,
          transition: pointerId.current === null ? "transform 120ms ease-out" : "none",
        }}
      />
    </div>
  );
}
