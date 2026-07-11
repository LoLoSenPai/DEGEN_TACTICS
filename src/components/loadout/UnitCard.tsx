import { TacticalPanel } from "@/components/layout/TacticalPanel";

export type UnitCardData = {
  id: "guardian" | "sniper" | "pusher";
  number: string;
  name: string;
  callSign: string;
  role: string;
  hp: number;
  move: number;
  attack: string;
  basicName: string;
  basicText: string;
  abilityName: string;
  abilityText: string;
  accent: "teal" | "cyan" | "gold";
};

const tone = {
  teal: { text: "text-teal", border: "border-teal/40", bg: "bg-teal/10", fill: "#42d6b3" },
  cyan: { text: "text-cyan", border: "border-cyan/40", bg: "bg-cyan/10", fill: "#59bfff" },
  gold: { text: "text-gold", border: "border-gold/40", bg: "bg-gold/10", fill: "#f2c75c" },
};

function UnitPortrait({ unit }: { unit: UnitCardData }) {
  const color = tone[unit.accent].fill;

  return (
    <svg aria-hidden="true" viewBox="0 0 120 120" className="h-24 w-24 shrink-0 sm:h-28 sm:w-28">
      <path d="M60 3 108 31v58l-48 28L12 89V31L60 3Z" fill="#0b1016" stroke="#405362" strokeWidth="2" />
      <path d="m60 13 39 23v47l-39 23-39-23V36l39-23Z" fill={color} fillOpacity=".08" stroke={color} strokeOpacity=".65" />
      <path d="M31 90c5-20 15-30 29-30s24 10 29 30" fill="#17222c" stroke={color} strokeWidth="2" />
      <path d="M42 39 60 27l18 12-4 23-14 8-14-8-4-23Z" fill="#1d2a35" stroke="#eef3f2" strokeWidth="2" />
      {unit.id === "guardian" ? (
        <>
          <path d="M51 39h18v22l-9 6-9-6V39Z" fill={color} fillOpacity=".26" stroke={color} strokeWidth="2" />
          <path d="M60 42v19M54 49h12" stroke="#eef3f2" strokeWidth="2" />
          <path d="M30 78 20 70v24h21" fill="#17222c" stroke={color} strokeWidth="2" />
        </>
      ) : null}
      {unit.id === "sniper" ? (
        <>
          <circle cx="60" cy="49" r="10" fill="none" stroke={color} strokeWidth="2" />
          <path d="M60 33v8M60 57v9M44 49h8M68 49h8" stroke="#eef3f2" strokeWidth="2" />
          <path d="m76 76 22-24" stroke={color} strokeWidth="4" />
        </>
      ) : null}
      {unit.id === "pusher" ? (
        <>
          <path d="M43 45h19v-9l16 13-16 14v-9H43v-9Z" fill={color} stroke="#eef3f2" strokeWidth="1.5" />
          <path d="M25 84h22M73 84h22" stroke={color} strokeWidth="6" />
        </>
      ) : null}
      <text x="60" y="108" fill={color} textAnchor="middle" fontFamily="monospace" fontSize="8" letterSpacing="2">{unit.callSign}</text>
    </svg>
  );
}

export function UnitCard({ unit }: { unit: UnitCardData }) {
  const colors = tone[unit.accent];

  return (
    <TacticalPanel accent={unit.accent} className="flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <UnitPortrait unit={unit} />
        <div className="text-right">
          <span className={`font-mono text-[9px] font-bold uppercase tracking-[0.2em] ${colors.text}`}>Unit {unit.number}</span>
          <span className="mt-2 block border border-line bg-surface-0 px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-muted">Fixed slot</span>
        </div>
      </div>

      <div className="mt-4">
        <p className={`font-mono text-[9px] font-bold uppercase tracking-[0.18em] ${colors.text}`}>{unit.role}</p>
        <h2 className="mt-1 text-2xl font-black uppercase tracking-[-0.03em]">{unit.name}</h2>
      </div>

      <div className="mt-5 grid grid-cols-3 border border-line bg-surface-0">
        <div className="border-r border-line p-3"><span className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">HP</span><strong className="mt-1 block text-lg">{unit.hp}</strong></div>
        <div className="border-r border-line p-3"><span className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">Move</span><strong className="mt-1 block text-lg">{unit.move}</strong></div>
        <div className="p-3"><span className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">Attack</span><strong className="mt-1 block text-lg">{unit.attack}</strong></div>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-black uppercase tracking-[0.08em]">{unit.basicName}</h3>
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">Basic</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-[var(--ink-soft)]">{unit.basicText}</p>
      </div>

      <div className={`mt-4 border ${colors.border} ${colors.bg} p-4`}>
        <div className="flex items-center justify-between gap-3">
          <h3 className={`text-xs font-black uppercase tracking-[0.08em] ${colors.text}`}>{unit.abilityName}</h3>
          <span className={`font-mono text-[8px] font-black uppercase tracking-[0.14em] ${colors.text}`}>◆ 1 charge</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-[var(--ink-soft)]">{unit.abilityText}</p>
      </div>

      <div className="mt-auto pt-5">
        <div className="flex gap-1" aria-label={`${unit.hp} hit points`}>
          {Array.from({ length: Math.min(unit.hp, 12) }, (_, index) => (
            <span key={index} className={`h-1 flex-1 ${index < unit.hp ? colors.bg : "bg-surface-0"}`} />
          ))}
        </div>
      </div>
    </TacticalPanel>
  );
}

export function LockedUnitCard() {
  return (
    <div className="relative min-h-[230px] overflow-hidden border border-dashed border-[var(--line-bright)] bg-surface-0 p-5 opacity-60 sm:p-6">
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <svg aria-hidden="true" viewBox="0 0 120 120" className="h-36 w-36">
          <path d="M60 4 108 32v56l-48 28L12 88V32L60 4Z" fill="none" stroke="#7f919b" strokeWidth="2" />
          <rect x="38" y="55" width="44" height="36" rx="2" fill="#17222c" stroke="#7f919b" strokeWidth="2" />
          <path d="M47 55V43a13 13 0 0 1 26 0v12" fill="none" stroke="#7f919b" strokeWidth="3" />
        </svg>
      </div>
      <div className="relative z-10 flex h-full min-h-[190px] flex-col justify-between">
        <div className="flex items-center justify-between"><span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-muted">Unit 04</span><span className="border border-line px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-muted">Locked</span></div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.17em] text-muted">Systems specialist</p>
          <h2 className="mt-1 text-2xl font-black uppercase tracking-[-0.03em] text-[var(--ink-soft)]">Hacker</h2>
          <p className="mt-3 text-xs leading-5 text-muted">Complete Signal Breach to decode this specialist.</p>
        </div>
      </div>
    </div>
  );
}
