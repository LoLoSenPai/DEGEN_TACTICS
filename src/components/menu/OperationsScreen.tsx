"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, LockKey, Play, Trophy } from "@phosphor-icons/react";
import {
  getBattleHref,
  getNextOperationId,
  isOperationUnlocked,
  PLAYABLE_OPERATIONS,
} from "@/lib/game";
import { useGameStore } from "@/store/gameStore";

const OPERATION_ART = {
  "protect-the-vault": {
    hero: "/assets/sprites/guardian.png",
    prop: "/assets/sprites/vault.png",
    className: "operation-poster-vault",
  },
  "data-extraction": {
    hero: "/assets/sprites/sentinel.png",
    prop: "/assets/sprites/data-block.png",
    className: "operation-poster-data",
  },
  "break-the-breach": {
    hero: "/assets/sprites/whale.png",
    prop: "/assets/sprites/vault.png",
    support: "/assets/sprites/data-block.png",
    className: "operation-poster-breach",
  },
} as const;

export function OperationsScreen() {
  const hydrated = useGameStore((state) => state.hydrated);
  const completedMissionIds = useGameStore((state) => state.completedMissionIds);
  const bestScores = useGameStore((state) => state.bestScores);
  const nextOperationId = getNextOperationId(completedMissionIds);
  const clearedOperationCount = PLAYABLE_OPERATIONS.filter((operation) =>
    completedMissionIds.includes(operation.id),
  ).length;

  return (
    <main className="operations-screen">
      <div className="operations-backdrop" aria-hidden="true" />
      <div className="operations-scanlines" aria-hidden="true" />

      <header className="operations-header">
        <Link href="/" className="operations-back" aria-label="Back to title screen">
          <ArrowLeft weight="bold" aria-hidden="true" />
          Title
        </Link>
        <div className="operations-heading">
          <p>Fracture Zone // Field Operations</p>
          <h1>Choose your operation</h1>
          <span>{hydrated ? `${clearedOperationCount} / ${PLAYABLE_OPERATIONS.length} cleared` : "Loading field data…"}</span>
        </div>
        <div className="operations-next" aria-live="polite">
          <small>Next deployment</small>
          <strong>{PLAYABLE_OPERATIONS.find((operation) => operation.id === nextOperationId)?.title}</strong>
        </div>
      </header>

      <section className="operation-posters" aria-label="Available operations">
        {PLAYABLE_OPERATIONS.map((operation) => {
          const unlocked = hydrated && isOperationUnlocked(operation.id, completedMissionIds);
          const completed = completedMissionIds.includes(operation.id);
          const highlighted = operation.id === nextOperationId;
          const art = OPERATION_ART[operation.id];
          const score = bestScores[operation.id] ?? 0;
          const unlockAfter = "unlockAfter" in operation ? operation.unlockAfter : null;
          const unlockOperation = unlockAfter
            ? PLAYABLE_OPERATIONS.find((candidate) => candidate.id === unlockAfter)
            : null;

          return (
            <article
              key={operation.id}
              className={`operation-poster ${art.className}${unlocked ? " is-unlocked" : " is-locked"}${highlighted ? " is-next" : ""}`}
              data-operation-id={operation.id}
              data-operation-unlocked={unlocked}
            >
              <div className="operation-poster-grid" aria-hidden="true" />
              <div className="operation-number" aria-hidden="true">0{operation.order}</div>
              <div className="operation-art" aria-hidden="true">
                <span className="operation-art-ring" />
                <Image className="operation-art-prop" src={art.prop} alt="" width={320} height={320} />
                <Image className="operation-art-hero" src={art.hero} alt="" width={640} height={640} />
                {"support" in art ? <Image className="operation-art-support" src={art.support} alt="" width={320} height={320} /> : null}
              </div>

              <div className="operation-poster-copy">
                <div className="operation-status">
                  <span>{operation.eyebrow}</span>
                  {completed ? <b><Check weight="bold" /> Cleared</b> : unlocked ? <b>Ready</b> : <b><LockKey weight="fill" /> Locked</b>}
                </div>
                <h2>{operation.title}</h2>
                <p>{operation.shortObjective}</p>
                {score > 0 ? <div className="operation-best"><Trophy weight="fill" /> Best {score.toLocaleString("en-US")}</div> : null}
              </div>

              {unlocked ? (
                <Link
                  className="operation-deploy"
                  href={getBattleHref(operation.id)}
                  aria-label={`${completed ? "Replay" : highlighted ? "Deploy" : "Play"} ${operation.title}`}
                >
                  <Play weight="fill" aria-hidden="true" />
                  {completed ? "Replay" : highlighted ? "Deploy" : "Play"}
                </Link>
              ) : (
                <div className="operation-lock-copy">
                  <LockKey weight="fill" aria-hidden="true" />
                  Clear {unlockOperation?.eyebrow ?? "previous operation"}
                </div>
              )}
            </article>
          );
        })}
      </section>

      <footer className="operations-footer">
        <span>One squad. Exact enemy intents. No random rolls.</span>
        <Link href="/training">Need a refresher? Field Training</Link>
      </footer>
    </main>
  );
}
