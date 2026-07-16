import { afterEach, describe, expect, it, vi } from "vitest";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");

afterEach(() => {
  vi.resetModules();
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
});

describe("battle sprite preloader", () => {
  it("settles failed sheets without marking them available", async () => {
    class FailingImage {
      decoding = "async";
      complete = false;
      private listeners = new Map<string, EventListener>();

      addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
        if (typeof listener === "function") this.listeners.set(type, listener);
      }

      set src(_value: string) {
        queueMicrotask(() => this.listeners.get("error")?.({} as Event));
      }

      decode() {
        return Promise.reject(new Error("decode failed"));
      }
    }

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { Image: FailingImage },
    });

    const preloader = await import("./battleSpritePreloader");
    await preloader.preloadBattleSpriteSheets();

    const sentinelIdle = "/assets/sprites/spritecook/sentinel-idle.png";
    expect(preloader.battleSpriteSheetsAreReady()).toBe(true);
    expect(preloader.battleSpriteSheetIsAvailable(sentinelIdle)).toBe(false);
    expect(preloader.battleSpriteSheetFailed(sentinelIdle)).toBe(true);
  });
});
