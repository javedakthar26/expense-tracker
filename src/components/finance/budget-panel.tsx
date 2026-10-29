"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Loader2,
  Pencil,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  EXPENSE_CATEGORIES,
  formatCurrency,
  monthLabel,
  type Budget,
  type Stats,
} from "@/lib/finance";
import { BudgetProgress } from "./budget-progress";
import { CategoryIcon } from "./category-icon";

export function BudgetPanel({
  month,
  budgets,
  stats,
  isLoading,
}: {
  month: string;
  budgets: Budget[];
  stats: Stats | undefined;
  isLoading: boolean;
}) {
  const qc = useQueryClient();

  // Add form
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Edit dialog
  const [editTarget, setEditTarget] = useState<Budget | null>(null);
  const [editAmount, setEditAmount] = useState("");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);

  const spentMap = new Map((stats?.categoryBreakdown ?? []).map((c) => [c.category, c.amount]));
  const monthTotalExpenses = stats?.monthExpenses ?? 0;
  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const overallPct = totalBudget > 0 ? (monthTotalExpenses / totalBudget) * 100 : 0;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["budgets"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };

  const upsertMutation = useMutation({
    mutationFn: async (payload: { category: string; amount: number; month: string }) => {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to save budget");
      }
    },
    onSuccess: (_data, payload) => {
      toast.success(
        budgets.some((b) => b.category === payload.category)
          ? `Budget for ${payload.category} updated`
          : `Budget for ${payload.category} set to ${formatCurrency(payload.amount)}`
      );
      setCategory("");
      setAmount("");
      setFormError(null);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; amount: number }) => {
      const res = await fetch(`/api/budgets/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: payload.amount }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to update budget");
      }
    },
    onSuccess: () => {
      toast.success("Budget updated");
      setEditTarget(null);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to delete budget");
      }
    },
    onSuccess: () => {
      toast.success("Budget removed");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSetBudget = () => {
    const num = Number(amount);
    if (!category) {
      setFormError("Choose a category to budget");
      return;
    }
    if (!amount || !Number.isFinite(num) || num <= 0) {
      setFormError("Enter a valid budget amount");
      return;
    }
    setFormError(null);
    upsertMutation.mutate({ category, amount: num, month });
  };

  const openEdit = (b: Budget) => {
    setEditTarget(b);
    setEditAmount(String(b.amount));
  };

  return (
    <div className="space-y-4">
      {/* Overall budget summary */}
      <Card className="relative overflow-hidden shadow-sm">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br from-amber-500/15 to-transparent blur-2xl"
          aria-hidden
        />
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <PiggyBank className="h-4 w-4 text-primary" aria-hidden />
            Overall Budget — {monthLabel(month)}
          </CardTitle>
          <CardDescription>
            Total spending vs combined category budgets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-14 w-full" />
          ) : totalBudget > 0 ? (
            <>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight tnum">
                  {formatCurrency(monthTotalExpenses)}
                </span>
                <span className="text-base text-muted-foreground tnum">
                  spent of {formatCurrency(totalBudget)} budgeted
                </span>
                <span
                  className={cn(
                    "ml-auto rounded-full px-3 py-1 text-xs font-semibold tnum",
                    overallPct >= 100
                      ? "bg-rose-500/12 text-rose-600 dark:text-rose-400"
                      : overallPct >= 70
                        ? "bg-amber-500/12 text-amber-600 dark:text-amber-400"
                        : "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {overallPct.toFixed(0)}% used
                </span>
              </div>
              <BudgetProgress
                value={overallPct}
                ariaLabel={`Overall budget ${overallPct.toFixed(0)} percent used`}
                className="mt-3 h-3"
              />
              <p className="mt-2 text-sm text-muted-foreground tnum">
                {monthTotalExpenses <= totalBudget
                  ? `${formatCurrency(totalBudget - monthTotalExpenses)} still available this month`
                  : `You exceeded the combined budget by ${formatCurrency(
                      monthTotalExpenses - totalBudget
                    )}`}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No budgets set for {monthLabel(month)} yet. Use the form below to set a limit per
              category and keep your spending on track.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Set budget form */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-primary" aria-hidden />
            Set Monthly Budget
          </CardTitle>
          <CardDescription>
            For {monthLabel(month)} — setting a budget for an existing category updates it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex-1 grid gap-1.5">
              <Label htmlFor="budget-category">Category</Label>
              <Select value={category} onValueChange={(v) => { setCategory(v); setFormError(null); }}>
                <SelectTrigger id="budget-category" className="w-full">
                  <SelectValue placeholder="Choose category to budget" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 grid gap-1.5">
              <Label htmlFor="budget-amount">Monthly limit</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">
                  $
                </span>
                <Input
                  id="budget-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="pl-8 tnum"
                />
              </div>
            </div>
            <div className="flex sm:pt-6">
              <Button
                onClick={handleSetBudget}
                disabled={upsertMutation.isPending}
                className="w-full sm:w-auto min-w-32"
              >
                {upsertMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Target className="h-4 w-4" />
                )}
                Set Budget
              </Button>
            </div>
          </div>
          {formError && (
            <p className="mt-2 text-xs text-destructive" role="alert">
              {formError}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Budget cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="mt-3 h-3 w-2/3" />
                <Skeleton className="mt-4 h-2 w-full" />
                <Skeleton className="mt-3 h-3 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="rounded-full bg-muted p-4" aria-hidden>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-semibold">No budgets for this month</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Set a budget per category above to see progress bars, warnings and remaining
              amounts here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {budgets.map((b) => {
            const spent = spentMap.get(b.category) ?? 0;
            const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
            const remaining = b.amount - spent;
            const over = remaining < 0;
            return (
              <motion.div
                key={b.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full",
                            over
                              ? "bg-rose-500/12 text-rose-600 dark:text-rose-400"
                              : "bg-primary/12 text-primary"
                          )}
                          aria-hidden
                        >
                          <CategoryIcon category={b.category} className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="font-semibold leading-tight">{b.category}</p>
                          <p className="text-xs text-muted-foreground tnum">
                            {formatCurrency(spent)} of {formatCurrency(b.amount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(b)}
                          aria-label={`Edit budget for ${b.category}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(b)}
                          aria-label={`Delete budget for ${b.category}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <BudgetProgress
                      value={pct}
                      ariaLabel={`${b.category} budget ${pct.toFixed(0)} percent used`}
                      className="mt-4"
                    />

                    <div className="mt-2.5 flex items-center justify-between text-xs">
                      <span
                        className={cn(
                          "flex items-center gap-1 font-semibold tnum",
                          over
                            ? "text-destructive"
                            : pct >= 70
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        {over && <TriangleAlert className="h-3.5 w-3.5" aria-hidden />}
                        {over
                          ? `Over by ${formatCurrency(Math.abs(remaining))}`
                          : `${formatCurrency(remaining)} left`}
                      </span>
                      <span className="text-muted-foreground tnum">{pct.toFixed(0)}% used</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit budget dialog */}
      <Dialog open={Boolean(editTarget)} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
            <DialogDescription>
              Update the monthly limit for {editTarget?.category} ({monthLabel(month)}).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-1">
            <Label htmlFor="edit-budget-amount">Monthly limit</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">
                $
              </span>
              <Input
                id="edit-budget-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="pl-8 tnum"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const num = Number(editAmount);
                if (!editAmount || !Number.isFinite(num) || num <= 0) {
                  toast.error("Enter a valid budget amount");
                  return;
                }
                if (editTarget) updateMutation.mutate({ id: editTarget.id, amount: num });
              }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete budget confirm */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this budget?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget &&
                `The ${formatCurrency(deleteTarget.amount)} monthly budget for ${
                  deleteTarget.category
                } will be removed. Your transactions are not affected.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
