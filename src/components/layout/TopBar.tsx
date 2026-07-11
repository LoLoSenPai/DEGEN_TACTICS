"use client";

import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { useGameStore } from "@/store/gameStore";

type TopBarProps = {
  section?: string;
};

export function TopBar({ section }: TopBarProps) {
  const profile = useGameStore((state) => state.profile);
  return (
    <header className="flex min-h-20 items-center justify-between gap-4 border-b-2 border-line py-4">
      <div className="flex items-center gap-4 sm:gap-6">
        <BrandMark compact />
        {section ? (
          <>
            <span aria-hidden="true" className="hidden h-8 w-0.5 bg-line sm:block" />
            <span className="hidden -rotate-1 rounded-sm border border-line bg-[var(--paper-pale)] px-3 py-1 font-mono text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--ink-soft)] shadow-[2px_3px_0_rgba(72,43,23,0.18)] sm:block">
              {section}
            </span>
          </>
        ) : null}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/missions"
          className="hidden rounded-md border-2 border-transparent px-3 py-2 font-mono text-[12px] font-extrabold uppercase tracking-[0.12em] text-[var(--ink-soft)] transition-[background-color,border-color,transform] duration-150 hover:-rotate-1 hover:border-line hover:bg-surface-2 hover:text-ink sm:block"
        >
          Campaign
        </Link>
        <div className="flex items-center gap-2 rounded-[10px_7px_11px_8px] border-2 border-[var(--line-bright)] bg-[var(--paper-pale)] px-2.5 py-1.5 shadow-[2px_3px_0_rgba(72,43,23,0.2)] sm:px-3">
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--line-bright)] bg-surface-2 font-mono text-[11px] font-extrabold text-ink">
            G
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--paper-pale)] bg-teal" />
          </span>
          <span className="hidden text-sm font-bold text-[var(--ink-soft)] sm:inline">{profile.displayName}</span>
        </div>
        <button
          type="button"
          disabled
          title="Wallet connection is coming soon"
          className="cursor-not-allowed rounded-md border-2 border-line bg-surface-1 px-3 py-2 font-mono text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted opacity-70 sm:px-4"
        >
          <span className="hidden sm:inline">Connect wallet · </span>Soon
        </button>
      </div>
    </header>
  );
}
