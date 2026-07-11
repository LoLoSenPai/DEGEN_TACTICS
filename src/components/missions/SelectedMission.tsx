"use client";

import Link from "next/link";
import { TacticalPanel } from "@/components/layout/TacticalPanel";
import { useGameStore } from "@/store/gameStore";

const objectives = ["Vault survives five enemy phases", "Keep at least one specialist active", "Decode every hostile intent"];

export function SelectedMission() {
  const best = useGameStore((state) => state.bestScores["protect-the-vault"] ?? 0);

  return (
    <div className="space-y-4">
      <TacticalPanel accent="teal" className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-teal">Selected operation</p>
          <span className="border border-gold/40 bg-gold/10 px-2 py-1 font-mono text-[8px] font-black uppercase tracking-[0.16em] text-gold">Medium</span>
        </div>
        <h2 className="mt-5 text-[clamp(2rem,4vw,3.15rem)] font-black uppercase leading-[0.92] tracking-[-0.045em]">Protect the Vault</h2>
        <p className="mt-4 text-sm leading-6 text-[var(--ink-soft)]">
          Hostile movement converges on the district core. Deploy the fixed response squad and hold until extraction.
        </p>

        <div className="mt-6 grid grid-cols-3 border border-line bg-surface-0">
          <div className="border-r border-line p-3"><span className="block font-mono text-[8px] uppercase tracking-[0.14em] text-muted">Turns</span><strong className="mt-1 block text-xl">5</strong></div>
          <div className="border-r border-line p-3"><span className="block font-mono text-[8px] uppercase tracking-[0.14em] text-muted">Units</span><strong className="mt-1 block text-xl">3</strong></div>
          <div className="p-3"><span className="block font-mono text-[8px] uppercase tracking-[0.14em] text-muted">Best</span><strong className="mt-1 block font-mono text-base text-muted">{best ? best.toLocaleString() : "—"}</strong></div>
        </div>

        <div className="mt-6">
          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-muted">Mission objectives</p>
          <ul className="mt-3 space-y-2">
            {objectives.map((objective, index) => (
              <li key={objective} className="flex items-start gap-3 text-sm text-[var(--ink-soft)]">
                <span className="mt-0.5 font-mono text-[10px] font-black text-teal">0{index + 1}</span>
                {objective}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/loadout/protect-the-vault"
          className="group mt-7 flex min-h-12 w-full items-center justify-between border border-teal bg-teal px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-void transition-all hover:bg-ink"
        >
          Start briefing <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </TacticalPanel>

      <TacticalPanel accent="neutral" className="grid grid-cols-2 divide-x divide-line p-0">
        <div className="p-4 sm:p-5"><span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted">Local best</span><strong className="mt-2 block text-sm uppercase text-[var(--ink-soft)]">{best ? `${best.toLocaleString()} points` : "No completed runs"}</strong></div>
        <div className="p-4 sm:p-5"><span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted">Intel</span><strong className="mt-2 block text-sm uppercase text-cyan">Full disclosure</strong></div>
      </TacticalPanel>
    </div>
  );
}
