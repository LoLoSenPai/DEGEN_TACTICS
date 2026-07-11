import { TacticalPanel } from "@/components/layout/TacticalPanel";
import { StartMissionButton } from "./StartMissionButton";

const enemies = [
  { mark: "▲", name: "Rugger", detail: "Rushes the Vault · 3 DMG", color: "text-danger" },
  { mark: "▼", name: "Drainer", detail: "Hunts weak units · heals on hit", color: "text-[var(--purple)]" },
  { mark: "◆", name: "Whale", detail: "Turn 3 breach · locked cone", color: "text-gold" },
];

export function BriefingPanel() {
  return (
    <aside className="space-y-4 xl:sticky xl:top-5">
      <TacticalPanel accent="violet" className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-violet">Operation 01</p>
            <h2 className="mt-2 text-2xl font-black uppercase leading-tight tracking-[-0.03em]">Protect the Vault</h2>
          </div>
          <span className="border border-gold/40 bg-gold/10 px-2 py-1 font-mono text-[8px] font-black uppercase tracking-[0.15em] text-gold">Medium</span>
        </div>

        <div className="mt-6 border border-violet/30 bg-violet/10 p-4">
          <div className="flex items-center justify-between gap-3"><span className="font-mono text-[8px] font-black uppercase tracking-[0.18em] text-violet">Mission modifier</span><span aria-hidden="true" className="text-violet">◎</span></div>
          <h3 className="mt-2 text-sm font-black uppercase tracking-[0.06em]">Full Intel</h3>
          <p className="mt-2 text-xs leading-5 text-[var(--ink-soft)]">Every hostile path, target, impact value, and threatened tile is visible before you commit.</p>
        </div>

        <div className="mt-6">
          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-muted">Primary objective</p>
          <p className="mt-2 text-sm font-semibold leading-6">Survive enemy phase 5 with the Vault intact.</p>
        </div>
        <ul className="mt-4 space-y-2 border-t border-line pt-4">
          <li className="flex gap-3 text-xs text-[var(--ink-soft)]"><span className="font-mono font-black text-teal">01</span>Protect the 10 HP Vault core.</li>
          <li className="flex gap-3 text-xs text-[var(--ink-soft)]"><span className="font-mono font-black text-teal">02</span>Keep at least one squad member active.</li>
          <li className="flex gap-3 text-xs text-[var(--ink-soft)]"><span className="font-mono font-black text-teal">03</span>Prepare for the turn-three breach.</li>
        </ul>
      </TacticalPanel>

      <TacticalPanel accent="danger" className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-danger">Enemy roster</p>
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">3 types</span>
        </div>
        {enemies.map((enemy) => (
          <div key={enemy.name} className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0">
            <span className={`flex h-9 w-9 items-center justify-center border border-line bg-surface-0 text-sm ${enemy.color}`}>{enemy.mark}</span>
            <div><strong className="block text-xs uppercase tracking-[0.08em]">{enemy.name}</strong><span className="mt-1 block text-[11px] text-muted">{enemy.detail}</span></div>
          </div>
        ))}
      </TacticalPanel>

      <div className="border border-line bg-surface-0 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-gold/40 bg-gold/10 font-mono font-black text-gold">B</span>
          <div><p className="text-xs font-black uppercase tracking-[0.08em]">Data Block on field</p><p className="mt-1 text-[11px] leading-5 text-muted">Push the movable blocker to reshape lanes and line of sight.</p></div>
        </div>
      </div>

      <StartMissionButton />
      <p className="text-center font-mono text-[8px] uppercase tracking-[0.14em] text-muted">Deployment creates a fresh tactical session</p>
    </aside>
  );
}
