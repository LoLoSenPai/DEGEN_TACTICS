"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Boot,
  Check,
  Circuitry,
  Crosshair,
  HandFist,
  Heart,
  LockKey,
  Play,
  Shield,
  Target,
} from "@phosphor-icons/react";
import {
  SQUAD_ROLE_ORDER,
  canonicalizeSquad,
  getBattleHref,
  getMissionDefinition,
  getOperationMetadata,
  getRecommendedSquad,
  getRequiredSquadRoles,
  isAllowedSquadSelection,
  isOperationUnlocked,
  type PlayableMissionId,
  type UnitRole,
} from "@/lib/game";
import {
  battleSpriteSheetIsAvailable,
  battleSpriteSheetsAreReady,
  preloadBattleSpriteSheets,
} from "@/components/battle/battleSpritePreloader";
import { PLAYER_SPRITE_SHEETS } from "@/components/battle/playerSpriteSheets";
import { useGameStore } from "@/store/gameStore";

const HERO_PRESENTATION: Readonly<Record<UnitRole, {
  role: string;
  hook: string;
  basic: string;
  signature: string;
  sprite: string;
  icon: typeof Shield;
}>> = {
  guardian: {
    role: "Frontline",
    hook: "Absorbs pressure and protects nearby allies.",
    basic: "Shield Bash · 2 damage",
    signature: "Shield Wall · block one hit",
    sprite: "/assets/sprites/guardian.png",
    icon: Shield,
  },
  sniper: {
    role: "Precision",
    hook: "Controls long lanes and finishes priority targets.",
    basic: "Rifle · 3 damage · range 3",
    signature: "Deadeye · 4 damage",
    sprite: "/assets/sprites/sniper.png",
    icon: Target,
  },
  pusher: {
    role: "Control",
    hook: "Moves enemies and cargo; crashes targets into blockers.",
    basic: "Shove · reusable",
    signature: "Batter Up · push 2",
    sprite: "/assets/sprites/pusher.png",
    icon: HandFist,
  },
  hacker: {
    role: "Disruption",
    hook: "Rewrites exact intents and shuts down one activation.",
    basic: "Jam · next damage −2",
    signature: "Blackout · force HOLD",
    sprite: "/assets/sprites/hacker.png",
    icon: Circuitry,
  },
};

function HeroFigure({ role, animated }: { role: UnitRole; animated: boolean }) {
  const presentation = HERO_PRESENTATION[role];
  const idleSheet = PLAYER_SPRITE_SHEETS[role].idle;
  const useSheet = animated && battleSpriteSheetIsAvailable(idleSheet);

  return (
    <span className={`squad-hero-figure role-${role}`} aria-hidden="true">
      {useSheet ? (
        <span className="squad-hero-idle" style={{ backgroundImage: `url("${idleSheet}")` }} />
      ) : (
        <Image src={presentation.sprite} alt="" fill sizes="(min-width: 1200px) 23vw, (min-width: 700px) 25vw, 45vw" priority className="squad-hero-static" />
      )}
    </span>
  );
}

