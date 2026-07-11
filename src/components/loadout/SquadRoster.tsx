import { LockedUnitCard, UnitCard, type UnitCardData } from "./UnitCard";

const squad: UnitCardData[] = [
  {
    id: "guardian",
    number: "01",
    name: "Guardian",
    callSign: "AEGIS",
    role: "Frontline anchor",
    hp: 12,
    move: 2,
    attack: "2",
    basicName: "Impact",
    basicText: "Strike an adjacent hostile for 2 damage. Acting completes this unit's activation.",
    abilityName: "Shield Wall",
    abilityText: "Grant 2 shield to self and adjacent allies for the next enemy phase. Shield absorbs one hit.",
    accent: "teal",
  },
  {
    id: "sniper",
    number: "02",
    name: "Sniper",
    callSign: "SIGHTLINE",
    role: "Precision control",
    hp: 7,
    move: 3,
    attack: "3",
    basicName: "Longshot",
    basicText: "Deal 3 damage along a clear cardinal line at range 1–3. Terrain blocks line of sight.",
    abilityName: "Deadeye",
    abilityText: "Deal 4 damage along a clear line. The Sniper cannot move first and spends the full activation.",
    accent: "cyan",
  },
  {
    id: "pusher",
    number: "03",
    name: "Pusher",
    callSign: "KNOCKBACK",
    role: "Position disruptor",
    hp: 9,
    move: 2,
    attack: "1",
    basicName: "Shove",
    basicText: "Push an adjacent target one tile. A blocked enemy takes 1 collision damage; objects take none.",
    abilityName: "Batter Up",
    abilityText: "Drive a target up to two tiles. A stopped enemy takes 2 collision damage.",
    accent: "gold",
  },
];

export function SquadRoster() {
  return (
    <section aria-labelledby="squad-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-teal">Deployment roster</p>
          <h2 id="squad-heading" className="mt-2 text-2xl font-black uppercase tracking-[-0.025em]">Fixed response squad</h2>
        </div>
        <div className="flex items-center gap-2 border border-line bg-surface-0 px-3 py-2 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-muted"><span className="h-1.5 w-1.5 rounded-full bg-teal" />3 / 3 ready</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {squad.map((unit) => <UnitCard key={unit.id} unit={unit} />)}
      </div>

      <div className="mt-4 md:max-w-[calc(50%-0.5rem)] 2xl:max-w-[calc(33.333%-0.667rem)]">
        <LockedUnitCard />
      </div>
    </section>
  );
}
