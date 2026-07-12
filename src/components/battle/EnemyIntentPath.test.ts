import { describe, expect, it } from "vitest";

import type { EnemyTurnPlan } from "@/lib/game";

import {
  BLACKSITE_INTENT_GRID,
  buildEnemyIntentGeometry,
} from "./EnemyIntentPathGeometry";

const plan: EnemyTurnPlan = {
  turn: 1,
  fingerprint: "intent-svg-fixture",
  intents: [{
    enemyId: "rugger-test",
    enemyKind: "rugger",
    order: 2,
    action: "attack",
    from: { x: 3, y: 0 },
    path: [{ x: 3, y: 1 }, { x: 2, y: 1 }],
    destination: { x: 2, y: 1 },
    target: {
      id: "guardian",
      kind: "unit",
      position: { x: 2, y: 2 },
      expectedDamage: 3,
    },
    targets: [{
      id: "guardian",
      kind: "unit",
      position: { x: 2, y: 2 },
      expectedDamage: 3,
    }],
    area: [],
    damage: 3,
  }],
};

describe("enemy intent SVG geometry", () => {
  it("uses the calibrated tile centres and one continuous corner path", () => {
    const result = buildEnemyIntentGeometry(plan, BLACKSITE_INTENT_GRID);
    expect(result.metrics).toMatchObject({ width: 1140, height: 1129 });
    expect(result.paths[0].movement).toEqual([
      { x: 570, y: 80.5 },
      { x: 570, y: 242 },
      { x: 407.5, y: 242 },
    ]);
    expect(result.paths[0].movementPath).toBe(
      "M 570 80.5 L 570 242 L 407.5 242",
    );
  });

  it("deduplicates attack targets and trims the attack link around the marker", () => {
    const result = buildEnemyIntentGeometry(plan, BLACKSITE_INTENT_GRID);
    expect(result.paths[0].targets).toHaveLength(1);
    expect(result.paths[0].targets[0]).toMatchObject({
      id: "guardian",
      point: { x: 407.5, y: 403.5 },
      expectedDamage: 3,
    });
    expect(result.paths[0].targets[0].attackPath).toMatch(/^M 407\.5 /);
  });

  it("does not imply a direct attack line for an authored area slam", () => {
    const areaPlan: EnemyTurnPlan = {
      ...plan,
      intents: [{
        ...plan.intents[0],
        action: "slam",
        special: "ground-slam",
        path: [],
        destination: { x: 5, y: 3 },
        area: [{ x: 4, y: 3 }, { x: 3, y: 2 }],
      }],
    };
    const result = buildEnemyIntentGeometry(areaPlan, BLACKSITE_INTENT_GRID);
    expect(result.paths[0].targets[0].attackPath).toBeNull();
  });
});
