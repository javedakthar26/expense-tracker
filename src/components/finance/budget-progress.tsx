"use client";

import { cn } from "@/lib/utils";

/** Indicator color by percent: emerald <70%, amber 70–99%, red ≥100%. */
export function progressColorClass(pct: number): string {
  if (pct >= 100) return "bg-rose-500";
  if (pct >= 70) return "bg-amber-500";
  return "bg-emerald-500";
}

/**
 * Accessible progress bar with dynamic color support
 * (Tailwind can't compose runtime class names inside shadcn's Progress,
 * so this uses a lightweight custom implementation).
 */
export function BudgetProgress({
  value,
  ariaLabel,
  className,
}: {
  value: number;
  ariaLabel?: string;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-foreground/10",
        className
      )}
    >
      <div
        data-slot="progress-indicator"
        className={cn(
          "h-full rounded-full transition-all duration-500",
          progressColorClass(value)
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
