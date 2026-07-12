"use client";

import {
  ArrowRight,
  CheckCircle,
  Crosshair,
  Cube,
  Eye,
  Footprints,
  HandGrabbing,
  Shield,
  Sword,
  Warning,
} from "@phosphor-icons/react";
import { useCallback, useLayoutEffect, useState, type CSSProperties } from "react";

export type BattleTutorialStep =
  | "basics-intro"
  | "basics-select-guardian"
  | "basics-move-guardian"
  | "basics-choose-attack"
  | "basics-attack-rugger"
  | "basics-read-intent"
  | "basics-end-turn"
  | "basics-watch-enemy"
  | "basics-complete"
  | "squad-intro"
  | "squad-select-guardian"
  | "squad-move-guardian"
  | "squad-shield-wall"
  | "squad-select-sniper"
  | "squad-deadeye"
  | "squad-target-drainer"
  | "squad-end-turn"
  | "squad-watch-shield"
  | "squad-complete"
  | "push-intro"
  | "push-select-pusher"
  | "push-move-to-block"
  | "push-choose-shove-block"
  | "push-data-block"
  | "push-end-turn-one"
  | "push-breach-warning"
  | "push-select-collision"
  | "push-move-to-collision"
  | "push-choose-shove-enemy"
  | "push-collision"
  | "push-end-turn-two"
  | "push-whale-arrives"
  | "push-select-for-whale"
  | "push-wait"
  | "push-move-for-whale"
  | "push-end-turn-three"
  | "push-watch-charge"
  | "push-locked-cone"
  | "push-select-charging"
  | "push-choose-shove-whale"
  | "push-cancel-whale"
  | "training-complete"
  | null;

type TutorialIconKind = "shield" | "move" | "attack" | "target" | "intent" | "push" | "block" | "warning" | "complete";

type TutorialCopy = {
  title: string;
  prompt: string;
  body: string;
  icon: TutorialIconKind;
  action?: string;
  awaiting?: string;
};

type LessonMeta = {
  label: string;
  steps: readonly Exclude<BattleTutorialStep, null>[];
};

const BASICS_STEPS = [
  "basics-intro",
  "basics-select-guardian",
  "basics-move-guardian",
  "basics-choose-attack",
  "basics-attack-rugger",
  "basics-read-intent",
  "basics-end-turn",
  "basics-watch-enemy",
  "basics-complete",
] as const;

const SQUAD_STEPS = [
  "squad-intro",
  "squad-select-guardian",
  "squad-move-guardian",
  "squad-shield-wall",
  "squad-select-sniper",
  "squad-deadeye",
  "squad-target-drainer",
  "squad-end-turn",
  "squad-watch-shield",
  "squad-complete",
] as const;

const PUSH_STEPS = [
  "push-intro",
  "push-select-pusher",
  "push-move-to-block",
  "push-choose-shove-block",
  "push-data-block",
  "push-end-turn-one",
  "push-breach-warning",
  "push-select-collision",
  "push-move-to-collision",
  "push-choose-shove-enemy",
  "push-collision",
  "push-end-turn-two",
  "push-whale-arrives",
  "push-select-for-whale",
  "push-wait",
  "push-end-turn-three",
  "push-watch-charge",
  "push-locked-cone",
  "push-select-charging",
  "push-move-for-whale",
  "push-choose-shove-whale",
  "push-cancel-whale",
] as const;

const LESSONS: readonly LessonMeta[] = [
  { label: "Lesson 1 / 3 · The Turn Loop", steps: BASICS_STEPS },
  { label: "Lesson 2 / 3 · Squad Tactics", steps: SQUAD_STEPS },
  { label: "Lesson 3 / 3 · Push Control", steps: PUSH_STEPS },
];

