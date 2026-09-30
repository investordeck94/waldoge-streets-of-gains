import { describe, it, expect, beforeEach } from "vitest";
import {
  BLANK_IMAGE_SRC,
  isResident,
  residentImage,
  resetResidencyForTests,
  residencySnapshot,
  setResidentLevel,
} from "../imageResidency";

/**
 * Level 7 phone bug: every level's artwork used to stay in memory forever, so
 * mobile browsers evicted and re-decoded sprite sheets mid-fight and Waldoge +
 * Ticker Taker vanished together for ~1 s. Only the active level's art may
 * stay resident.
 */
describe("level-scoped image residency", () => {
  beforeEach(() => resetResidencyForTests());

  it("releases other levels' artwork when Level 7 is active", () => {
    const l4 = residentImage(new Image(), "http://x/level4.jpg", [3]);
    const l7 = residentImage(new Image(), "http://x/ticker.png", [6], { pin: true });
    const waldoge = residentImage(new Image(), "http://x/waldoge.png", "always", { pin: true });
    setResidentLevel(3);
    expect(l4.src).toBe("http://x/level4.jpg");
    setResidentLevel(6);
    expect(isResident(l4)).toBe(false);
    expect(l4.src).toBe(BLANK_IMAGE_SRC);
    expect(isResident(l7)).toBe(true);
    expect(l7.src).toBe("http://x/ticker.png");
    expect(isResident(waldoge)).toBe(true);
  });

  it("reloads a level's artwork when returning to it", () => {
    const l1 = residentImage(new Image(), "http://x/jeet.png", [0]);
    setResidentLevel(6);
    expect(isResident(l1)).toBe(false);
    setResidentLevel(0);
    expect(isResident(l1)).toBe(true);
    expect(l1.src).toBe("http://x/jeet.png");
  });

  it("never runs a module's onload for the blank placeholder", () => {
    let loads = 0;
    const img = new Image();
    img.onload = () => { loads++; };
    residentImage(img, "http://x/l2.jpg", [1]);
    setResidentLevel(6);
    img.onload?.(new Event("load"));
    expect(loads).toBe(0);
  });

  it("is a no-op when the level is unchanged", () => {
    residentImage(new Image(), "http://x/a.png", [6]);
    setResidentLevel(6);
    const before = residencySnapshot();
    setResidentLevel(6);
    expect(residencySnapshot()).toEqual(before);
  });
});
