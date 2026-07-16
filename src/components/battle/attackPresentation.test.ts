import { describe, expect, it } from "vitest";

import { createInitialGameState } from "../../lib/game/engine";
import { DATA_EXTRACTION } from "../../lib/game/mission";
import { buildAttackOutcomePreview } from "./attackPresentation";

describe("Sentinel attack presentation", () => {
  const game = createInitialGameState(DATA_EXTRACTION);
  const sniper = game.units.find((unit) => unit.id === "sniper")!;
  const rugger = game.enemies.find((enemy) => enemy.id === "rugger-extraction")!;
  const sentinel = game.enemies.find((enemy) => enemy.id === "sentinel-extraction")!;

  it("names the actual Sentinel receiver before an intercepted basic shot", () => {
    expect(buildAttackOutcomePreview(sniper, rugger, sentinel, false)).toEqual({
      intendedId: "rugger-extraction",
      receiverId: "sentinel-extraction",
      receiverName: "Lane Sentinel",
      intercepted: true,
      damage: 3,
      fatal: false,
    });
  });

  it("caps displayed Deadeye HP loss at the receiver's remaining health", () => {
    expect(buildAttackOutcomePreview(sniper, sentinel, { ...sentinel, hp: 2 }, true)).toMatchObject({
      intendedId: "sentinel-extraction",
      receiverId: "sentinel-extraction",
      intercepted: false,
      damage: 2,
      fatal: true,
    });
  });
});
