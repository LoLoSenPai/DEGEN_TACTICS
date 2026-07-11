export function MissionDiorama() {
  return (
    <div className="relative isolate min-h-[410px] overflow-hidden border border-line bg-surface-0 sm:min-h-[500px] lg:min-h-[570px]">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-line bg-surface-1/95 px-4 py-3 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-muted sm:px-5">
        <span>Live tactical projection</span>
        <span className="flex items-center gap-2 text-teal">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
          District 07
        </span>
      </div>

      <svg
        role="img"
        aria-label="Tactical projection of the Vault District with three allied units defending the central vault"
        viewBox="0 0 640 560"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <pattern id="hq-grid" width="52" height="52" patternUnits="userSpaceOnUse">
            <path d="M52 0H0v52" fill="none" stroke="#2a3945" strokeOpacity=".48" />
            <circle cx="1" cy="1" r="1" fill="#405362" />
          </pattern>
          <filter id="hq-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        <rect width="640" height="560" fill="#0b1016" />
        <rect y="48" width="640" height="512" fill="url(#hq-grid)" />
        <path d="m-30 470 170-116 99 50 146-142 97 47 190-146" fill="none" stroke="#17222c" strokeWidth="34" />
        <path d="m-30 470 170-116 99 50 146-142 97 47 190-146" fill="none" stroke="#405362" strokeDasharray="7 13" strokeWidth="2" />

        <g opacity=".55" fill="#17222c" stroke="#405362">
          <path d="M27 98h105v70H27zM506 87h91v112h-91zM55 401h92v111H55zM475 423h122v83H475z" />
          <path d="m164 87 74 0 0 88-74 0zM381 371h65v98h-65z" />
        </g>

        <g transform="translate(318 285)">
          <circle r="82" fill="#9a7cff" opacity=".08" filter="url(#hq-glow)" />
          <circle r="67" fill="none" stroke="#9a7cff" strokeOpacity=".2" strokeDasharray="4 9" />
          <path d="M0-49 43-25v50L0 49-43 25v-50L0-49Z" fill="#151529" stroke="#9a7cff" strokeWidth="2.5" />
          <path d="M0-32 27-16v32L0 32-27 16v-32L0-32Z" fill="#9a7cff" fillOpacity=".16" stroke="#c173ff" />
          <path d="M-9-11 0-19l9 8v22l-9 8-9-8v-22Z" fill="#eef3f2" />
          <path d="M-18 2h36M0-19v38" stroke="#9a7cff" strokeWidth="2" />
          <text x="0" y="72" fill="#b7c3c7" textAnchor="middle" fontFamily="monospace" fontSize="10" letterSpacing="2">VAULT // 10 HP</text>
        </g>

        <g transform="translate(219 249)">
          <circle r="26" fill="#101821" stroke="#42d6b3" strokeWidth="2" />
          <path d="m0-13 11 6v14L0 13-11 7V-7L0-13Z" fill="#42d6b3" fillOpacity=".15" stroke="#eef3f2" />
          <path d="M0-8v16M-8 0h16" stroke="#eef3f2" strokeWidth="2" />
          <path d="M25 0h52" stroke="#42d6b3" strokeDasharray="3 5" />
          <text x="-32" y="4" fill="#42d6b3" textAnchor="end" fontFamily="monospace" fontSize="9">GDN</text>
        </g>

        <g transform="translate(295 405)">
          <circle r="24" fill="#101821" stroke="#59bfff" strokeWidth="2" />
          <circle r="9" fill="none" stroke="#eef3f2" strokeWidth="2" />
          <path d="M0-16v8M0 8v16M-16 0h8M8 0h16" stroke="#eef3f2" strokeWidth="2" />
          <path d="M8-21 19-44" stroke="#59bfff" strokeDasharray="3 4" />
          <text x="0" y="41" fill="#59bfff" textAnchor="middle" fontFamily="monospace" fontSize="9">SNP</text>
        </g>

        <g transform="translate(424 329)">
          <circle r="25" fill="#101821" stroke="#f2c75c" strokeWidth="2" />
          <path d="M-12-5h17v-8L17 0 5 13V5h-17V-5Z" fill="#eef3f2" />
          <path d="M-24 0h-40" stroke="#f2c75c" strokeDasharray="3 5" />
          <text x="34" y="4" fill="#f2c75c" fontFamily="monospace" fontSize="9">PSH</text>
        </g>

        <g opacity=".88">
          <path d="M319 111 336 121v20l-17 10-17-10v-20l17-10Z" fill="#281319" stroke="#ff626b" />
          <path d="m319 118 10 17h-20l10-17Z" fill="#ff626b" />
          <path d="M544 341 561 351v20l-17 10-17-10v-20l17-10Z" fill="#281319" stroke="#ff626b" />
          <path d="m544 348 10 17h-20l10-17Z" fill="#ff626b" />
          <path d="M144 187 159 196v18l-15 9-15-9v-18l15-9Z" fill="#21152b" stroke="#c173ff" />
          <path d="M137 195h14l-7 19-7-19Z" fill="#c173ff" />
        </g>

        <path d="M319 151v51M533 368l-56-20M159 211l44 23" fill="none" stroke="#ff626b" strokeOpacity=".62" strokeDasharray="5 7" />

        <g transform="translate(24 526)" fontFamily="monospace" fontSize="9">
          <rect width="212" height="22" fill="#101821" stroke="#2a3945" />
          <circle cx="13" cy="11" r="3" fill="#ff626b" />
          <text x="25" y="14" fill="#b7c3c7" letterSpacing="1.2">3 HOSTILES TRACKED</text>
        </g>
      </svg>

      <div className="absolute bottom-4 right-4 z-10 border border-[var(--line-bright)] bg-surface-1 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--ink-soft)] shadow-xl sm:bottom-5 sm:right-5">
        <span className="mr-2 text-violet">◆</span>Vault signal stable
      </div>
    </div>
  );
}
