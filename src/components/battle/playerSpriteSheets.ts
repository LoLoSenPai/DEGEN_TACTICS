import type { PlayerUnit } from "@/lib/game";

export type PlayerBattleSpriteMotion = "idle" | "walk" | "attack" | "ability" | "hurt" | "death";

export const PLAYER_SPRITE_SHEETS: Readonly<
  Record<PlayerUnit["role"], Readonly<Record<PlayerBattleSpriteMotion, string>>>
> = {
  guardian: {
    idle: "/assets/sprites/spritecook/guardian-idle.png",
    walk: "/assets/sprites/spritecook/guardian-walk.png",
    attack: "/assets/sprites/spritecook/guardian-attack.png",
    ability: "/assets/sprites/spritecook/guardian-shield-wall.png",
    hurt: "/assets/sprites/spritecook/guardian-hurt.png",
    death: "/assets/sprites/spritecook/guardian-death.png",
  },
  sniper: {
    idle: "/assets/sprites/spritecook/sniper-idle.png",
    walk: "/assets/sprites/spritecook/sniper-walk.png",
    attack: "/assets/sprites/spritecook/sniper-attack.png",
    ability: "/assets/sprites/spritecook/sniper-deadeye.png",
    hurt: "/assets/sprites/spritecook/sniper-hurt.png",
    death: "/assets/sprites/spritecook/sniper-death.png",
  },
  pusher: {
    idle: "/assets/sprites/spritecook/pusher-idle.png",
    walk: "/assets/sprites/spritecook/pusher-walk.png",
    attack: "/assets/sprites/spritecook/pusher-attack.png",
    ability: "/assets/sprites/spritecook/pusher-batter-up.png",
    hurt: "/assets/sprites/spritecook/pusher-hurt.png",
    death: "/assets/sprites/spritecook/pusher-death.png",
  },
};

export const PLAYER_SPRITE_SHEET_URLS = [...new Set(
  Object.values(PLAYER_SPRITE_SHEETS).flatMap((roleSheets) => Object.values(roleSheets)),
)];

let sheetsReady = false;
let preloadPromise: Promise<void> | null = null;
const preloadedImages = new Map<string, HTMLImageElement>();

const loadAndDecode = (src: string) => new Promise<void>((resolve) => {
  const image = new window.Image();
  image.decoding = "async";
  preloadedImages.set(src, image);
  let settled = false;

  const finish = async () => {
    if (settled) return;
    settled = true;
    try {
      await image.decode();
    } catch {
      // A failed optional decode must not leave the battle permanently locked.
    }
    resolve();
  };

  image.addEventListener("load", () => void finish(), { once: true });
  image.addEventListener("error", () => {
    if (settled) return;
    settled = true;
    resolve();
  }, { once: true });
  image.src = src;
  if (image.complete) void finish();
});

export const playerSpriteSheetsAreReady = () => sheetsReady;

export const preloadPlayerSpriteSheets = (): Promise<void> => {
  if (sheetsReady || typeof window === "undefined") return Promise.resolve();
  preloadPromise ??= Promise.all(PLAYER_SPRITE_SHEET_URLS.map(loadAndDecode)).then(() => {
    sheetsReady = true;
  });
  return preloadPromise;
};