const COPY: Record<Exclude<BattleTutorialStep, null>, TutorialCopy> = {
  "basics-intro": {
    title: "Learn the turn loop",
    prompt: "Move once. Then take one action.",
    body: "Solid red shows exact movement. A dashed link shows the exact attack target and damage.",
    action: "Start lesson",
    icon: "shield",
  },
  "basics-select-guardian": {
    title: "Choose a hero",
    prompt: "Select Guardian at D4.",
    body: "A hero activates once each turn. Start with the shield-bearing Guardian.",
    awaiting: "Click the highlighted hero",
    icon: "shield",
  },
  "basics-move-guardian": {
    title: "Move first",
    prompt: "Move Guardian to D2.",
    body: "Teal tiles are legal moves. Movement is orthogonal and does not end the activation.",
    awaiting: "Click the highlighted tile",
    icon: "move",
  },
  "basics-choose-attack": {
    title: "Now act",
    prompt: "Choose Attack.",
    body: "Guardian has moved and can still take one action.",
    awaiting: "Press 2 or click Attack",
    icon: "attack",
  },
  "basics-attack-rugger": {
    title: "Choose a target",
    prompt: "Attack the Rugger at D1.",
    body: "Cyan marks a target in range. Attacking completes Guardian’s activation.",
    awaiting: "Click the highlighted enemy",
    icon: "target",
  },
  "basics-read-intent": {
    title: "Read the intent",
    prompt: "Your move rewrote the enemy plan.",
    body: "The number is execution order. The dashed link now targets Guardian for exactly 3 damage.",
    action: "I understand",
    icon: "intent",
  },
  "basics-end-turn": {
    title: "Commit the plan",
    prompt: "Choose End Turn.",
    body: "The preview locks now. Enemies will not secretly retarget.",
    awaiting: "Press Space or click End Turn",
    icon: "intent",
  },
  "basics-watch-enemy": {
    title: "Watch the order",
    prompt: "Watch the numbered enemies act.",
    body: "They execute the same routes and targets you just inspected.",
    awaiting: "Enemy phase in progress",
    icon: "intent",
  },
  "basics-complete": {
    title: "Turn loop complete",
    prompt: "Move, act, read, then commit.",
    body: "You completed one full turn. Next, use positioning, abilities and line of sight.",
    action: "Next lesson",
    icon: "complete",
  },
  "squad-intro": {
    title: "Use the whole squad",
    prompt: "Activate heroes in any order.",
    body: "Guardian protects nearby allies. Sniper strikes along clear cardinal lines.",
    action: "Start lesson",
    icon: "shield",
  },
  "squad-select-guardian": {
    title: "Set the formation",
    prompt: "Select Guardian.",
    body: "Position allies beside Guardian before using Shield Wall.",
    awaiting: "Click the highlighted hero",
    icon: "shield",
  },
  "squad-move-guardian": {
    title: "Protect an ally",
    prompt: "Move Guardian to the highlighted tile.",
    body: "Shield Wall affects Guardian and orthogonally adjacent allies.",
    awaiting: "Click the highlighted tile",
    icon: "move",
  },
  "squad-shield-wall": {
    title: "Raise Shield Wall",
    prompt: "Use Shield Wall now.",
    body: "This one-use ability gives Guardian and adjacent allies one shield for the next enemy phase.",
    awaiting: "Press 3 or click Shield Wall",
    icon: "shield",
  },
  "squad-select-sniper": {
    title: "Switch heroes",
    prompt: "Select Sniper.",
    body: "Guardian is done, but the other heroes may still activate this turn.",
    awaiting: "Click the highlighted hero",
    icon: "target",
  },
  "squad-deadeye": {
    title: "Fire before moving",
    prompt: "Choose Deadeye.",
    body: "One-use Deadeye deals 4 damage, but it spends both Sniper’s movement and action.",
    awaiting: "Press 3 or click Deadeye",
    icon: "target",
  },
  "squad-target-drainer": {
    title: "Check the firing line",
    prompt: "Target the highlighted Drainer.",
    body: "Sniper fires 1–3 tiles in a cardinal line. Obstacles, the Vault and Data Block block sight.",
    awaiting: "Click the highlighted enemy",
    icon: "target",
  },
  "squad-end-turn": {
    title: "Test the defense",
    prompt: "Choose End Turn.",
    body: "The shields last for this enemy phase only.",
    awaiting: "Press Space or click End Turn",
    icon: "shield",
  },
  "squad-watch-shield": {
    title: "Watch the shield",
    prompt: "Watch Shield Wall absorb one hit.",
    body: "The shield absorbs up to 2 damage from one hit, then expires.",
    awaiting: "Enemy phase in progress",
    icon: "shield",
  },
  "squad-complete": {
    title: "Squad tactics complete",
    prompt: "Position first. Spend abilities with purpose.",
    body: "You learned activation order, adjacency, line of sight and one-charge signatures.",
    action: "Next lesson",
    icon: "complete",
  },
  "push-intro": {
    title: "Control the board",
    prompt: "Push units and objects to rewrite the fight.",
    body: "Collision hurts only pushed enemies—not allies, the Vault or Data Blocks.",
    action: "Start lesson",
    icon: "push",
  },
  "push-select-pusher": {
    title: "Choose the specialist",
    prompt: "Select Pusher.",
    body: "Pusher can shove an adjacent enemy or Data Block directly away.",
    awaiting: "Click the highlighted hero",
    icon: "push",
  },
  "push-move-to-block": {
    title: "Line up the push",
    prompt: "Move beside the Data Block.",
    body: "A push travels directly away from Pusher.",
    awaiting: "Click the highlighted tile",
    icon: "move",
  },
  "push-choose-shove-block": {
    title: "Choose Shove",
    prompt: "Select the reusable Shove action.",
    body: "Shove moves an adjacent target one tile when the destination is free.",
    awaiting: "Click Shove",
    icon: "push",
  },
  "push-data-block": {
    title: "Move the block",
    prompt: "Push the Data Block.",
    body: "It has no health, blocks movement and sight, and never takes collision damage.",
    awaiting: "Click the highlighted block",
    icon: "block",
  },
  "push-end-turn-one": {
    title: "Let the board answer",
    prompt: "Choose End Turn.",
    body: "Enemy plans recalculate after every legal player action.",
    awaiting: "Press Space or click End Turn",
    icon: "intent",
  },
  "push-breach-warning": {
    title: "Incoming breach",
    prompt: "Inspect the marked G4 tile.",
    body: "It is impassable now. A Whale will arrive there at the start of Turn 3.",
    action: "Continue",
    icon: "warning",
  },
  "push-select-collision": {
    title: "Choose Pusher again",
    prompt: "Select Pusher at E6.",
    body: "Now set up a blocked push to turn the terrain into a weapon.",
    awaiting: "Click the highlighted hero",
    icon: "push",
  },
  "push-move-to-collision": {
    title: "Use the terrain",
    prompt: "Move beside the highlighted Rugger.",
    body: "Blocked enemies can be slammed into obstacles or the edge of the board.",
    awaiting: "Click the highlighted tile",
    icon: "move",
  },
  "push-choose-shove-enemy": {
    title: "Set up a collision",
    prompt: "Choose Shove.",
    body: "A blocked one-tile Shove deals 1 collision damage.",
    awaiting: "Click Shove",
    icon: "push",
  },
  "push-collision": {
    title: "Create the collision",
    prompt: "Shove the highlighted Rugger.",
    body: "Blocked enemies take 1. One-use Batter Up pushes up to two tiles and deals 2 on collision.",
    awaiting: "Click the highlighted enemy",
    icon: "push",
  },
  "push-end-turn-two": {
    title: "Advance the lesson",
    prompt: "Choose End Turn.",
    body: "The incoming breach resolves at the start of Turn 3.",
    awaiting: "Press Space or click End Turn",
    icon: "intent",
  },
  "push-whale-arrives": {
    title: "Whale breach",
    prompt: "Find the Whale at G4.",
    body: "It moves one tile, then locks a cardinal cone for its next activation.",
    action: "Prepare",
    icon: "warning",
  },
  "push-select-for-whale": {
    title: "Hold your ground",
    prompt: "Select Pusher at E5.",
    body: "Sometimes the best activation is to keep a useful position.",
    awaiting: "Click the highlighted hero",
    icon: "push",
  },
  "push-wait": {
    title: "Wait in position",
    prompt: "Choose Wait.",
    body: "Wait ends this hero's activation without moving or attacking.",
    awaiting: "Press W or click Wait",
    icon: "intent",
  },
  "push-move-for-whale": {
    title: "Take position",
    prompt: "Move Pusher to the highlighted tile.",
    body: "Move beside the Whale without entering its locked cone.",
    awaiting: "Click the highlighted tile",
    icon: "move",
  },
  "push-end-turn-three": {
    title: "Reveal the charge",
    prompt: "Choose End Turn.",
    body: "The Whale will move, then lock the exact tiles it threatens next turn.",
    awaiting: "Press Space or click End Turn",
    icon: "intent",
  },
  "push-watch-charge": {
    title: "Read the locked cone",
    prompt: "Watch the Whale lock its attack area.",
    body: "Heavy pulsing red tiles will take 4 damage on its next activation.",
    awaiting: "Enemy phase in progress",
    icon: "warning",
  },
  "push-locked-cone": {
    title: "The cone is locked",
    prompt: "These exact tiles take 4 damage next turn.",
    body: "Do not end the turn. Forced movement can cancel the charge before the slam.",
    action: "Break the charge",
    icon: "warning",
  },
  "push-select-charging": {
    title: "Break the charge",
    prompt: "Select Pusher again.",
    body: "A successful push while the Whale is charging cancels its cone.",
    awaiting: "Click the highlighted hero",
    icon: "push",
  },
  "push-choose-shove-whale": {
    title: "Choose the interrupt",
    prompt: "Choose Shove.",
    body: "A normal Shove is enough to interrupt this charge.",
    awaiting: "Click Shove",
    icon: "push",
  },
  "push-cancel-whale": {
    title: "Cancel the cone",
    prompt: "Push the charging Whale.",
    body: "A successful push cancels the locked cone and staggers the Whale for its next activation.",
    awaiting: "Click the highlighted Whale",
    icon: "push",
  },
  "training-complete": {
    title: "Training complete",
    prompt: "Protect the Vault for five turns.",
    body: "You know the turn loop, exact intents, line of sight, shields, Wait, collision and Whale interruption.",
    action: "Start mission",
    icon: "complete",
  },
};