export function SquadSelectScreen({ missionId }: { missionId: PlayableMissionId }) {
  const router = useRouter();
  const hydrated = useGameStore((state) => state.hydrated);
  const completedMissionIds = useGameStore((state) => state.completedMissionIds);
  const savedSquad = useGameStore((state) => state.squadSelections[missionId]);
  const setSquadSelection = useGameStore((state) => state.setSquadSelection);
  const definition = getMissionDefinition(missionId);
  const operation = getOperationMetadata(missionId);
  const recommended = useMemo(() => getRecommendedSquad(definition), [definition]);
  const required = useMemo(() => new Set(getRequiredSquadRoles(definition)), [definition]);
  const availableRoles = useMemo(
    () => new Set(definition.squad?.allowedCompositions.flatMap((composition) => composition) ?? definition.units.map((unit) => unit.role)),
    [definition],
  );
  const [selected, setSelected] = useState<UnitRole[]>(recommended);
  const [spritesReady, setSpritesReady] = useState(() => battleSpriteSheetsAreReady());
  const [notice, setNotice] = useState("Choose three operators.");
  const initialized = useRef(false);
  const unlocked = isOperationUnlocked(missionId, completedMissionIds);

  useEffect(() => {
    let active = true;
    void preloadBattleSpriteSheets().then(() => {
      if (active) setSpritesReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (hydrated && !unlocked) router.replace("/operations");
  }, [hydrated, router, unlocked]);

  useEffect(() => {
    if (!hydrated || initialized.current) return;
    initialized.current = true;
    if (savedSquad && isAllowedSquadSelection(definition, savedSquad)) {
      setSelected(canonicalizeSquad(savedSquad));
      setNotice("Previous formation restored.");
    }
  }, [definition, hydrated, savedSquad]);

  const valid = isAllowedSquadSelection(definition, selected);
  const fixedFormation = required.size === 3;

  const chooseRole = (role: UnitRole) => {
    if (!availableRoles.has(role)) {
      setNotice("This operation needs the full assault trio.");
      return;
    }
    if (required.has(role)) {
      setNotice(`${HERO_PRESENTATION[role].role} specialist required by the objective.`);
      return;
    }

    if (selected.includes(role)) {
      setNotice("One deployment slot is now open.");
      setSelected(selected.filter((candidate) => candidate !== role));
      return;
    }

    if (selected.length < 3) {
      setNotice("Formation updated.");
      setSelected(canonicalizeSquad([...selected, role]));
      return;
    }

    const replace = [...selected].reverse().find((candidate) => !required.has(candidate));
    if (!replace) {
      setNotice("Every operator in this formation is mission-critical.");
      return;
    }
    setNotice(`${HERO_PRESENTATION[role].role} operator moved into the active squad.`);
    setSelected(canonicalizeSquad(selected.map((candidate) => candidate === replace ? role : candidate)));
  };

  const useRecommended = () => {
    setSelected(recommended);
    setNotice("Recommended formation loaded.");
  };

  const deploy = () => {
    if (!valid || !setSquadSelection(missionId, selected)) {
      setNotice("This formation cannot complete the operation.");
      return;
    }
    router.push(`${getBattleHref(missionId)}?intro=1`);
  };

  if (!operation) return null;
  if (hydrated && !unlocked) {
    return <main className="squad-select-screen squad-select-redirect" aria-live="polite">Operation locked</main>;
  }

  return (
    <main className="squad-select-screen">
      <div className="squad-select-backdrop" aria-hidden="true" />
      <div className="squad-select-scanlines" aria-hidden="true" />

      <header className="squad-select-header">
        <Link href="/operations" className="squad-select-back">
          <ArrowLeft weight="bold" aria-hidden="true" /> Operations
        </Link>
        <div className="squad-select-heading">
          <p>{operation.eyebrow} · Deployment</p>
          <h1>Choose your squad</h1>
          <span>{operation.title} · {operation.shortObjective}</span>
        </div>
        <button type="button" className="squad-recommended" onClick={useRecommended} disabled={!hydrated}>
          <Crosshair weight="bold" aria-hidden="true" /> Recommended
        </button>
      </header>

      <section className="squad-cast" aria-label="Available operators">
        {SQUAD_ROLE_ORDER.map((role) => {
          const presentation = HERO_PRESENTATION[role];
          const Icon = presentation.icon;
          const isSelected = selected.includes(role);
          const isRequired = required.has(role);
          const isAvailable = availableRoles.has(role);
          const slot = isSelected ? selected.indexOf(role) + 1 : null;
          return (
            <button
              key={role}
              type="button"
              className={`squad-hero${isSelected ? " is-selected" : ""}${isRequired ? " is-required" : ""}${!isAvailable ? " is-unavailable" : ""}`}
              onClick={() => chooseRole(role)}
              aria-pressed={isSelected}
              aria-label={`${presentation.role} ${role}. ${isSelected ? `Selected in slot ${slot}.` : "Reserve."} ${isRequired ? "Required." : ""}`}
              data-squad-role={role}
              data-squad-selected={isSelected}
              disabled={!hydrated}
            >
              <span className="squad-hero-grid" aria-hidden="true" />
              <HeroFigure role={role} animated={spritesReady} />
              <span className="squad-hero-status">
                {isRequired ? <><LockKey weight="fill" /> Required</> : isSelected ? <><Check weight="bold" /> Slot {slot}</> : isAvailable ? "Reserve" : "Unavailable"}
              </span>
              <span className="squad-hero-copy">
                <small><Icon weight="fill" aria-hidden="true" /> {presentation.role}</small>
                <strong>{role}</strong>
                <em>{presentation.hook}</em>
                <span>{presentation.basic}</span>
                <span>{presentation.signature}</span>
              </span>
            </button>
          );
        })}
      </section>

      <footer className="squad-deploy-rail">
        <div className="squad-formation" aria-label={`${selected.length} of 3 deployment slots filled`}>
          {[0, 1, 2].map((index) => {
            const role = selected[index];
            return (
              <span key={index} className={`squad-slot${role ? " is-filled" : ""}`}>
                <b>0{index + 1}</b>
                {role ? <><Image src={HERO_PRESENTATION[role].sprite} alt="" width={54} height={54} /><strong>{role}</strong></> : <em>Open</em>}
              </span>
            );
          })}
        </div>

        <div className="squad-deploy-copy" aria-live="polite">
          <span>{fixedFormation ? "Assault formation locked for this boss" : notice}</span>
          <small>{valid ? "All three operators ready" : `${selected.length} / 3 selected · choose an allowed formation`}</small>
          {selected.includes("hacker") ? <Link href="/training">Need the Hacker controls? Open System Override training</Link> : null}
        </div>

        <button type="button" className="squad-deploy-button" onClick={deploy} disabled={!hydrated || !valid}>
          <Play weight="fill" aria-hidden="true" />
          <span>Deploy <small>{operation.title}</small></span>
        </button>
      </footer>

      <div className="squad-vitals" aria-hidden="true">
        <span><Heart weight="fill" /> Squad integrity</span>
        <span><Boot weight="fill" /> Three activations per turn</span>
      </div>
    </main>
  );
}
