import { PLAYER_SPRITE_SHEET_URLS } from "./playerSpriteSheets";
import { SENTINEL_SPRITE_SHEET_URLS } from "./sentinelSpriteSheets";

export const BATTLE_SPRITE_SHEET_URLS = [
  ...new Set([...PLAYER_SPRITE_SHEET_URLS, ...SENTINEL_SPRITE_SHEET_URLS]),
];

let sheetsReady = false;
let preloadPromise: Promise<void> | null = null;
const preloadedImages = new Map<string, HTMLImageElement>();
const availableSheets = new Set<string>();
const failedSheets = new Set<string>();

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
      availableSheets.add(src);
      failedSheets.delete(src);
    } catch {
      availableSheets.delete(src);
      failedSheets.add(src);
    }
    resolve();
  };

  image.addEventListener("load", () => void finish(), { once: true });
  image.addEventListener("error", () => {
    if (settled) return;
    settled = true;
    availableSheets.delete(src);
    failedSheets.add(src);
    resolve();
  }, { once: true });
  image.src = src;
  if (image.complete) void finish();
});

export const battleSpriteSheetsAreReady = () => sheetsReady;
export const battleSpriteSheetIsAvailable = (src: string) => availableSheets.has(src);
export const battleSpriteSheetFailed = (src: string) => failedSheets.has(src);

export const preloadBattleSpriteSheets = (): Promise<void> => {
  if (sheetsReady || typeof window === "undefined") return Promise.resolve();
  preloadPromise ??= Promise.all(BATTLE_SPRITE_SHEET_URLS.map(loadAndDecode)).then(() => {
    sheetsReady = true;
  });
  return preloadPromise;
};
