import { describe, it, expect } from "vitest";
import { strikeConnects } from "../strike";

const P = (facing: 1 | -1) => ({ x: 200, y: 400, width: 30, height: 70, facing });
const boss = (x: number) => ({ x, y: 400, width: 30, height: 70 });

describe("strikeConnects", () => {
  it("hits at normal range facing right", () => {
    expect(strikeConnects(P(1), boss(235), 45, false, 50)).toBe(true);
  });
  it("hits at normal range facing left", () => {
    expect(strikeConnects(P(-1), boss(165), 45, false, 50)).toBe(true);
  });
  it("hits when almost touching", () => {
    expect(strikeConnects(P(1), boss(230), 45, false, 50)).toBe(true);
  });
  it("hits when partially overlapping (the old bug)", () => {
    expect(strikeConnects(P(1), boss(205), 45, false, 50)).toBe(true);
    expect(strikeConnects(P(1), boss(199), 45, false, 50)).toBe(true);
  });
  it("misses a target clearly behind", () => {
    expect(strikeConnects(P(1), boss(140), 45, false, 50)).toBe(false);
  });
  it("misses a target out of reach", () => {
    expect(strikeConnects(P(1), boss(280), 45, false, 50)).toBe(false);
  });
  it("misses a target on a different vertical plane", () => {
    expect(strikeConnects(P(1), { ...boss(230), y: 300 }, 45, false, 50)).toBe(false);
  });
  it("ground pound hits both sides", () => {
    expect(strikeConnects(P(1), boss(150), 80, true, 60)).toBe(true);
    expect(strikeConnects(P(1), boss(250), 80, true, 60)).toBe(true);
  });
});
