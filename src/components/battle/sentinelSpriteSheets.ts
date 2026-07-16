export type SentinelBattleSpriteMotion = "idle" | "guard" | "hurt" | "death";

export type SentinelSpriteSheet = {
  readonly src: string;
  readonly frames: 8 | 12;
};

export const SENTINEL_SPRITE_SHEETS: Readonly<Record<SentinelBattleSpriteMotion, SentinelSpriteSheet>> = {
  idle: {
    src: "/assets/sprites/spritecook/sentinel-idle.png",
    frames: 8,
  },
  guard: {
    src: "/assets/sprites/spritecook/sentinel-guard.png",
    frames: 8,
  },
  hurt: {
    src: "/assets/sprites/spritecook/sentinel-hurt.png",
    frames: 8,
  },
  death: {
    src: "/assets/sprites/spritecook/sentinel-death.png",
    frames: 12,
  },
};

export const SENTINEL_SPRITE_SHEET_URLS = Object.values(SENTINEL_SPRITE_SHEETS).map(({ src }) => src);

