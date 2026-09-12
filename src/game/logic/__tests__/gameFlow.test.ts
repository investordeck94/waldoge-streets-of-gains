import { describe, expect, it } from "vitest";
import { retryButtonLabel, retryLevelFor } from "../gameFlow";

describe("difficulty-aware defeat retry", () => {
  it.each([
    ["easy", 0, 0], ["easy", 2, 2], ["easy", 6, 6],
    ["normal", 0, 0], ["normal", 2, 2], ["normal", 6, 6],
    ["blackMonday", 0, 0], ["blackMonday", 2, 0], ["blackMonday", 6, 0],
  ] as const)("%s defeated on level index %i retries index %i", (difficulty, defeated, expected) => {
    expect(retryLevelFor(difficulty, defeated)).toBe(expected);
  });

  it("describes the actual retry consequence", () => {
    expect(retryButtonLabel("easy", 2)).toBe("RETRY LEVEL 3");
    expect(retryButtonLabel("normal", 6)).toBe("RETRY LEVEL 7");
    expect(retryButtonLabel("blackMonday", 6)).toBe("RESTART RUN FROM LEVEL 1");
  });
});