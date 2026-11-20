import { useEffect, useRef, useState } from "react";

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

export function VirtualJoystick({ onChange, deadZone = 0.4, verticalThreshold = 0.65, size = 112 }: Props) {
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
    // Hysteresis: once moving, keep moving until the thumb comes well back
    // toward centre; once stopped, need a clear push to start. Stops jitter
    // around the threshold reading as drift.
    const hx = last.current.x !== 0 ? deadZone * 0.6 : deadZone;
    const hy = last.current.y !== 0 ? verticalThreshold * 0.8 : verticalThreshold;
    emit({
      x: nx < -hx ? -1 : nx > hx ? 1 : 0,
      y: ny < -hy ? -1 : ny > hy ? 1 : 0,
    });
  };

  const reset = () => {
    pointerId.current = null;
    setThumb({ x: 0, y: 0 });
    emit({ x: 0, y: 0 });
  };

  const release = (e: React.PointerEvent) => {
    if (pointerId.current !== e.pointerId) return;
    reset();
  };

  // Safety net: if the finger-up is ever missed (app switch, notification,
  // touch lost off-screen), stop moving instead of drifting.
  useEffect(() => {
    const onUp = (e: PointerEvent) => { if (pointerId.current === e.pointerId) reset(); };
    const onHide = () => { if (pointerId.current !== null || last.current.x || last.current.y) reset(); };
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("blur", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", onHide);
      document.removeEventListener("visibilitychange", onHide);
      onChange({ x: 0, y: 0 });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      className="relative rounded-full bg-background/30 backdrop-blur-[2px] border-2 border-primary/40 touch-none select-none shrink-0"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-[18%] rounded-full border border-primary/20 pointer-events-none" />
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
