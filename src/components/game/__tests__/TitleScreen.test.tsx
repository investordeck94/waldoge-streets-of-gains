import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TitleScreen } from "../TitleScreen";

vi.mock("@/components/game/TitleWaldogeFighter", () => ({ TitleWaldogeFighter: () => <div /> }));

const defaults = {
  continueInfo: { available: true, level: 2, levelName: "DOCKSIDE ENFORCER", difficulty: "normal" as const, bestScore: 900 },
  sfxEnabled: true,
  onToggleSfx: vi.fn(),
  camPreset: "snappy" as const,
  onCamPreset: vi.fn(),
};

describe("TitleScreen game flows", () => {
  it("keeps Start Game on level 1", () => {
    const onStart = vi.fn();
    render(<TitleScreen {...defaults} onStart={onStart} />);
    fireEvent.click(screen.getByRole("button", { name: /start game/i }));
    fireEvent.click(screen.getByRole("button", { name: /half a degen/i }));
    expect(onStart).toHaveBeenCalledWith("normal", undefined, false);
  });

  it("preserves Continue save behavior", () => {
    const onStart = vi.fn();
    render(<TitleScreen {...defaults} onStart={onStart} />);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onStart).toHaveBeenCalledWith("normal", 2);
  });

  it("offers all seven levels and forwards the selected level and difficulty", () => {
    const onStart = vi.fn();
    render(<TitleScreen {...defaults} onStart={onStart} />);
    fireEvent.click(screen.getByRole("button", { name: /free play/i }));
    expect(screen.getAllByText(/LEVEL [1-7]/)).toHaveLength(7);
    fireEvent.click(screen.getByRole("button", { name: /LEVEL 3.*BAD ACTOR/i }));
    fireEvent.click(screen.getByRole("button", { name: /full trench mode/i }));
    expect(onStart).toHaveBeenCalledWith("blackMonday", 2, true);
  });

  it("backs from difficulty to levels and levels to the main menu", () => {
    render(<TitleScreen {...defaults} onStart={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /free play/i }));
    fireEvent.click(screen.getByRole("button", { name: /LEVEL 4.*FUDDER/i }));
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByText("SELECT A LEVEL")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByRole("button", { name: /start game/i })).toBeInTheDocument();
  });
});