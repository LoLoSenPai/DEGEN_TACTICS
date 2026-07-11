import Link from "next/link";
import { MissionDiorama } from "./MissionDiorama";

export function HqHero() {
  return (
    <section className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,0.86fr)_minmax(500px,1.14fr)] lg:gap-12">
      <div className="flex flex-col justify-center py-2 lg:py-10">
        <div className="mb-7 flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-teal">
          <span className="h-px w-9 bg-teal" />
          Command online // Fracture Zone
        </div>
        <h1 className="max-w-[760px] text-[clamp(3.25rem,7.2vw,7.2rem)] font-black uppercase leading-[0.82] tracking-[-0.065em] text-ink">
          Every move
          <span className="mt-2 block text-teal">counts.</span>
        </h1>
        <p className="mt-7 max-w-xl text-base leading-7 text-[var(--ink-soft)] sm:text-lg">
          Three specialists. Five hostile turns. One vault that cannot fall. Read every intent and turn the district into your weapon.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/missions"
            className="group inline-flex min-h-12 items-center justify-between gap-8 border border-teal bg-teal px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.17em] text-void transition-all duration-150 hover:-translate-y-0.5 hover:bg-ink hover:shadow-[0_12px_30px_rgba(66,214,179,0.14)]"
          >
            Play campaign
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <Link
            href="/loadout/protect-the-vault"
            className="inline-flex min-h-12 items-center justify-center border border-[var(--line-bright)] bg-surface-1 px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[0.17em] text-ink transition-all duration-150 hover:-translate-y-0.5 hover:border-cyan hover:text-cyan"
          >
            Review loadout
          </Link>
        </div>

        <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">
          <span className="flex items-center gap-2"><i className="h-1.5 w-1.5 rounded-full bg-teal" />Exact intents</span>
          <span className="flex items-center gap-2"><i className="h-1.5 w-1.5 rounded-full bg-cyan" />No random rolls</span>
          <span className="flex items-center gap-2"><i className="h-1.5 w-1.5 rounded-full bg-gold" />One perfect line</span>
        </div>
      </div>

      <MissionDiorama />
    </section>
  );
}
