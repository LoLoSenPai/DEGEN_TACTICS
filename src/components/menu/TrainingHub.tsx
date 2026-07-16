"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  LockKey,
  Play,
} from "@phosphor-icons/react";
import { getBattleHref, TRAINING_LESSONS, type TrainingMissionId } from "@/lib/game";
import { useGameStore } from "@/store/gameStore";

type ChapterDetail = {
  label: string;
  duration: string;
  sprite: string;
  skills: readonly string[];
};

const CHAPTER_DETAILS = {
  "training-basics": {
    label: "The Turn Loop",
    duration: "2 min",
    sprite: "/assets/sprites/guardian.png",
    skills: ["Move then act", "Exact intents", "Enemy attacks"],
  },
  "training-squad": {
    label: "Squad Turns",
    duration: "3 min",
    sprite: "/assets/sprites/sniper.png",
    skills: ["Hero order", "Shield Wall", "Deadeye & sight"],
  },
  "training-momentum": {
    label: "Push Control",
    duration: "5 min",
    sprite: "/assets/sprites/pusher.png",
    skills: ["Push objects", "Collision damage", "Interrupt the Whale"],
  },
  "training-override": {
    label: "Specialist Lab",
    duration: "4 min",
    sprite: "/assets/sprites/hacker.png",
    skills: ["Jam exact damage", "Blackout", "Break guard grids"],
  },
} as const satisfies Record<TrainingMissionId, ChapterDetail>;

export function TrainingHub() {
  const router = useRouter();
  const hydrated = useGameStore((state) => state.hydrated);
  const completed = useGameStore((state) => state.settings.trainingCompleted);

  const launchChapter = (missionId: TrainingMissionId) => {
    router.push(getBattleHref(missionId));
  };

  return (
    <main className="training-screen">
      <div className="training-backdrop" aria-hidden="true" />
      <div className="training-vignette" aria-hidden="true" />

      <header className="training-topbar">
        <Link href="/" className="training-back-link">
          <ArrowLeft weight="bold" aria-hidden="true" />
          Title
        </Link>
        <span className="training-system-label">Blacksite simulation deck</span>
      </header>

      <section className="training-shell" aria-labelledby="training-title">
        <div className="training-heading">
          <div>
            <p>Field training</p>
            <h1 id="training-title">Choose a chapter</h1>
            <span>Three short core simulations, plus one optional specialist lab for the Hacker.</span>
          </div>
          <div className="training-overall" aria-live="polite">
            <strong data-training-progress={hydrated ? Math.min(completed, 3) : 0}>{hydrated ? Math.min(completed, 3) : 0}<small>/3</small></strong>
            <div>
              <span>{hydrated ? (completed >= 4 ? "Core clear · Hacker certified" : `${Math.min(completed, 3)} core chapter${completed === 1 ? "" : "s"} complete`) : "Loading progress"}</span>
              <i aria-hidden="true">
                {[1, 2, 3].map((step) => <b key={step} className={hydrated && step <= completed ? "is-complete" : undefined} />)}
              </i>
            </div>
          </div>
        </div>

        <div className="training-chapter-grid" aria-busy={!hydrated}>
          {TRAINING_LESSONS.map((lesson) => {
            const detail = CHAPTER_DETAILS[lesson.missionId];
            const isComplete = hydrated && lesson.order <= completed;
            const isAvailable = hydrated && (isComplete || lesson.order === completed + 1);
            const isNext = hydrated && !isComplete && lesson.order === completed + 1;

            return (
              <article
                key={lesson.missionId}
                className={`training-chapter${lesson.order === 4 ? " is-specialist" : ""}${isComplete ? " is-complete" : isNext ? " is-next" : " is-locked"}`}
                aria-labelledby={`chapter-${lesson.order}-title`}
                data-training-chapter={lesson.missionId}
                data-training-status={isComplete ? "complete" : isNext ? "available" : "locked"}
              >
                <div className="training-chapter-art" aria-hidden="true">
                  <span className="training-chapter-number">0{lesson.order}</span>
                  <span className="training-piece-ring" />
                  <Image src={detail.sprite} alt="" fill sizes="(min-width: 960px) 320px, 80vw" />
                </div>

                <div className="training-chapter-copy">
                  <div className="training-chapter-meta">
                    <span>{lesson.order === 4 ? "Optional specialist" : `Chapter ${lesson.order}`} · {detail.label}</span>
                    <span><Clock weight="fill" aria-hidden="true" /> {detail.duration}</span>
                  </div>
                  <h2 id={`chapter-${lesson.order}-title`}>{lesson.title}</h2>
                  <p>{lesson.objective}</p>
                  <ul aria-label="Skills covered">
                    {detail.skills.map((skill) => <li key={skill}>{skill}</li>)}
                  </ul>
                </div>

                <footer>
                  <span className="training-chapter-status">
                    {isComplete ? <><CheckCircle weight="fill" /> Complete</> : isNext ? <><Play weight="fill" /> {lesson.order === 4 ? "Specialist lab" : "Up next"}</> : <><LockKey weight="fill" /> {lesson.order === 4 ? "Clear core training" : `Clear chapter ${lesson.order - 1}`}</>}
                  </span>
                  <button
                    type="button"
                    onClick={() => launchChapter(lesson.missionId)}
                    disabled={!isAvailable}
                    aria-label={`${isComplete ? "Replay" : "Play"} chapter ${lesson.order}: ${lesson.title}`}
                  >
                    {isComplete ? "Replay" : "Play chapter"}
                    {isAvailable ? <ArrowRight weight="bold" aria-hidden="true" /> : <LockKey weight="fill" aria-hidden="true" />}
                  </button>
                </footer>
              </article>
            );
          })}
        </div>

        <footer className="training-footer">
          <p>
            <strong>Ready for the real fight?</strong>
            You can leave training at any time. An unfinished chapter restarts from its first step when you return.
          </p>
          <Link href="/?launch=mission" className="training-mission-link">
            {hydrated && completed < 3 ? "Skip to mission" : "Play mission"}
            <Play weight="fill" aria-hidden="true" />
          </Link>
        </footer>
      </section>
    </main>
  );
}
