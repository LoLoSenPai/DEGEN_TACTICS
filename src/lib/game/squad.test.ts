import { describe, expect, it } from "vitest";
import { calculateEnemyPlan, createInitialGameState, getStateFingerprint } from "./engine";
import { BREAK_THE_BREACH, DATA_EXTRACTION, PROTECT_THE_VAULT } from "./mission";
import {
  DEFAULT_SQUAD,
  getRequiredSquadRoles,
  isAllowedSquadSelection,
  resolveMissionSquad,
  sanitizeSquadSelections,
} from "./squad";
import type { MissionDefinition, UnitRole } from "./types";

describe("operation squad selection", () => {
  it("preserves the authored trio when no selection is supplied", () => {
    const state = createInitialGameState(PROTECT_THE_VAULT);
    expect(state.units.map((unit) => unit.role)).toEqual(DEFAULT_SQUAD);
    expect(state.units.map((unit) => unit.position)).toEqual(PROTECT_THE_VAULT.units.map((unit) => unit.position));
    expect(state.initialSquadSize).toBe(3);
  });

  it("deploys Hacker at an authored unique spawn and canonicalizes click order", () => {
    const first = createInitialGameState(PROTECT_THE_VAULT, ["hacker", "guardian", "sniper"]);
    const second = createInitialGameState(PROTECT_THE_VAULT, ["sniper", "hacker", "guardian"]);

    expect(first.units.map((unit) => unit.role)).toEqual(["guardian", "sniper", "hacker"]);
    expect(first.units.find((unit) => unit.role === "hacker")?.position).toEqual({ x: 4, y: 5 });
    expect(new Set(first.units.map((unit) => `${unit.position.x},${unit.position.y}`)).size).toBe(3);
    expect(getStateFingerprint(first)).toBe(getStateFingerprint(second));
    expect(JSON.stringify(calculateEnemyPlan(first))).toBe(JSON.stringify(calculateEnemyPlan(second)));
  });

  it("allows only authored compositions and exposes mission-required roles", () => {
    expect(getRequiredSquadRoles(PROTECT_THE_VAULT)).toEqual([]);
    expect(getRequiredSquadRoles(DATA_EXTRACTION)).toEqual(["pusher"]);
    expect(getRequiredSquadRoles(BREAK_THE_BREACH)).toEqual(["guardian", "sniper", "pusher"]);

    expect(isAllowedSquadSelection(DATA_EXTRACTION, ["sniper", "pusher", "hacker"])).toBe(true);
    expect(isAllowedSquadSelection(DATA_EXTRACTION, ["guardian", "sniper", "hacker"])).toBe(false);
    expect(isAllowedSquadSelection(BREAK_THE_BREACH, ["guardian", "pusher", "hacker"])).toBe(false);
  });

  it("rejects duplicates, unknown roles, wrong sizes, and forbidden teams", () => {
    const invalidSelections: readonly (readonly UnitRole[])[] = [
      ["guardian", "guardian", "pusher"],
      ["guardian", "sniper"],
      ["guardian", "sniper", "pusher", "hacker"],
      ["guardian", "sniper", "unknown" as UnitRole],
      ["guardian", "sniper", "hacker"],
    ];

    for (const selection of invalidSelections) {
      expect(() => resolveMissionSquad(DATA_EXTRACTION, selection)).toThrow(/not allowed/);
    }
  });

  it("keeps every allowed operation spawn legal and deterministic", () => {
    const operations = [PROTECT_THE_VAULT, DATA_EXTRACTION, BREAK_THE_BREACH] as readonly MissionDefinition[];
    for (const operation of operations) {
      for (const composition of operation.squad?.allowedCompositions ?? []) {
        const state = createInitialGameState(operation, composition);
        const replay = createInitialGameState(operation, [...composition].reverse());
        expect(state.units).toHaveLength(3);
        expect(state.initialSquadSize).toBe(3);
        expect(getStateFingerprint(state)).toBe(getStateFingerprint(replay));
        expect(JSON.stringify(calculateEnemyPlan(state))).toBe(JSON.stringify(calculateEnemyPlan(replay)));
      }
    }
  });

  it("sanitizes persisted squads without blocking startup", () => {
    expect(sanitizeSquadSelections({
      "protect-the-vault": ["hacker", "guardian", "sniper"],
      "data-extraction": ["guardian", "sniper", "hacker"],
      "break-the-breach": ["guardian", "sniper", "pusher"],
      "training-override": ["guardian", "sniper", "pusher"],
      unknown: ["guardian", "sniper", "pusher"],
    })).toEqual({
      "protect-the-vault": ["guardian", "sniper", "hacker"],
      "break-the-breach": ["guardian", "sniper", "pusher"],
    });
    expect(sanitizeSquadSelections(null)).toEqual({});
    expect(sanitizeSquadSelections(["guardian", "sniper", "pusher"])).toEqual({});
  });
});
