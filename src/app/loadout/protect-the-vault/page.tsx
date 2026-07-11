import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { BriefingPanel } from "@/components/loadout/BriefingPanel";
import { SquadRoster } from "@/components/loadout/SquadRoster";

export default function ProtectTheVaultLoadoutPage() {
  return (
    <AppShell section="Mission briefing" footerNote="Vault District // Fixed loadout // Full Intel active">
      <div className="mb-8">
        <Link href="/missions" className="inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-muted transition-colors hover:text-teal">
          <span aria-hidden="true">←</span> Back to Fracture Zone
        </Link>
        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-teal"><span className="h-px w-8 bg-teal" />Pre-deployment // Operation 01</div>
            <h1 className="mt-4 text-[clamp(2.8rem,6vw,6rem)] font-black uppercase leading-[0.86] tracking-[-0.06em]">Assemble the line</h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-[var(--ink-soft)] lg:text-right">
            Each specialist may move once, then act. Signatures carry one charge—commit them when the board breaks your way.
          </p>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SquadRoster />
        <BriefingPanel />
      </div>
    </AppShell>
  );
}
