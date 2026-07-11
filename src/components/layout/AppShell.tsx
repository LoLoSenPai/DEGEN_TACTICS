import type { ReactNode } from "react";
import { TopBar } from "./TopBar";

type AppShellProps = {
  children: ReactNode;
  section?: string;
  footerNote?: string;
};

export function AppShell({ children, section, footerNote = "Field kit 01 · Guest campaign" }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col border-x border-[var(--wood-dark)] bg-surface-0 px-4 shadow-[0_0_32px_rgba(56,32,16,0.3)] sm:px-6 lg:px-10">
      <TopBar section={section} />
      <main className="flex-1 py-8 sm:py-10 lg:py-12">{children}</main>
      <footer className="flex flex-col gap-2 border-t-2 border-line py-5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>{footerNote}</span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rotate-45 border border-[var(--line-bright)] bg-teal" />
          Every move counts
        </span>
      </footer>
    </div>
  );
}
