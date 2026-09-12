import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TitleScreen } from "../TitleScreen";

vi.mock("@/components/game/TitleWaldogeFighter", () => ({ TitleWaldogeFighter: () => <div /> }));

const defaults = {
  continueInfo: { available: true, level: 2, levelName: "DOCKSIDE ENFORCER", difficulty: "normal" as const, bestScore: 900 },
  sfxEnabled: true,
  onToggleSfx: vi.fn(),
  camPreset: "snappy" as const,
  onCamPreset: vi.fn(),
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderTitle(onStart: ReturnType<typeof vi.fn>) {
  act(() => root.render(<TitleScreen {...defaults} onStart={onStart} />));
}

function button(name: RegExp): HTMLButtonElement {
  const match = Array.from(container.querySelectorAll("button")).find((item) =>
    name.test(item.getAttribute("aria-label") ?? item.textContent ?? ""),
  );
  if (!match) throw new Error(`Button not found: ${name}`);
  return match;
}

function click(target: HTMLButtonElement) {
  act(() => target.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

describe("TitleScreen game flows", () => {
  it("keeps Start Game on level 1", () => {
    const onStart = vi.fn();
    renderTitle(onStart);
    click(button(/start game/i));
    click(button(/half a degen/i));
    expect(onStart).toHaveBeenCalledWith("normal", undefined, false);
  });

  it("preserves Continue save behavior", () => {
    const onStart = vi.fn();
    renderTitle(onStart);
    click(button(/continue/i));
    expect(onStart).toHaveBeenCalledWith("normal", 2);
  });

  it("offers all seven levels and forwards the selected level and difficulty", () => {
    const onStart = vi.fn();
    renderTitle(onStart);
    click(button(/free play/i));
    expect(container.querySelectorAll('[aria-label^="Level "]')).toHaveLength(7);
    click(button(/Level 3 Bad Actor/i));
    click(button(/full trench mode/i));
    expect(onStart).toHaveBeenCalledWith("blackMonday", 2, true);
  });

  it("backs from difficulty to levels and levels to the main menu", () => {
    renderTitle(vi.fn());
    click(button(/free play/i));
    click(button(/Level 4 Fudder/i));
    click(button(/back/i));
    expect(container.textContent).toContain("SELECT A LEVEL");
    click(button(/back/i));
    expect(button(/start game/i)).toBeInTheDocument();
  });
});