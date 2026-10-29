"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LayoutDashboard, ListOrdered, Plus, Target, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { MonthNavigator } from "@/components/finance/month-navigator";
import { SummaryCards } from "@/components/finance/summary-cards";
import { ChartsPanel } from "@/components/finance/charts-panel";
import { ModeStrip } from "@/components/finance/mode-strip";
import { TransactionList } from "@/components/finance/transaction-list";
import { BudgetPanel } from "@/components/finance/budget-panel";
import { TransactionDialog } from "@/components/finance/transaction-dialog";
import { currentMonth, type Budget, type Stats, type Transaction } from "@/lib/finance";

export default function Home() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("dashboard");
  const [month, setMonth] = useState(currentMonth());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["stats", month],
    queryFn: async () => {
      const res = await fetch(`/api/stats?month=${month}`);
      if (!res.ok) throw new Error("Failed to load stats");
      const json = await res.json();
      return json.stats as Stats;
    },
  });

  const { data: budgetsData, isLoading: budgetsLoading } = useQuery({
    queryKey: ["budgets", month],
    queryFn: async () => {
      const res = await fetch(`/api/budgets?month=${month}`);
      if (!res.ok) throw new Error("Failed to load budgets");
      const json = await res.json();
      return json.budgets as Budget[];
    },
  });

  const openAdd = () => {
    setEditingTx(null);
    setDialogOpen(true);
  };

  const handleSaved = () => {
    qc.invalidateQueries({ queryKey: ["stats"] });
    qc.invalidateQueries({ queryKey: ["budgets"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
  };

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setDialogOpen(true);
  };

  const stats = statsData;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm"
            aria-hidden
          >
            <Wallet className="h-4.5 w-4.5" />
          </div>
          <div className="mr-auto">
            <h1 className="text-lg font-bold leading-tight tracking-tight">
              Expense<span className="text-primary">Tracker</span>
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Manage expenses, budgets &amp; cash modes
            </p>
          </div>
          <ThemeToggle />
          <Button onClick={openAdd} className="shadow-sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Transaction</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <Tabs value={tab} onValueChange={setTab} className="gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="h-11 w-full justify-center rounded-xl bg-muted/60 p-1 sm:w-auto">
                <TabsTrigger value="dashboard" className="h-9 rounded-lg px-4 text-sm">
                  <LayoutDashboard className="h-4 w-4" aria-hidden />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="transactions" className="h-9 rounded-lg px-4 text-sm">
                  <ListOrdered className="h-4 w-4" aria-hidden />
                  Transactions
                </TabsTrigger>
                <TabsTrigger value="budgets" className="h-9 rounded-lg px-4 text-sm">
                  <Target className="h-4 w-4" aria-hidden />
                  Budgets
                </TabsTrigger>
              </TabsList>
              <MonthNavigator month={month} onChange={setMonth} className="self-center" />
            </div>

            {/* Dashboard */}
            <TabsContent value="dashboard" className="space-y-4">
              {statsLoading || !stats ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-36 animate-pulse rounded-xl border bg-card" />
                  ))}
                </div>
              ) : (
                <SummaryCards stats={stats} budgets={budgetsData ?? []} />
              )}
              {stats && <ChartsPanel stats={stats} />}
              {stats && <ModeStrip stats={stats} />}
            </TabsContent>

            {/* Transactions */}
            <TabsContent value="transactions">
              <TransactionList onEdit={openEdit} onAdd={openAdd} />
            </TabsContent>

            {/* Budgets */}
            <TabsContent value="budgets">
              <BudgetPanel
                month={month}
                budgets={budgetsData ?? []}
                stats={stats}
                isLoading={budgetsLoading || statsLoading}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-background/80">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-1 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>ExpenseTracker — your money, clarified.</p>
          <p className="tnum">
            {stats
              ? `${stats.transactionCount} transactions tracked · $${stats.totalIncome.toFixed(
                  2
                )} in · $${stats.totalExpenses.toFixed(2)} out`
              : "Loading..."}
          </p>
        </div>
      </footer>

      {/* Add/Edit dialog */}
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingTx}
        onSaved={handleSaved}
      />
    </div>
  );
}
