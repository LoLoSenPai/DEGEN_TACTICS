import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import clsx from "clsx";

type TacticalPanelProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  accent?: "teal" | "cyan" | "gold" | "violet" | "danger" | "neutral";
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

const accentClasses = {
  teal: "before:border-teal before:bg-teal",
  cyan: "before:border-cyan before:bg-cyan",
  gold: "before:border-gold before:bg-gold",
  violet: "before:border-violet before:bg-violet",
  danger: "before:border-danger before:bg-danger",
  neutral: "before:border-[var(--line-bright)] before:bg-[var(--line-bright)]",
};

export function TacticalPanel<T extends ElementType = "section">({
  as,
  children,
  className,
  accent = "neutral",
  ...props
}: TacticalPanelProps<T>) {
  const Component = as ?? "section";

  return (
    <Component
      className={clsx(
        "relative rounded-[13px_9px_15px_8px] border-2 border-[var(--line-bright)] bg-surface-1 shadow-[var(--shadow-panel)]",
        "before:absolute before:left-4 before:top-[-7px] before:h-3 before:w-12 before:-rotate-2 before:border before:opacity-90",
        "after:absolute after:bottom-2 after:right-2 after:h-3 after:w-3 after:rotate-6 after:border-b-2 after:border-r-2 after:border-[var(--line-bright)]",
        accentClasses[accent],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
