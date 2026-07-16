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
