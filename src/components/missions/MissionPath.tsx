import Link from "next/link";
import { TacticalPanel } from "@/components/layout/TacticalPanel";

function VaultNodeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 52 52" className="h-12 w-12">
      <path d="M26 2 48 14v24L26 50 4 38V14L26 2Z" fill="#151529" stroke="#9a7cff" strokeWidth="2" />
      <path d="m26 11 13 7v16l-13 7-13-7V18l13-7Z" fill="#9a7cff" fillOpacity=".18" stroke="#c173ff" />
      <path d="M20 20h12v12H20z" fill="none" stroke="#eef3f2" strokeWidth="2" />
      <path d="M26 16v20M16 26h20" stroke="#eef3f2" strokeWidth="2" />
    </svg>
  );
}

function LockedNodeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 44 44" className="h-10 w-10">
      <path d="m22 3 18 10v19L22 42 4 32V13L22 3Z" fill="#101821" stroke="#405362" strokeWidth="2" />
      <rect x="15" y="20" width="14" height="12" rx="1" fill="#17222c" stroke="#7f919b" />
      <path d="M18 20v-4a4 4 0 0 1 8 0v4" fill="none" stroke="#7f919b" strokeWidth="2" />
    </svg>
  );
}

export function MissionPath() {
  return (
    <TacticalPanel accent="violet" className="min-h-[580px] overflow-hidden p-5 sm:p-7 lg:p-9">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-violet">District topology</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.025em]">Vault District</h2>
        </div>
        <div className="flex items-center gap-2 border border-line bg-surface-0 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-teal" />
          1 mission available
        </div>
      </div>

      <div className="relative mt-8 min-h-[440px] border border-line bg-surface-0 p-4 sm:p-6">
        <svg aria-hidden="true" viewBox="0 0 660 430" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-80">
          <defs>
            <pattern id="mission-grid" width="34" height="34" patternUnits="userSpaceOnUse">
              <path d="M34 0H0v34" fill="none" stroke="#2a3945" strokeOpacity=".35" />
            </pattern>
          </defs>
          <rect width="660" height="430" fill="url(#mission-grid)" />
          <path d="M72 365 246 237 423 268 584 91" fill="none" stroke="#2a3945" strokeWidth="12" />
          <path d="M72 365 246 237" fill="none" stroke="#9a7cff" strokeWidth="2" strokeDasharray="5 8" />
          <path d="M246 237 423 268 584 91" fill="none" stroke="#405362" strokeWidth="2" strokeDasharray="5 8" />
          <path d="M88 79 190 144M474 385l83-75" stroke="#2a3945" strokeWidth="1" />
          <circle cx="72" cy="365" r="5" fill="#42d6b3" />
          <circle cx="246" cy="237" r="8" fill="#9a7cff" />
          <circle cx="423" cy="268" r="5" fill="#405362" />
          <circle cx="584" cy="91" r="5" fill="#405362" />
        </svg>

        <div className="relative z-10 grid min-h-[390px] grid-cols-1 gap-5 sm:grid-cols-2 sm:grid-rows-2">
          <div className="self-end sm:col-start-1 sm:row-start-2 sm:max-w-[230px]">
            <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.18em] text-muted">Entry point secured</div>
            <div className="flex items-center gap-3 border border-line bg-surface-1/95 p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-teal text-teal">✓</span>
              <div><strong className="block text-xs uppercase tracking-[0.08em]">Blacksite edge</strong><span className="text-[11px] text-muted">Campaign insertion</span></div>
            </div>
          </div>

          <Link
            href="/loadout/protect-the-vault"
            className="group self-center border border-violet bg-[#151529]/95 p-4 shadow-[0_0_0_1px_rgba(154,124,255,0.1),0_22px_50px_rgba(0,0,0,0.35)] transition-transform duration-200 hover:-translate-y-1 sm:col-start-1 sm:row-start-1 sm:row-end-3 sm:ml-auto sm:w-[250px]"
          >
            <div className="flex items-start justify-between gap-3">
              <VaultNodeIcon />
              <span className="bg-teal px-2 py-1 font-mono text-[8px] font-black uppercase tracking-[0.16em] text-void">Available</span>
            </div>
            <p className="mt-4 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-violet">Mission 01</p>
            <h3 className="mt-1 text-lg font-black uppercase leading-tight tracking-[-0.02em]">Protect the Vault</h3>
            <div className="mt-4 flex items-center justify-between border-t border-violet/25 pt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
              <span>Difficulty 02</span><span className="text-teal transition-transform group-hover:translate-x-1">Briefing →</span>
            </div>
          </Link>

          <div className="self-end opacity-75 sm:col-start-2 sm:row-start-2 sm:ml-auto sm:w-[235px]">
            <div className="border border-line bg-surface-1/95 p-4">
              <div className="flex items-start justify-between gap-3"><LockedNodeIcon /><span className="border border-line px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-muted">Locked</span></div>
              <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.18em] text-muted">Mission 02</p>
              <h3 className="mt-1 text-sm font-black uppercase tracking-[0.04em] text-[var(--ink-soft)]">Signal Breach</h3>
              <p className="mt-2 text-xs text-muted">Complete Protect the Vault.</p>
            </div>
          </div>

          <div className="opacity-60 sm:col-start-2 sm:row-start-1 sm:w-[215px]">
            <div className="border border-dashed border-[var(--line-bright)] bg-surface-1/90 p-4">
              <div className="flex items-center justify-between"><span className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-cyan">Daily node</span><span className="text-cyan">◇</span></div>
              <h3 className="mt-3 text-sm font-black uppercase tracking-[0.04em]">Daily Challenge</h3>
              <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.14em] text-muted">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </TacticalPanel>
  );
}
