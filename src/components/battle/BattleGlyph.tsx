import clsx from "clsx";

type GlyphKind =
  | "guardian"
  | "sniper"
  | "pusher"
  | "rugger"
  | "drainer"
  | "whale"
  | "vault"
  | "data-block";

interface BattleGlyphProps {
  kind: GlyphKind;
  className?: string;
}

export function BattleGlyph({ kind, className }: BattleGlyphProps) {
  const shared = {
    className: clsx("h-full w-full", className),
    viewBox: "0 0 48 48",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  } as const;

  if (kind === "guardian") {
    return (
      <svg {...shared}>
        <path d="M24 4 39 11v13c0 10-6 16-15 20C15 40 9 34 9 24V11L24 4Z" fill="currentColor" opacity=".18" />
        <path d="M24 7 36 13v11c0 8-4.8 13-12 16.4C16.8 37 12 32 12 24V13L24 7Z" stroke="currentColor" strokeWidth="2.5" />
        <path d="M18 24h12M24 18v12" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
      </svg>
    );
  }

  if (kind === "sniper") {
    return (
      <svg {...shared}>
        <circle cx="24" cy="24" r="15" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="24" cy="24" r="5" fill="currentColor" />
        <path d="M24 4v10M24 34v10M4 24h10M34 24h10" stroke="currentColor" strokeWidth="2.5" />
      </svg>
    );
  }

  if (kind === "pusher") {
    return (
      <svg {...shared}>
        <path d="m8 24 9-13h13l10 13-10 13H17L8 24Z" stroke="currentColor" strokeWidth="2.5" />
        <path d="M13 24h21m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
      </svg>
    );
  }

  if (kind === "rugger") {
    return (
      <svg {...shared}>
        <path d="M7 35 13 9l11 8L35 9l6 26-17 9L7 35Z" fill="currentColor" opacity=".22" />
        <path d="M9 34 14 12l10 8 10-8 5 22-15 7-15-7Z" stroke="currentColor" strokeWidth="2.5" />
        <path d="m17 29 7-5 7 5" stroke="currentColor" strokeWidth="3" />
      </svg>
    );
  }

  if (kind === "drainer") {
    return (
      <svg {...shared}>
        <path d="M28 5c0 9-11 12-11 23a9 9 0 0 0 18 0c0-7-7-11-7-23Z" fill="currentColor" opacity=".22" />
        <path d="M28 6c0 9-11 12-11 22a9 9 0 1 0 18 0c0-7-7-11-7-22Z" stroke="currentColor" strokeWidth="2.5" />
        <path d="M23 29c0 4 5 5 7 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === "whale") {
    return (
      <svg {...shared}>
        <path d="M7 27c3-10 11-15 22-14 2-4 6-7 12-7-1 5-3 8-7 10 5 2 8 6 9 11-7 9-24 12-36 0Z" fill="currentColor" opacity=".25" />
        <path d="M7 27c3-10 11-15 22-14 2-4 6-7 12-7-1 5-3 8-7 10 5 2 8 6 9 11-7 9-24 12-36 0Z" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="31" cy="22" r="2" fill="currentColor" />
        <path d="M11 31c9 3 19 2 27-3" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (kind === "vault") {
    return (
      <svg {...shared}>
        <path d="M24 5 41 14v20L24 43 7 34V14L24 5Z" fill="currentColor" opacity=".2" />
        <path d="M24 7 39 15v18l-15 8-15-8V15l15-8Z" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="24" cy="24" r="3" fill="currentColor" />
        <path d="M24 16v4m0 8v4m-8-8h4m8 0h4" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg {...shared}>
      <rect x="8" y="8" width="32" height="32" rx="3" fill="currentColor" opacity=".16" />
      <path d="M9 16h30M9 32h30M16 9v30M32 9v30" stroke="currentColor" strokeWidth="2" />
      <path d="m17 24 5 5 10-11" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

export function HealthBar({ current, max, tone = "ally" }: { current: number; max: number; tone?: "ally" | "enemy" | "vault" }) {
  const percent = max <= 0 ? 0 : Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-black/45" aria-label={`${current} of ${max} integrity`}>
      <div
        className={clsx("h-full rounded-full transition-[width] duration-300", tone === "ally" && "bg-teal", tone === "enemy" && "bg-danger", tone === "vault" && "bg-violet")}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
