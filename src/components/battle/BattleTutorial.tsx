"use client";

import {
  ArrowRight,
  CheckCircle,
  Circuitry,
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
import { useModalFocusTrap } from "./useModalFocusTrap";

export type BattleTutorialStep =
  | "basics-intro"
  | "basics-select-guardian"
  | "basics-move-guardian"
  | "basics-choose-attack"
  | "basics-attack-rugger"
  | "basics-read-intent"
  | "basics-end-turn"
  | "basics-watch-enemy"
  | "basics-hit-explained"
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
  | "squad-shield-explained"
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
  | "hacker-intro"
  | "hacker-select-one"
  | "hacker-choose-jam"
  | "hacker-target-rugger"
  | "hacker-end-turn-one"
  | "hacker-watch-jam"
  | "hacker-jam-result"
  | "hacker-select-two"
  | "hacker-move-blackout"
  | "hacker-choose-blackout"
  | "hacker-target-sentinel"
  | "hacker-select-sniper"
  | "hacker-choose-attack"
  | "hacker-attack-rugger"
  | "hacker-end-turn-two"
  | "hacker-watch-blackout"
  | "hacker-complete"
  | null;

type TutorialIconKind = "shield" | "move" | "attack" | "target" | "intent" | "push" | "block" | "hack" | "warning" | "complete";

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
  "basics-hit-explained",
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
  "squad-shield-explained",
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

const HACKER_STEPS = [
  "hacker-intro",
  "hacker-select-one",
  "hacker-choose-jam",
  "hacker-target-rugger",
  "hacker-end-turn-one",
  "hacker-watch-jam",
  "hacker-jam-result",
  "hacker-select-two",
  "hacker-move-blackout",
  "hacker-choose-blackout",
  "hacker-target-sentinel",
  "hacker-select-sniper",
  "hacker-choose-attack",
  "hacker-attack-rugger",
  "hacker-end-turn-two",
  "hacker-watch-blackout",
  "hacker-complete",
] as const;

const LESSONS: readonly LessonMeta[] = [
  { label: "Chapter 1 / 3 · The Turn Loop", steps: BASICS_STEPS },
  { label: "Chapter 2 / 3 · Squad Tactics", steps: SQUAD_STEPS },
  { label: "Chapter 3 / 3 · Push Control", steps: PUSH_STEPS },
  { label: "Specialist Lab · System Control", steps: HACKER_STEPS },
];

const COPY: Record<Exclude<BattleTutorialStep, null>, TutorialCopy> = {
  "basics-intro": {
    title: "Learn the turn loop",
    prompt: "Move once—or stay put—then take one action.",
    body: "Red arrows show where enemies move. Dashed lines show who they hit and for how much.",
    action: "Start lesson",
    icon: "shield",
  },
  "basics-select-guardian": {
    title: "Choose a hero",
    prompt: "Select the highlighted Guardian.",
    body: "A hero activates once each turn. Start with the shield-bearing Guardian.",
    awaiting: "Click the highlighted hero",
    icon: "shield",
  },
  "basics-move-guardian": {
    title: "Move first",
    prompt: "Move Guardian to the highlighted tile.",
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
    prompt: "Attack the highlighted Rugger.",
    body: "Cyan marks a target in range. Attacking completes Guardian’s activation.",
    awaiting: "Click the highlighted enemy",
    icon: "target",
  },
  "basics-read-intent": {
    title: "Read the intent",
    prompt: "Your move rewrote the enemy plan.",
    body: "The badge is execution order. The red route ends in a dashed strike on Guardian for exactly 3 damage.",
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
    title: "Watch the attack",
    prompt: "Follow the Rugger from movement to impact.",
    body: "The attacker moves first, winds up, then the hit removes HP. The previewed route and target stay exact.",
    awaiting: "Enemy phase in progress",
    icon: "intent",
  },
  "basics-hit-explained": {
    title: "You were attacked",
    prompt: "Rugger moved, struck Guardian, and removed 3 HP.",
    body: "The red impact and −3 HP show the result. At 0 HP a hero is KO and leaves the board. Lose all three heroes and the mission fails.",
    action: "Finish chapter",
    icon: "warning",
  },
  "basics-complete": {
    title: "Turn loop complete",
    prompt: "Move, act, read, then commit.",
    body: "Chapter cleared. Return to training now, or start the next chapter whenever you are ready.",
    action: "Back to training",
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
    body: "This one-use ability gives Guardian and adjacent allies a 2-point shield that absorbs the next hit this enemy phase.",
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
    body: "Sniper fires 1–3 tiles in a cardinal line. Blast Barricades, the Vault and Data Block block sight.",
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
  "squad-shield-explained": {
    title: "The shield broke",
    prompt: "2 damage was blocked. Only 1 reached Guardian.",
    body: "A shield absorbs one hit, then expires. Cyan BLOCK is armor absorbed; the red number is HP actually lost.",
    action: "Finish chapter",
    icon: "shield",
  },
  "squad-complete": {
    title: "Squad tactics complete",
    prompt: "Position first. Spend abilities with purpose.",
    body: "Chapter cleared. Your progress is saved; continue with board control when you want.",
    action: "Back to training",
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
    prompt: "Inspect the highlighted breach tile.",
    body: "It is impassable now. A Whale will arrive there at the start of Turn 3.",
    action: "Continue",
    icon: "warning",
  },
  "push-select-collision": {
    title: "Choose Pusher again",
    prompt: "Select the highlighted Pusher.",
    body: "Now set up a blocked push to turn the terrain into a weapon.",
    awaiting: "Click the highlighted hero",
    icon: "push",
  },
  "push-move-to-collision": {
    title: "Use the terrain",
    prompt: "Move beside the highlighted Rugger.",
    body: "Direction does not matter: an enemy collides when its next attempted tile is a Blast Barricade, Data Block, unit, Vault or board edge.",
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
    body: "The CRASH preview means −1 HP now. A free Shove deals 0. One-use Batter Up attempts two tiles and deals −2 if either is blocked.",
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
    prompt: "Find the Whale on the breach tile.",
    body: "It moves one tile, then locks a cardinal cone for its next activation.",
    action: "Prepare",
    icon: "warning",
  },
  "push-select-for-whale": {
    title: "Hold your ground",
    prompt: "Select the highlighted Pusher.",
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
  "hacker-intro": {
    title: "Rewrite the enemy turn",
    prompt: "Jam weakens one exact activation. Blackout deletes one.",
    body: "Both hacks use a clear cardinal line at range 1-3 and ignore Interception Grid. Jam is reusable; Blackout has one mission charge.",
    action: "Start specialist lab",
    icon: "hack",
  },
  "hacker-select-one": {
    title: "Choose Hacker",
    prompt: "Select Hacker on D3.",
    body: "The Rugger currently plans to move to D2 and hit Hacker for exactly 3 damage.",
    awaiting: "Click the highlighted Hacker",
    icon: "hack",
  },
  "hacker-choose-jam": {
    title: "Open Jam",
    prompt: "Choose the reusable Jam action.",
    body: "Jam keeps the enemy's route and target, but reduces this activation's damage by 2.",
    awaiting: "Press 2 or click Jam",
    icon: "hack",
  },
  "hacker-target-rugger": {
    title: "Jam the threat",
    prompt: "Target the Rugger on D1.",
    body: "The preview will change from 3 to 1 damage before you commit the enemy phase.",
    awaiting: "Click the highlighted Rugger",
    icon: "target",
  },
  "hacker-end-turn-one": {
    title: "Read the rewrite",
    prompt: "The route is unchanged. The hit now reads 3 to 1 damage.",
    body: "Sniper stays ready on purpose: this phase isolates Jam so you can see its exact result.",
    awaiting: "Press Space or click End Turn",
    icon: "intent",
  },
  "hacker-watch-jam": {
    title: "Watch Jam resolve",
    prompt: "Follow the Rugger to D2 and watch the reduced hit.",
    body: "Jam lasts through this enemy's ordered activation, then clears automatically.",
    awaiting: "Enemy phase in progress",
    icon: "hack",
  },
  "hacker-jam-result": {
    title: "Damage rewritten",
    prompt: "Hacker lost 1 HP instead of 3.",
    body: "Jam is reusable every turn. The Sentinel now protects the Rugger on its horizontal grid.",
    action: "Try Blackout",
    icon: "complete",
  },
  "hacker-select-two": {
    title: "Set up Blackout",
    prompt: "Select Hacker again.",
    body: "Hacker can move first and still use either control action.",
    awaiting: "Click Hacker on D3",
    icon: "hack",
  },
  "hacker-move-blackout": {
    title: "Reach the controller",
    prompt: "Move Hacker to G3.",
    body: "From there, the Sentinel on G2 is one tile away in a clear cardinal line.",
    awaiting: "Click the highlighted G3 tile",
    icon: "move",
  },
  "hacker-choose-blackout": {
    title: "Spend Blackout",
    prompt: "Choose the one-charge Blackout ability.",
    body: "Blackout turns the target's next exact activation into HOLD: no move, attack, area or support effect.",
    awaiting: "Press 3 or click Blackout",
    icon: "hack",
  },
  "hacker-target-sentinel": {
    title: "Cut the grid",
    prompt: "Blackout the Sentinel on G2.",
    body: "Its amber guard lanes disappear immediately, before the enemy phase begins.",
    awaiting: "Click the highlighted Sentinel",
    icon: "target",
  },
  "hacker-select-sniper": {
    title: "Exploit the opening",
    prompt: "Select Sniper on A2.",
    body: "The Sentinel now previews HOLD. The Rugger no longer has an interceptor.",
    awaiting: "Click the highlighted Sniper",
    icon: "target",
  },
  "hacker-choose-attack": {
    title: "Take the clear shot",
    prompt: "Choose Attack.",
    body: "Sniper can reach D2 at exact cardinal range 3.",
    awaiting: "Press 2 or click Attack",
    icon: "attack",
  },
  "hacker-attack-rugger": {
    title: "Fire through the gap",
    prompt: "Attack the Rugger on D2.",
    body: "With the grid offline, all 3 damage lands on the intended target instead of the Sentinel.",
    awaiting: "Click the highlighted Rugger",
    icon: "target",
  },
  "hacker-end-turn-two": {
    title: "Commit the shutdown",
    prompt: "End the turn and watch HOLD resolve.",
    body: "The Rugger may still advance. The blacked-out Sentinel cannot move, guard or intercept this activation.",
    awaiting: "Press Space or click End Turn",
    icon: "intent",
  },
  "hacker-watch-blackout": {
    title: "Enemy system offline",
    prompt: "Watch the Sentinel lose its activation.",
    body: "Blackout is consumed only now, at the target's exact place in initiative order.",
    awaiting: "Enemy phase in progress",
    icon: "hack",
  },
  "hacker-complete": {
    title: "Hacker certified",
    prompt: "Weaken the hit, shut down support, exploit the opening.",
    body: "Jam is your repeatable safety valve. Save the single Blackout charge for the activation that would break your plan.",
    action: "Back to training",
    icon: "complete",
  },
  "training-complete": {
    title: "Training complete",
    prompt: "Protect the Vault for five turns.",
    body: "You know the turn loop, exact intents, line of sight, shields, Wait, collision and Whale interruption.",
    action: "Back to training",
    icon: "complete",
  },
};

const INTRO_STEPS = new Set<Exclude<BattleTutorialStep, null>>(["basics-intro", "squad-intro", "push-intro", "hacker-intro"]);

const OBSERVE_STEPS = new Set<Exclude<BattleTutorialStep, null>>([
  "basics-watch-enemy",
  "squad-watch-shield",
  "push-watch-charge",
  "hacker-watch-jam",
  "hacker-watch-blackout",
]);

const CENTERED_STEPS = new Set<Exclude<BattleTutorialStep, null>>([
  "basics-intro",
  "basics-hit-explained",
  "squad-intro",
  "squad-shield-explained",
  "push-intro",
  "push-breach-warning",
  "push-whale-arrives",
  "training-complete",
  "hacker-intro",
  "hacker-jam-result",
  "hacker-complete",
]);

function lessonProgress(step: Exclude<BattleTutorialStep, null>) {
  if (step === "training-complete") return { label: "Chapter 3 / 3 · Push Control", current: 4, total: 4, phase: "Complete" };
  const lesson = LESSONS.find((candidate) => candidate.steps.includes(step));
  if (!lesson) return { label: "Field training", current: 1, total: 1, phase: "Learn" };

  const phases = step.startsWith("basics-")
    ? [
        { name: "Move", through: "basics-move-guardian" },
        { name: "Attack", through: "basics-attack-rugger" },
        { name: "Plan", through: "basics-end-turn" },
        { name: "Resolve", through: "basics-hit-explained" },
      ]
    : step.startsWith("squad-")
      ? [
          { name: "Position", through: "squad-move-guardian" },
          { name: "Shield", through: "squad-shield-wall" },
          { name: "Deadeye", through: "squad-target-drainer" },
          { name: "Resolve", through: "squad-shield-explained" },
        ]
      : step.startsWith("push-")
        ? [
            { name: "Objects", through: "push-data-block" },
            { name: "Collision", through: "push-collision" },
            { name: "Charge", through: "push-locked-cone" },
            { name: "Interrupt", through: "push-cancel-whale" },
          ]
        : [
            { name: "Jam", through: "hacker-target-rugger" },
            { name: "Observe", through: "hacker-jam-result" },
            { name: "Blackout", through: "hacker-target-sentinel" },
            { name: "Exploit", through: "hacker-complete" },
          ];

  const stepIndex = lesson.steps.indexOf(step);
  const phaseIndex = phases.findIndex(({ through }) => stepIndex <= lesson.steps.indexOf(through as (typeof lesson.steps)[number]));
  const current = phaseIndex < 0 ? phases.length : phaseIndex + 1;
  return {
    label: lesson.label,
    current,
    total: phases.length,
    phase: phases[Math.max(0, current - 1)]?.name ?? phases.at(-1)?.name ?? "Learn",
  };
}

function TutorialIcon({ kind }: { kind: TutorialIconKind }) {
  if (kind === "move") return <Footprints weight="fill" />;
  if (kind === "attack") return <Sword weight="fill" />;
  if (kind === "target") return <Crosshair weight="fill" />;
  if (kind === "intent") return <Eye weight="fill" />;
  if (kind === "push") return <HandGrabbing weight="fill" />;
  if (kind === "block") return <Cube weight="fill" />;
  if (kind === "hack") return <Circuitry weight="fill" />;
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
  const isCentered = isTutorialCenteredStep(step);
  const isObserving = OBSERVE_STEPS.has(step);
  const dialogRef = useModalFocusTrap(isCentered);
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
      {!isObserving && (spotlight ? <span className="tutorial-spotlight" style={spotlightStyle} aria-hidden="true" /> : <span className="tutorial-modal-scrim" aria-hidden="true" />)}
      <aside
        ref={dialogRef}
        className={`battle-tutorial-card tutorial-step-${step}${isCentered ? " is-centered" : " is-contextual"}${isObserving ? " is-observing" : ""}`}
        data-tutorial-step={step}
        role={isCentered ? "dialog" : "status"}
        aria-modal={isCentered || undefined}
        aria-live={isCentered ? undefined : "polite"}
        aria-labelledby={titleId}
        aria-describedby={bodyId}
      >
        <div className="tutorial-progress" aria-label={`${progress.label}, phase ${progress.current} of ${progress.total}: ${progress.phase}`}>
          <span>{progress.label}</span>
          <b>Phase {String(progress.current).padStart(2, "0")} / {String(progress.total).padStart(2, "0")} · {progress.phase}</b>
        </div>
        <header>
          <span className="tutorial-icon"><TutorialIcon kind={copy.icon} /></span>
          <h2 id={titleId}>{copy.title}</h2>
        </header>
        <strong className="tutorial-prompt">{copy.prompt}</strong>
        <p id={bodyId}>{copy.body}</p>
        <footer>
          {step !== "training-complete" && step !== "hacker-complete" ? (
            <button
              type="button"
              className="tutorial-skip"
              onClick={onSkip}
              title="This chapter restarts if you leave before completing it."
            >
              Exit lesson
            </button>
          ) : <span />}
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
