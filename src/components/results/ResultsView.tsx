"use client";

import Link from "next/link";
import {
  ArrowCounterClockwise,
  Crosshair,
  House,
  HourglassHigh,
  Lightning,
  ShieldCheck,
  Skull,
  Trophy,
  UsersThree,
} from "@phosphor-icons/react";
import type { MissionMedal, RankGoal } from "@/lib/game";

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
  medals: readonly MissionMedal[];
  rankGoal: RankGoal;
  breakdown: readonly Readonly<{ label: string; value: number }>[];
}

const medalIcon = (medal: MissionMedal) => {
  switch (medal.id) {
    case "vault-untouched":
      return <ShieldCheck weight="fill" aria-hidden="true" />;
    case "full-squad":
      return <UsersThree weight="fill" aria-hidden="true" />;
    case "charge-broken":
      return <Lightning weight="fill" aria-hidden="true" />;
  }
};

const formatScoreValue = (value: number) =>
  value > 0
    ? `+${value.toLocaleString()}`
    : value < 0
      ? `−${Math.abs(value).toLocaleString()}`
      : "—";

export function ResultsView({ result, onRetry }: { result: ResultsDisplayData; onRetry: () => void }) {
  const victory = result.outcome === "victory";
  const isBestRun = victory && result.bestScore > 0 && result.score >= result.bestScore;
  const earnedMedals = result.medals.filter((medal) => medal.earned).length;
  const rankProgress = result.rankGoal.nextRank === null
    ? "Highest rank achieved"
    : result.rankGoal.requiresVictory
      ? `Victory unlocks Rank ${result.rankGoal.nextRank}`
      : `${result.rankGoal.pointsNeeded.toLocaleString()} pts to Rank ${result.rankGoal.nextRank}`;

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
            {isBestRun ? <em>Run record</em> : null}
          </div>
        </div>

        <div className="result-progression" aria-label="Personal score progression">
          <span>Personal best <strong>{result.bestScore > 0 ? result.bestScore.toLocaleString() : "—"}</strong></span>
          <span>{rankProgress}</span>
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

        <div className="result-debrief">
          <section className="result-mastery" aria-labelledby="result-mastery-title">
            <header>
              <h2 id="result-mastery-title">Mission mastery</h2>
              <span>{earnedMedals} / {result.medals.length} medals</span>
            </header>
            <div className="result-medals">
              {result.medals.map((medal) => (
                <article key={medal.id} className={medal.earned ? "is-earned" : "is-locked"}>
                  <div className="result-medal-icon">{medalIcon(medal)}</div>
                  <div>
                    <strong>{medal.name}</strong>
                    <span>{medal.description}</span>
                  </div>
                  <em>{medal.earned ? "Earned" : "Missed"}</em>
                </article>
              ))}
            </div>
          </section>

          <section className="result-breakdown" aria-labelledby="result-breakdown-title">
            <header>
              <h2 id="result-breakdown-title">Score breakdown</h2>
              <strong>{result.score.toLocaleString()}</strong>
            </header>
            <dl>
              {result.breakdown.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd className={item.value < 0 ? "is-penalty" : undefined}>{formatScoreValue(item.value)}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

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
