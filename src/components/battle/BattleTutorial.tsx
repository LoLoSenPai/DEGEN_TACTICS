"use client";

import { ArrowRight, Crosshair, Eye, Footprints, Shield, Sword } from "@phosphor-icons/react";

export type BattleTutorialStep =
  | "welcome"
  | "select-guardian"
  | "move-guardian"
  | "choose-attack"
  | "attack-rugger"
  | "read-intents"
  | "end-turn"
  | "watch-enemy"
  | "complete"
  | null;

type TutorialCopy = {
  eyebrow: string;
  title: string;
  body: string;
  prompt: string;
  action?: string;
  icon: "shield" | "move" | "attack" | "target" | "intent";
};

const COPY: Record<Exclude<BattleTutorialStep, null>, TutorialCopy> = {
  welcome: {
    eyebrow: "Field training // 01",
    title: "Every move counts",
    body: "Keep the Vault alive through five enemy phases. Red routes are exact: change your position and the enemy plan changes with you.",
    prompt: "One move, then one action, per hero.",
    action: "Begin training",
    icon: "shield",
  },
  "select-guardian": {
    eyebrow: "Field training // 02",
    title: "Select Guardian",
    body: "Each hero activates once per turn. Start with the shield-bearing Guardian in the center lane.",
    prompt: "Click Guardian at D3.",
    icon: "shield",
  },
  "move-guardian": {
    eyebrow: "Field training // 03",
    title: "Take the lane",
    body: "Guardian may move up to two orthogonal tiles. Move beside the Rugger before taking an action.",
    prompt: "Click the highlighted D2 tile.",
    icon: "move",
  },
  "choose-attack": {
    eyebrow: "Field training // 04",
    title: "Choose an action",
    body: "Movement is spent, but Guardian can still act. Attacking or using an ability completes this hero's activation.",
    prompt: "Press 2 or click Attack.",
    icon: "attack",
  },
  "attack-rugger": {
    eyebrow: "Field training // 05",
    title: "Strike the blocker",
    body: "Targets in range glow cyan. Damage the Rugger now so it cannot pressure the Vault for free.",
    prompt: "Click the Rugger at D1.",
    icon: "target",
  },
  "read-intents": {
    eyebrow: "Field training // 06",
    title: "Read the board",
    body: "Red arrows are promises, not guesses. Enemies resolve in numbered order using the exact paths and targets shown now.",
    prompt: "Planning around those promises is where mastery begins.",
    action: "I see the plan",
    icon: "intent",
  },
  "end-turn": {
    eyebrow: "Field training // 07",
    title: "Commit the plan",
    body: "Ending the turn locks this preview and resolves the enemy phase. Nothing will secretly retarget.",
    prompt: "Press Space or click End Turn.",
    icon: "intent",
  },
  "watch-enemy": {
    eyebrow: "Enemy phase",
    title: "Watch the order",
    body: "The numbered enemies now execute the same plan you just inspected.",
    prompt: "Controls unlock when the next player phase begins.",
    icon: "intent",
  },
  complete: {
    eyebrow: "Training complete",
    title: "You're in command",
    body: "Reposition to rewrite enemy plans. Abilities, pushes, collision damage and the incoming Whale create the deeper puzzle.",
    prompt: "Easy to read. Hard to solve perfectly.",
    action: "Take command",
    icon: "shield",
  },
};

function TutorialIcon({ kind }: { kind: TutorialCopy["icon"] }) {
  if (kind === "move") return <Footprints weight="fill" />;
  if (kind === "attack") return <Sword weight="fill" />;
  if (kind === "target") return <Crosshair weight="fill" />;
  if (kind === "intent") return <Eye weight="fill" />;
  return <Shield weight="fill" />;
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

  return (
    <aside className={`battle-tutorial-card tutorial-step-${step}`} data-tutorial-step={step} aria-live="polite" aria-label="Interactive combat tutorial">
      <header>
        <span className="tutorial-icon"><TutorialIcon kind={copy.icon} /></span>
        <div><small>{copy.eyebrow}</small><h2>{copy.title}</h2></div>
      </header>
      <p>{copy.body}</p>
      <strong className="tutorial-prompt">{copy.prompt}</strong>
      <footer>
        {step !== "complete" ? <button type="button" className="tutorial-skip" onClick={onSkip}>Skip tutorial</button> : <span />}
        {copy.action ? (
          <button type="button" className="tutorial-continue" onClick={onContinue}>
            {copy.action}<ArrowRight weight="bold" />
          </button>
        ) : <span className="tutorial-awaiting">Waiting for your move…</span>}
      </footer>
    </aside>
  );
}
