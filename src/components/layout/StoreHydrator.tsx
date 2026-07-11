"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";

export function StoreHydrator() {
  useEffect(() => {
    let active = true;
    const finish = () => {
      if (!active) return;
      useGameStore.getState().setHydrated(true);
      useGameStore.getState().ensureIdentity();
    };
    try {
      const rehydration = useGameStore.persist?.rehydrate?.();
      void Promise.resolve(rehydration).catch(() => undefined).finally(finish);
    } catch {
      finish();
    }
    return () => {
      active = false;
    };
  }, []);

  return null;
}
