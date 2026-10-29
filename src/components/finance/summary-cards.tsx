"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Scale, Target, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency, type Budget, type Stats } from "@/lib/finance";
import { BudgetProgress } from "./budget-progress";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export function SummaryCards({
  stats,
  budgets,
}: {
  stats: Stats;
  budgets: Budget[];
}) {
  const monthBudgetTotal = budgets.reduce((s, b) => s + b.amount, 0);
  const budgetPct =
    monthBudgetTotal > 0
      ? Math.min(100, (stats.monthExpenses / monthBudgetTotal) * 100)
      : 0;
  const budgetRemaining = monthBudgetTotal - stats.monthExpenses;
  const overBudget = budgetRemaining < 0;

  const cards = [
    {
      key: "income",
      label: "Total Income",
      value: stats.totalIncome,
      sub: stats.monthIncome > 0 ? `+${formatCurrency(stats.monthIncome)} this month` : "No income this month",
      icon: TrendingUp,
      iconBg: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
      accent: "from-emerald-500/20",
    },
    {
      key: "expenses",
      label: "Total Expenses",
      value: stats.totalExpenses,
      sub:
        stats.monthExpenses > 0
          ? `−${formatCurrency(stats.monthExpenses)} this month`
          : "No expenses this month",
      icon: TrendingDown,
      iconBg: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
      accent: "from-rose-500/20",
    },
    {
      key: "balance",
      label: "Net Balance",
      value: stats.balance,
      sub:
        stats.monthBalance >= 0
          ? `+${formatCurrency(stats.monthBalance)} this month`
          : `−${formatCurrency(Math.abs(stats.monthBalance))} this month`,
      icon: Scale,
      iconBg: "bg-primary/12 text-primary",
      accent: "from-primary/20",
      valueClass: stats.balance >= 0 ? "" : "text-destructive",
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map((c) => (
        <motion.div key={c.key} variants={item}>
          <Card className="relative overflow-hidden border shadow-sm transition-shadow hover:shadow-md">
            <div
              className={cn(
                "pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br to-transparent blur-xl",
                c.accent
              )}
              aria-hidden
            />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-muted-foreground">{c.label}</p>
                <div className={cn("rounded-xl p-2", c.iconBg)} aria-hidden>
                  <c.icon className="h-4 w-4" />
                </div>
              </div>
              <p className={cn("mt-2 text-2xl font-bold tracking-tight tnum", c.valueClass)}>
                {c.value >= 0 ? "" : "−"}
                {formatCurrency(Math.abs(c.value))}
              </p>
              <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                {c.key === "income" && <ArrowUpRight className="h-3 w-3 text-emerald-500" />}
                {c.key === "expenses" && <ArrowDownRight className="h-3 w-3 text-rose-500" />}
                <span className="tnum">{c.sub}</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Monthly budget card */}
      <motion.div variants={item}>
        <Card className="relative overflow-hidden border shadow-sm transition-shadow hover:shadow-md">
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-amber-500/20 to-transparent blur-xl"
            aria-hidden
          />
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">Monthly Budget</p>
              <div
                className="rounded-xl bg-amber-500/12 p-2 text-amber-600 dark:text-amber-400"
                aria-hidden
              >
                <Target className="h-4 w-4" />
              </div>
            </div>
            {monthBudgetTotal > 0 ? (
              <>
                <p className="mt-2 text-2xl font-bold tracking-tight tnum">
                  {formatCurrency(stats.monthExpenses)}
                  <span className="ml-1.5 text-sm font-medium text-muted-foreground">
                    / {formatCurrency(monthBudgetTotal)}
                  </span>
                </p>
                <BudgetProgress
                  value={budgetPct}
                  ariaLabel={`Budget used ${budgetPct.toFixed(0)} percent`}
                  className="mt-3"
                />
                <p
                  className={cn(
                    "mt-1.5 text-xs font-medium tnum",
                    overBudget ? "text-destructive" : budgetPct >= 80 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {overBudget
                    ? `Over budget by ${formatCurrency(Math.abs(budgetRemaining))}`
                    : `${formatCurrency(budgetRemaining)} remaining · ${budgetPct.toFixed(0)}% used`}
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-2xl font-bold tracking-tight tnum">
                  {formatCurrency(stats.monthExpenses)}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  No budgets set for this month — set one in the Budgets tab
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