const INTRO_STEPS = new Set<Exclude<BattleTutorialStep, null>>(["basics-intro", "squad-intro", "push-intro"]);

const CENTERED_STEPS = new Set<Exclude<BattleTutorialStep, null>>([
  "basics-intro",
  "basics-complete",
  "squad-intro",
  "squad-complete",
  "push-intro",
  "push-breach-warning",
  "push-whale-arrives",
  "training-complete",
]);

function lessonProgress(step: Exclude<BattleTutorialStep, null>) {
  if (step === "training-complete") return { label: "Field training complete", current: 3, total: 3 };
  const lesson = LESSONS.find((candidate) => candidate.steps.includes(step));
  if (!lesson) return { label: "Field training", current: 1, total: 1 };
  return {
    label: lesson.label,
    current: lesson.steps.indexOf(step) + 1,
    total: lesson.steps.length,
  };
}

function TutorialIcon({ kind }: { kind: TutorialIconKind }) {
  if (kind === "move") return <Footprints weight="fill" />;
  if (kind === "attack") return <Sword weight="fill" />;
  if (kind === "target") return <Crosshair weight="fill" />;
  if (kind === "intent") return <Eye weight="fill" />;
  if (kind === "push") return <HandGrabbing weight="fill" />;
  if (kind === "block") return <Cube weight="fill" />;
  if (kind === "warning") return <Warning weight="fill" />;
  if (kind === "complete") return <CheckCircle weight="fill" />;
  return <Shield weight="fill" />;
}

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function useTutorialSpotlight(step: Exclude<BattleTutorialStep, null>) {
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  const measure = useCallback(() => {
    const target = document.querySelector<HTMLElement>(`[data-tutorial-target="${step}"]`);
    if (!target) {
      setRect(null);
      return null;
    }

    const bounds = target.getBoundingClientRect();
    const padding = bounds.width > 500 || bounds.height > 500 ? 6 : 10;
    setRect({
      top: Math.max(3, bounds.top - padding),
      left: Math.max(3, bounds.left - padding),
      width: Math.min(window.innerWidth - Math.max(3, bounds.left - padding) - 3, bounds.width + padding * 2),
      height: Math.min(window.innerHeight - Math.max(3, bounds.top - padding) - 3, bounds.height + padding * 2),
    });
    return target;
  }, [step]);

  useLayoutEffect(() => {
    let animationFrame = 0;
    let resizeObserver: ResizeObserver | null = null;

    const scheduleMeasure = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(measure);
    };

    const target = measure();
    if (target && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(scheduleMeasure);
      resizeObserver.observe(target);
    }

    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("scroll", scheduleMeasure, true);
    animationFrame = window.requestAnimationFrame(measure);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("scroll", scheduleMeasure, true);
    };
  }, [measure]);

  return rect;
}

