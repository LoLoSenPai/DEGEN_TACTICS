"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowsOut,
  GameController,
  GearSix,
  Play,
  Wallet,
  X,
} from "@phosphor-icons/react";
import { useGameStore } from "@/store/gameStore";

export function TitleScreen() {
  const router = useRouter();
  const hydrated = useGameStore((state) => state.hydrated);
  const startMission = useGameStore((state) => state.startMission);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const play = () => {
    startMission();
    router.push("/battle/protect-the-vault?intro=1");
  };

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
            <span>{hydrated ? "Play as Guest" : "Loading…"}</span>
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
              <button type="button" className="option-row" onClick={toggleFullscreen}>
                <span><strong>Fullscreen</strong><small>Keyboard shortcut: F</small></span>
                <ArrowsOut weight="bold" />
              </button>
              <div className="option-controls">
                <strong>Battle controls</strong>
                <span>1 Move · 2 Attack · 3 Ability · Space End turn · Esc Cancel</span>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
