"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Pencil, Plus, ReceiptText, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  INCOME_CATEGORIES,
  PAYMENT_MODES,
  formatCurrency,
  formatDate,
  getPaymentMode,
  lastNMonths,
  type Transaction,
} from "@/lib/finance";
import { CategoryIcon, PaymentModeIcon } from "./category-icon";

const PAGE_SIZE = 25;

export function TransactionList({
  onEdit,
  onAdd,
}: {
  onEdit: (tx: Transaction) => void;
  onAdd: () => void;
}) {
  const qc = useQueryClient();

  // Filters
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [type, setType] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [mode, setMode] = useState("ALL");
  const [month, setMonth] = useState("ALL");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setVisible(PAGE_SIZE);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  /** Update a filter and reset pagination in one interaction (no effect needed). */
  const changeFilter = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setVisible(PAGE_SIZE);
  };

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (debounced.trim()) p.set("search", debounced.trim());
    if (type !== "ALL") p.set("type", type);
    if (category !== "ALL") p.set("category", category);
    if (mode !== "ALL") p.set("mode", mode);
    if (month !== "ALL") p.set("month", month);
    return p.toString();
  }, [debounced, type, category, mode, month]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["transactions", params],
    queryFn: async () => {
      const res = await fetch(`/api/transactions?${params}`);
      if (!res.ok) throw new Error("Failed to load transactions");
      const json = await res.json();
      return json.transactions as Transaction[];
    },
  });

  const transactions = data ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to delete");
      }
    },
    onSuccess: () => {
      toast.success("Transaction deleted");
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const monthOptions = lastNMonths(12);
  const categoryOptions = useMemo(() => {
    const set = new Set<string>([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]);
    return Array.from(set).sort();
  }, []);

  const totals = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const t of transactions) {
      if (t.type === "INCOME") income += t.amount;
      else expenses += t.amount;
    }
    return { income, expenses };
  }, [transactions]);

  const shown = transactions.slice(0, visible);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              placeholder="Search description or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Search transactions"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Select value={type} onValueChange={changeFilter(setType)}>
              <SelectTrigger aria-label="Filter by type" className="w-full">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={changeFilter(setCategory)}>
              <SelectTrigger aria-label="Filter by category" className="w-full">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {categoryOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={mode} onValueChange={changeFilter(setMode)}>
              <SelectTrigger aria-label="Filter by payment mode" className="w-full">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Modes</SelectItem>
                {PAYMENT_MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={month} onValueChange={changeFilter(setMonth)}>
              <SelectTrigger aria-label="Filter by month" className="w-full">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Time</SelectItem>
                {monthOptions.map((m) => (
                  <SelectItem key={m} value={m} className="tnum">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary line */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            "Loading transactions..."
          ) : (
            <>
              <span className="font-semibold text-foreground tnum">{transactions.length}</span>{" "}
              transaction{transactions.length === 1 ? "" : "s"} found
              <span className="mx-2 text-border">|</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400 tnum">
                +{formatCurrency(totals.income)}
              </span>{" "}
              <span className="mx-1 text-border">/</span>{" "}
              <span className="font-medium text-rose-600 dark:text-rose-400 tnum">
                −{formatCurrency(totals.expenses)}
              </span>
            </>
          )}
          {isFetching && !isLoading && (
            <Loader2 className="ml-2 inline h-3 w-3 animate-spin" aria-hidden />
          )}
        </p>
        <Button size="sm" onClick={onAdd} className="h-8">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {/* List */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="rounded-full bg-muted p-4" aria-hidden>
                <ReceiptText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">No transactions found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {search || type !== "ALL" || category !== "ALL" || mode !== "ALL" || month !== "ALL"
                    ? "Try adjusting your filters or search term."
                    : "Add your first income or expense to get started."}
                </p>
              </div>
              {!search && type === "ALL" && category === "ALL" && mode === "ALL" && month === "ALL" && (
                <Button onClick={onAdd} size="sm" className="mt-1">
                  <Plus className="h-4 w-4" />
                  Add Transaction
                </Button>
              )}
            </div>
          ) : (
            <ul className="divide-y" role="list">
              <AnimatePresence initial={false}>
                {shown.map((tx) => {
                  const isIncome = tx.type === "INCOME";
                  const pm = getPaymentMode(tx.paymentMode);
                  return (
                    <motion.li
                      key={tx.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50 sm:px-5"
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          isIncome
                            ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/12 text-rose-600 dark:text-rose-400"
                        )}
                        aria-hidden
                      >
                        <CategoryIcon category={tx.category} className="h-4.5 w-4.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold">{tx.category}</p>
                          <span
                            className="hidden shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex"
                            title={pm.label}
                          >
                            <PaymentModeIcon mode={tx.paymentMode} className="h-3 w-3" />
                            {pm.label}
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {tx.description?.trim() || "No description"} · {formatDate(tx.date)}
                        </p>
                      </div>

                      <p
                        className={cn(
                          "shrink-0 text-sm font-bold tnum sm:text-base",
                          isIncome
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-foreground"
                        )}
                      >
                        {isIncome ? "+" : "−"}
                        {formatCurrency(tx.amount)}
                      </p>

                      <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(tx)}
                          aria-label={`Edit ${tx.category} transaction`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(tx)}
                          aria-label={`Delete ${tx.category} transaction`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}

          {transactions.length > visible && (
            <div className="border-t p-3 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
              >
                Show more ({transactions.length - visible} remaining)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirm */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget &&
                `${deleteTarget.type === "INCOME" ? "Income" : "Expense"} of ${formatCurrency(
                  deleteTarget.amount
                )} in ${deleteTarget.category} will be permanently removed. This action cannot be undone.`}
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
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
