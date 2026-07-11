import { AppShell } from "@/components/layout/AppShell";
import { MissionPath } from "@/components/missions/MissionPath";
import { SelectedMission } from "@/components/missions/SelectedMission";

export default function MissionsPage() {
  return (
    <AppShell section="Campaign map" footerNote="Chapter 01 // Fracture Zone // 1 of 3 nodes online">
      <section className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-teal"><span className="h-px w-8 bg-teal" />Campaign // Chapter 01</div>
          <h1 className="mt-4 text-[clamp(2.9rem,7vw,6.7rem)] font-black uppercase leading-[0.86] tracking-[-0.06em]">Fracture Zone</h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-[var(--ink-soft)] sm:text-right">
          A cold signal is carving through the district. Follow the breach line, secure the Vault, and expose its source.
        </p>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.55fr)]">
        <MissionPath />
        <SelectedMission />
      </div>
    </AppShell>
  );
}
