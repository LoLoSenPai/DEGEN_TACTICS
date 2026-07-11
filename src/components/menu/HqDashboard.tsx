"use client";

import Link from "next/link";
import { TacticalPanel } from "@/components/layout/TacticalPanel";
import { useGameStore } from "@/store/gameStore";

function DisabledCommand({ label, detail }: { label: string; detail: string }) {
  return (
    <button
      type="button"
      disabled
      title={`${label} is coming soon`}
      className="group flex w-full cursor-not-allowed items-center justify-between gap-4 border-t border-line px-5 py-4 text-left opacity-65 first:border-t-0"
    >
      <span>
        <span className="block text-sm font-bold uppercase tracking-[0.08em] text-[var(--ink-soft)]">{label}</span>
        <span className="mt-1 block text-xs text-muted">{detail}</span>
      </span>
      <span className="shrink-0 border border-line px-2 py-1 font-mono text-[8px] font-black uppercase tracking-[0.16em] text-muted">Coming soon</span>
    </button>
  );
}

export function HqDashboard() {
  const profile = useGameStore((state) => state.profile);
  const best = useGameStore((state) => state.bestScores["protect-the-vault"] ?? 0);
  return (
    <section aria-label="Headquarters status" className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-[1.25fr_0.85fr_0.9fr]">
      <TacticalPanel accent="violet" className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-violet">Active operation</p>
            <h2 className="mt-3 text-2xl font-black uppercase tracking-[-0.025em]">Protect the Vault</h2>
          </div>
          <span className="border border-gold/40 bg-gold/10 px-2 py-1 font-mono text-[8px] font-black uppercase tracking-[0.16em] text-gold">Medium</span>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--ink-soft)]">
          Hold Vault District through five enemy phases. The breach signature arrives on turn three.
        </p>
        <div className="mt-6 grid grid-cols-3 border border-line bg-surface-0">
          <div className="border-r border-line p-3">
            <span className="block font-mono text-[8px] uppercase tracking-[0.15em] text-muted">Turns</span>
            <strong className="mt-1 block text-xl text-ink">05</strong>
          </div>
          <div className="border-r border-line p-3">
            <span className="block font-mono text-[8px] uppercase tracking-[0.15em] text-muted">Squad</span>
            <strong className="mt-1 block text-xl text-ink">03</strong>
          </div>
          <div className="p-3">
            <span className="block font-mono text-[8px] uppercase tracking-[0.15em] text-muted">Best</span>
            <strong className="mt-1 block font-mono text-lg text-muted">{best ? best.toLocaleString() : "—"}</strong>
          </div>
        </div>
        <Link href="/loadout/protect-the-vault" className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-teal hover:text-ink">
          Open mission briefing <span aria-hidden="true">↗</span>
        </Link>
      </TacticalPanel>

      <TacticalPanel accent="teal" className="p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-[var(--line-bright)] bg-surface-2 font-mono text-lg font-black">
            G
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-[3px] border-surface-1 bg-teal" />
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Field operator</p>
            <h2 className="mt-1 text-lg font-black uppercase tracking-[0.04em]">{profile.displayName}</h2>
          </div>
        </div>
        <div className="mt-6 border-t border-line pt-5">
          <div className="flex items-end justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">Rank</span>
            <strong className="font-mono text-sm text-[var(--ink-soft)]">UNRANKED</strong>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden bg-surface-0"><span className="block h-full w-[8%] bg-teal" /></div>
          <div className="mt-2 flex justify-between font-mono text-[8px] uppercase tracking-[0.12em] text-muted"><span>0 XP</span><span>100 XP</span></div>
        </div>
        <div className="mt-5 flex items-center justify-between border border-line bg-surface-0 px-3 py-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Season points</span>
          <span className="font-mono text-xs font-bold text-muted">Unavailable</span>
        </div>
      </TacticalPanel>

      <TacticalPanel accent="neutral" className="overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-muted">Command network</p>
        </div>
        <DisabledCommand label="Daily challenge" detail="One board. One shared solution." />
        <DisabledCommand label="Global leaderboard" detail="Server-authoritative rankings." />
        <DisabledCommand label="Season archive" detail="Badges and operation history." />
      </TacticalPanel>
    </section>
  );
}
