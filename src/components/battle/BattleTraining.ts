import {
  TRAINING_BASICS,
  TRAINING_MOMENTUM,
  TRAINING_SQUAD,
  type TrainingMissionId,
} from "@/lib/game";
import type { BattleTutorialStep } from "@/components/battle/BattleTutorial";

export type TutorialAction = "attack" | "ability" | "push" | "wait" | "end-turn";

const COORDINATE_TARGETS: Partial<Record<Exclude<BattleTutorialStep, null>, string>> = {
  "basics-select-guardian": "D4",
  "basics-move-guardian": "D2",
  "basics-attack-rugger": "D1",
  "squad-select-guardian": "D4",
  "squad-move-guardian": "D3",
  "squad-select-sniper": "C3",
  "squad-target-drainer": "C1",
  "push-select-pusher": "F6",
  "push-move-to-block": "E6",
  "push-data-block": "D6",
  "push-breach-warning": "G4",
  "push-select-collision": "E6",
  "push-move-to-collision": "E5",
  "push-collision": "E4",
  "push-whale-arrives": "G4",
  "push-select-for-whale": "E5",
  "push-move-for-whale": "F5",
  "push-watch-charge": "F4",
  "push-locked-cone": "F4",
  "push-select-charging": "E5",
  "push-cancel-whale": "F4",
};

const ACTION_TARGETS: Partial<Record<Exclude<BattleTutorialStep, null>, TutorialAction>> = {
  "basics-choose-attack": "attack",
  "basics-end-turn": "end-turn",
  "squad-shield-wall": "ability",
  "squad-deadeye": "ability",
  "squad-end-turn": "end-turn",
  "push-choose-shove-block": "push",
  "push-end-turn-one": "end-turn",
  "push-choose-shove-enemy": "push",
  "push-end-turn-two": "end-turn",
  "push-wait": "wait",
  "push-end-turn-three": "end-turn",
  "push-choose-shove-whale": "push",
};

export const tutorialCoordinate = (step: BattleTutorialStep) =>
  step ? COORDINATE_TARGETS[step] ?? null : null;

export const tutorialAction = (step: BattleTutorialStep) =>
  step ? ACTION_TARGETS[step] ?? null : null;

export const tutorialRestrictsInput = (step: BattleTutorialStep) => step !== null;

export const initialTutorialStep = (missionId: string): BattleTutorialStep => {
  if (missionId === TRAINING_BASICS.id) return "basics-intro";
  if (missionId === TRAINING_SQUAD.id) return "squad-intro";
  if (missionId === TRAINING_MOMENTUM.id) return "push-intro";
  return null;
};

export const trainingLessonForMission = (missionId: string): 1 | 2 | 3 | null => {
  if (missionId === TRAINING_BASICS.id) return 1;
  if (missionId === TRAINING_SQUAD.id) return 2;
  if (missionId === TRAINING_MOMENTUM.id) return 3;
  return null;
};

export const trainingMissionForProgress = (completed: 0 | 1 | 2 | 3): TrainingMissionId | null => {
  if (completed === 0) return TRAINING_BASICS.id;
  if (completed === 1) return TRAINING_SQUAD.id;
  if (completed === 2) return TRAINING_MOMENTUM.id;
  return null;
};
