import { describe, expect, it } from "vitest";
import { buildBoardPositionPath } from "./EnemyIntentPathGeometry";

describe("player movement preview geometry", () => {
  it("follows calibrated board centres through a corner", () => {
    const result = buildBoardPositionPath([
      { x: 3, y: 2 },
      { x: 3, y: 1 },
      { x: 2, y: 1 },
    ]);

    expect(result.path).toBe("M 570 403.5 L 570 242 L 407.5 242");
    expect(result.metrics).toMatchObject({ width: 1140, height: 1129 });
  });

  it("rejects an out-of-board point instead of drawing a partial arrow", () => {
    expect(buildBoardPositionPath([{ x: 3, y: 2 }, { x: 7, y: 2 }]).path).toBeNull();
  });
});
