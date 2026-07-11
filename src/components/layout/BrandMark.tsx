import Link from "next/link";

type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <Link
      href="/"
      aria-label="Degen Tactics headquarters"
      className="group inline-flex items-center gap-3 rounded-md text-ink no-underline"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        className="h-11 w-11 shrink-0 drop-shadow-[3px_4px_0_rgba(73,43,22,0.3)] transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105"
      >
        <path d="M24 2 44 13.2v21.6L24 46 4 34.8V13.2L24 2Z" fill="#d59a22" stroke="#3c2a1d" strokeWidth="2.5" />
        <path d="m24 8 13.5 7.6v16.8L24 40l-13.5-7.6V15.6L24 8Z" fill="#2f8d77" stroke="#3c2a1d" strokeWidth="2" />
        <path d="M16 15h16v5H21v3h9v5h-9v5h11v-5h5v7H16V15Z" fill="#fbf1d3" stroke="#3c2a1d" strokeLinejoin="round" strokeWidth="0.8" />
        <path d="M11 11h8v2h-6v6h-2v-8Zm26 0v8h-2v-6h-6v-2h8ZM11 37v-8h2v6h6v2h-8Zm26 0h-8v-2h6v-6h2v8Z" fill="#fbf1d3" />
      </svg>
      <span className="flex flex-col">
        <span className="font-mono text-[11px] font-extrabold uppercase leading-none tracking-[0.24em] text-teal">
          Degen
        </span>
        <span className={`${compact ? "text-xl" : "text-2xl"} [font-family:var(--game-font-display)] uppercase leading-none tracking-[0.05em]`}>
          Tactics
        </span>
      </span>
    </Link>
  );
}
