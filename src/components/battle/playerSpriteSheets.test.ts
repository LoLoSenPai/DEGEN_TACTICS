import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PLAYER_SPRITE_SHEETS, PLAYER_SPRITE_SHEET_URLS } from "./playerSpriteSheets";

describe("player sprite sheet registry", () => {
  it("maps every hero motion and points at the shipped files", () => {
    expect(Object.keys(PLAYER_SPRITE_SHEETS)).toEqual(["guardian", "sniper", "pusher"]);
    for (const roleSheets of Object.values(PLAYER_SPRITE_SHEETS)) {
      expect(Object.keys(roleSheets)).toEqual(["idle", "walk", "attack", "ability", "hurt", "death"]);
    }
    expect(PLAYER_SPRITE_SHEETS.sniper.ability).toBe("/assets/sprites/spritecook/sniper-deadeye.png");
    expect(PLAYER_SPRITE_SHEETS.sniper.ability).not.toBe(PLAYER_SPRITE_SHEETS.sniper.attack);
    expect(PLAYER_SPRITE_SHEET_URLS).toHaveLength(18);
    for (const url of PLAYER_SPRITE_SHEET_URLS) {
      expect(existsSync(join(process.cwd(), "public", url.slice(1))), url).toBe(true);
    }
  });
});
