import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BATTLE_SPRITE_SHEET_URLS } from "./battleSpritePreloader";
import { SENTINEL_SPRITE_SHEETS, SENTINEL_SPRITE_SHEET_URLS } from "./sentinelSpriteSheets";

const pngDimensions = (path: string) => {
  const header = readFileSync(path).subarray(0, 24);
  expect(header.subarray(1, 4).toString("ascii")).toBe("PNG");
  return {
    width: header.readUInt32BE(16),
    height: header.readUInt32BE(20),
  };
};

describe("Lane Sentinel sprite sheet registry", () => {
  it("ships one native sheet for every reachable Sentinel motion", () => {
    expect(Object.keys(SENTINEL_SPRITE_SHEETS)).toEqual(["idle", "guard", "hurt", "death"]);
    expect(SENTINEL_SPRITE_SHEET_URLS).toHaveLength(4);

    for (const [motion, sheet] of Object.entries(SENTINEL_SPRITE_SHEETS)) {
      const path = join(process.cwd(), "public", sheet.src.slice(1));
      expect(existsSync(path), `${motion}: ${sheet.src}`).toBe(true);
      expect(pngDimensions(path)).toEqual({
        width: sheet.frames * 180,
        height: 180,
      });
    }
  });

  it("preloads the Sentinel together with every hero animation", () => {
    expect(BATTLE_SPRITE_SHEET_URLS).toHaveLength(22);
    for (const url of SENTINEL_SPRITE_SHEET_URLS) {
      expect(BATTLE_SPRITE_SHEET_URLS).toContain(url);
    }
  });
});
