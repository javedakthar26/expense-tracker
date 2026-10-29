"use client";

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currentMonth, monthLabel } from "@/lib/finance";

export function MonthNavigator({
  month,
  onChange,
  className,
}: {
  month: string;
  onChange: (month: string) => void;
  className?: string;
}) {
  const shift = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const isCurrent = month === currentMonth();

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border bg-card p-1 shadow-sm ${className ?? ""}`}
      role="group"
      aria-label="Select month"
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={() => shift(-1)}
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <button
        onClick={() => onChange(currentMonth())}
        className="flex min-w-36 items-center justify-center gap-1.5 rounded-full px-2 py-1 text-sm font-semibold transition-colors hover:bg-accent"
        title={isCurrent ? "Current month" : "Jump to current month"}
      >
        <CalendarDays className="h-3.5 w-3.5 text-primary" aria-hidden />
        <span className="tnum">{monthLabel(month)}</span>
        {!isCurrent && (
          <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            jump to now
          </span>
        )}
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={() => shift(1)}
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
