"use client";

import Link from "next/link";
import {
  ArrowCounterClockwise,
  Crosshair,
  House,
  HourglassHigh,
  ShieldCheck,
  Skull,
  Trophy,
  UsersThree,
} from "@phosphor-icons/react";

export interface ResultsDisplayData {
  outcome: "victory" | "defeat";
  score: number;
  rank: "S" | "A" | "B" | "C";
  vaultHp: number;
  vaultMaxHp: number;
  turnsSurvived: number;
  enemiesDefeated: number;
  unitsLost: number;
  bestScore: number;
  breakdown: Array<{ label: string; value: number }>;
}

export function ResultsView({ result, onRetry }: { result: ResultsDisplayData; onRetry: () => void }) {
  const victory = result.outcome === "victory";
  const isBestRun = victory && result.bestScore > 0 && result.score >= result.bestScore;

  return (
    <main className={`game-results ${victory ? "is-victory" : "is-defeat"}`}>
      <div className="result-stage">
        <div className="result-game-mark" aria-label="Degen Tactics">
          <span>DEGEN</span>
          <small>TACTICS</small>
        </div>

        <div className="result-emblem" aria-hidden="true">
          {victory ? <Trophy size={74} weight="fill" /> : <Skull size={74} weight="fill" />}
        </div>

        <p className="result-kicker">Protect the Vault</p>
        <h1 className="result-title">{victory ? "Victory" : "Defeat"}</h1>
        <p className="result-message">
          {victory ? "The Vault held. Extraction complete." : "The line broke. Get back in there."}
        </p>

        <div className="result-rank-score" aria-label={`Rank ${result.rank}, final score ${result.score}`}>
          <div className="result-rank">
            <span>Rank</span>
            <strong>{result.rank}</strong>
          </div>
          <div className="result-score">
            <span>Final score</span>
            <strong>{result.score.toLocaleString()}</strong>
            {isBestRun ? <em>New best</em> : null}
          </div>
        </div>

        <dl className="result-stats">
          <div>
            <ShieldCheck weight="fill" aria-hidden="true" />
            <dt>Vault</dt>
            <dd>{Math.max(0, result.vaultHp)} / {result.vaultMaxHp}</dd>
          </div>
          <div>
            <HourglassHigh weight="fill" aria-hidden="true" />
            <dt>Turns</dt>
            <dd>{result.turnsSurvived} / 5</dd>
          </div>
          <div>
            <Crosshair weight="bold" aria-hidden="true" />
            <dt>Kills</dt>
            <dd>{result.enemiesDefeated}</dd>
          </div>
          <div>
            <UsersThree weight="fill" aria-hidden="true" />
            <dt>Losses</dt>
            <dd>{result.unitsLost}</dd>
          </div>
        </dl>

        <div className="result-actions">
          <button type="button" className="result-button result-retry" onClick={onRetry}>
            <ArrowCounterClockwise size={25} weight="bold" aria-hidden="true" />
            Retry
          </button>
          <Link className="result-button result-home" href="/">
            <House size={25} weight="fill" aria-hidden="true" />
            Title screen
          </Link>
        </div>
      </div>
    </main>
  );
}
