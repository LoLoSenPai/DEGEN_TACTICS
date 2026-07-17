"use client";

import Link from "next/link";
import { getSquadHref, PROTECT_THE_VAULT } from "@/lib/game";
import { useGameStore } from "@/store/gameStore";

export function StartMissionButton() {
  const startMission = useGameStore((state) => state.startMission);

  return (
    <Link
      id="start-mission"
      href={getSquadHref(PROTECT_THE_VAULT.id)}
      onClick={() => startMission(PROTECT_THE_VAULT.id)}
      className="group flex min-h-14 w-full items-center justify-between border border-teal bg-teal px-5 py-4 font-mono text-[11px] font-black uppercase tracking-[0.17em] text-void transition-all duration-150 hover:-translate-y-0.5 hover:bg-ink hover:shadow-[0_15px_35px_rgba(66,214,179,0.14)]"
    >
      Start mission <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
    </Link>
  );
}