export function isTutorialIntroStep(step: Exclude<BattleTutorialStep, null>) {
  return INTRO_STEPS.has(step);
}

export function isTutorialCenteredStep(step: Exclude<BattleTutorialStep, null>) {
  return CENTERED_STEPS.has(step);
}

export function BattleTutorial({
  step,
  onContinue,
  onSkip,
}: {
  step: Exclude<BattleTutorialStep, null>;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const copy = COPY[step];
  const progress = lessonProgress(step);
  const isIntro = isTutorialIntroStep(step);
  const isCentered = isTutorialCenteredStep(step);
  const spotlight = useTutorialSpotlight(step);
  const titleId = `tutorial-title-${step}`;
  const bodyId = `tutorial-body-${step}`;
  const spotlightStyle = spotlight ? ({
    "--tutorial-spotlight-top": `${spotlight.top}px`,
    "--tutorial-spotlight-left": `${spotlight.left}px`,
    "--tutorial-spotlight-width": `${spotlight.width}px`,
    "--tutorial-spotlight-height": `${spotlight.height}px`,
  } as CSSProperties) : undefined;

  return (
    <>
      {spotlight ? <span className="tutorial-spotlight" style={spotlightStyle} aria-hidden="true" /> : <span className="tutorial-modal-scrim" aria-hidden="true" />}
      <aside
        className={`battle-tutorial-card tutorial-step-${step}${isCentered ? " is-centered" : " is-contextual"}`}
        data-tutorial-step={step}
        role={isCentered ? "dialog" : "status"}
        aria-modal={isCentered || undefined}
        aria-live={isCentered ? undefined : "polite"}
        aria-labelledby={titleId}
        aria-describedby={bodyId}
      >
        <div className="tutorial-progress" aria-label={`${progress.label}, step ${progress.current} of ${progress.total}`}>
          <span>{progress.label}</span>
          <b>{String(progress.current).padStart(2, "0")} / {String(progress.total).padStart(2, "0")}</b>
        </div>
        <header>
          <span className="tutorial-icon"><TutorialIcon kind={copy.icon} /></span>
          <h2 id={titleId}>{copy.title}</h2>
        </header>
        <strong className="tutorial-prompt">{copy.prompt}</strong>
        <p id={bodyId}>{copy.body}</p>
        <footer>
          {isIntro ? <button type="button" className="tutorial-skip" onClick={onSkip}>Skip training</button> : <span />}
          {copy.action ? (
            <button type="button" className="tutorial-continue" onClick={onContinue} autoFocus={isCentered}>
              {copy.action}<ArrowRight weight="bold" />
            </button>
          ) : <span className="tutorial-awaiting">{copy.awaiting ?? "Use the highlighted control"}</span>}
        </footer>
      </aside>
    </>
  );
}
