"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowsOut,
  BookOpen,
  GameController,
  GearSix,
  Play,
  Warning,
  Wallet,
  X,
} from "@phosphor-icons/react";
import { useGameStore } from "@/store/gameStore";

export function TitleScreen() {
  const router = useRouter();
  const hydrated = useGameStore((state) => state.hydrated);
  const trainingCompleted = useGameStore((state) => state.settings.trainingCompleted);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [launchWarningOpen, setLaunchWarningOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const startMission = () => {
    setLaunchWarningOpen(false);
    router.push("/battle/protect-the-vault?intro=1&mission=protect-the-vault");
  };

  const play = () => {
    if (!hydrated) return;
    if (trainingCompleted < 3) {
      setLaunchWarningOpen(true);
      return;
    }
    startMission();
  };

  useEffect(() => {
    if (!hydrated || new URLSearchParams(window.location.search).get("launch") !== "mission") return;
    if (trainingCompleted < 3) {
      setLaunchWarningOpen(true);
      window.history.replaceState({}, "", "/");
    } else {
      router.replace("/battle/protect-the-vault?intro=1&mission=protect-the-vault");
    }
  }, [hydrated, router, trainingCompleted]);

  useEffect(() => {
    if (!optionsOpen && !launchWarningOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOptionsOpen(false);
      setLaunchWarningOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [launchWarningOpen, optionsOpen]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => undefined);
  };

  return (
    <main className={reducedMotion ? "title-screen reduce-title-motion" : "title-screen"}>
      <div className="title-backdrop" aria-hidden="true" />
      <div className="title-scanlines" aria-hidden="true" />
      <div className="title-ambient title-ambient-one" aria-hidden="true" />
      <div className="title-ambient title-ambient-two" aria-hidden="true" />

      <section className="title-content" aria-labelledby="game-title">
        <p className="title-kicker">A deterministic tactics game</p>
        <h1 id="game-title" className="title-logo">
          <span>Degen</span>
          <strong>Tactics</strong>
        </h1>
        <p className="title-tagline">Every move counts.</p>

        <div className="title-actions">
          <button type="button" className="title-button title-button-primary" onClick={play} disabled={!hydrated}>
            <Play weight="fill" aria-hidden="true" />
            <span>{hydrated ? "Play as Guest" : "Loading…"}<small>Protect the Vault</small></span>
          </button>
          <button type="button" className="title-button title-button-training" onClick={() => router.push("/training")} disabled={!hydrated}>
            <BookOpen weight="fill" aria-hidden="true" />
            <span>Field Training <small>{hydrated ? `${trainingCompleted} / 3 chapters cleared` : "Loading…"}</small></span>
          </button>
          <button type="button" className="title-button title-button-wallet" disabled title="Coming soon">
            <Wallet weight="fill" aria-hidden="true" />
            <span>Connect Wallet <small>Coming soon</small></span>
          </button>
          <button type="button" className="title-button title-button-options" onClick={() => setOptionsOpen(true)}>
            <GearSix weight="fill" aria-hidden="true" />
            <span>Options</span>
          </button>
        </div>

        <div className="guest-chip"><GameController weight="fill" aria-hidden="true" /> Guest mode · local progress</div>
      </section>

      <div className="title-hero" aria-hidden="true">
        <span className="title-hero-ring" />
        <Image src="/assets/sprites/guardian.png" alt="" fill priority sizes="(min-width: 1024px) 42vw, 70vw" className="title-hero-image" />
      </div>

      {optionsOpen ? (
        <div className="options-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOptionsOpen(false); }}>
          <section className="options-modal" role="dialog" aria-modal="true" aria-labelledby="options-title">
            <header>
              <div>
                <p>System</p>
                <h2 id="options-title">Options</h2>
              </div>
              <button type="button" onClick={() => setOptionsOpen(false)} aria-label="Close options"><X weight="bold" /></button>
            </header>
            <div className="options-list">
              <button type="button" className="option-row" onClick={() => setReducedMotion((value) => !value)} aria-pressed={reducedMotion}>
                <span><strong>Motion</strong><small>Menu ambience and UI pulses</small></span>
                <b>{reducedMotion ? "Reduced" : "On"}</b>
              </button>
              <button type="button" className="option-row" onClick={() => router.push("/training")}>
                <span><strong>Field training</strong><small>Choose a short chapter whenever you want</small></span>
                <b>{trainingCompleted} / 3</b>
              </button>
              <button type="button" className="option-row" onClick={toggleFullscreen}>
                <span><strong>Fullscreen</strong><small>Keyboard shortcut: F</small></span>
                <ArrowsOut weight="bold" />
              </button>
              <div className="option-controls">
                <strong>Battle controls</strong>
                <span>1 Move · 2 Attack · 3 Ability · S Shove · W Wait · Space End turn</span>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {launchWarningOpen ? (
        <div className="options-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLaunchWarningOpen(false); }}>
          <section className="options-modal launch-warning" role="dialog" aria-modal="true" aria-labelledby="launch-warning-title" data-training-launch-warning="true">
            <header>
              <div>
                <p>Before deployment</p>
                <h2 id="launch-warning-title">Training incomplete</h2>
              </div>
              <button type="button" onClick={() => setLaunchWarningOpen(false)} aria-label="Cancel mission launch"><X weight="bold" /></button>
            </header>
            <div className="launch-warning-body">
              <Warning weight="fill" aria-hidden="true" />
              <div>
                <strong>{trainingCompleted} of 3 chapters complete</strong>
                <p>You can deploy now, but the remaining chapters explain hero powers, collision pushes and the Whale charge.</p>
              </div>
            </div>
            <div className="launch-warning-actions">
              <button type="button" className="launch-continue" onClick={() => router.push("/training")} autoFocus>Continue training</button>
              <button type="button" className="launch-anyway" onClick={startMission}>Play mission anyway</button>
              <button type="button" className="launch-cancel" onClick={() => setLaunchWarningOpen(false)}>Cancel</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
