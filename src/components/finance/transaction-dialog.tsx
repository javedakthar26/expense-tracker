"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_MODES,
  type Transaction,
  type TxType,
} from "@/lib/finance";
import { PaymentModeIcon } from "./category-icon";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this transaction instead of creating one. */
  initialData: Transaction | null;
  onSaved: () => void;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function TransactionDialog({
  open,
  onOpenChange,
  initialData,
  onSaved,
}: TransactionDialogProps) {
  const isEdit = Boolean(initialData);
  const [type, setType] = useState<TxType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [date, setDate] = useState(todayStr());
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);

  // Sync form state whenever the dialog opens
  useEffect(() => {
    if (open) {
      if (initialData) {
        setType(initialData.type);
        setAmount(String(initialData.amount));
        setCategory(initialData.category);
        setPaymentMode(initialData.paymentMode);
        setDate(initialData.date.slice(0, 10));
        setDescription(initialData.description ?? "");
      } else {
        setType("EXPENSE");
        setAmount("");
        setCategory("");
        setPaymentMode("CASH");
        setDate(todayStr());
        setDescription("");
      }
      setAmountError(null);
      setSubmitting(false);
    }
  }, [open, initialData]);

  // Reset category when type changes (unless editing and category still valid)
  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  useEffect(() => {
    if (category && !categories.includes(category)) setCategory("");
  }, [type, category, categories]);

  const handleSubmit = async () => {
    const num = Number(amount);
    if (!amount || !Number.isFinite(num) || num <= 0) {
      setAmountError("Enter a valid amount greater than 0");
      return;
    }
    if (!category) {
      toast.error("Please choose a category");
      return;
    }
    setAmountError(null);
    setSubmitting(true);

    try {
      const payload = {
        type,
        amount: num,
        category,
        paymentMode,
        date: date ? new Date(`${date}T12:00:00`).toISOString() : new Date().toISOString(),
        description: description.trim(),
      };

      const res = await fetch(
        isEdit ? `/api/transactions/${initialData!.id}` : "/api/transactions",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }

      toast.success(
        isEdit
          ? "Transaction updated successfully"
          : `${type === "INCOME" ? "Income" : "Expense"} of $${num.toFixed(2)} added`
      );
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save transaction");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this transaction."
              : "Record a new income or expense entry."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Transaction type">
            <button
              type="button"
              role="radio"
              aria-checked={type === "EXPENSE"}
              onClick={() => setType("EXPENSE")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all",
                type === "EXPENSE"
                  ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : "border-border text-muted-foreground hover:border-rose-300 hover:text-rose-500"
              )}
            >
              <TrendingDown className="h-4 w-4" />
              Expense
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={type === "INCOME"}
              onClick={() => setType("INCOME")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all",
                type === "INCOME"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-border text-muted-foreground hover:border-emerald-300 hover:text-emerald-500"
              )}
            >
              <TrendingUp className="h-4 w-4" />
              Income
            </button>
          </div>

          {/* Amount */}
          <div className="grid gap-2">
            <Label htmlFor="tx-amount">Amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                $
              </span>
              <Input
                id="tx-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 h-12 text-lg font-semibold tnum"
                aria-invalid={Boolean(amountError)}
              />
            </div>
            {amountError && (
              <p className="text-xs text-destructive" role="alert">
                {amountError}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="grid gap-2">
            <Label htmlFor="tx-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="tx-category" className="w-full">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment mode */}
          <div className="grid gap-2">
            <Label id="mode-label">Payment mode</Label>
            <div
              className="grid grid-cols-5 gap-1.5"
              role="radiogroup"
              aria-labelledby="mode-label"
            >
              {PAYMENT_MODES.map((m) => {
                const active = paymentMode === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    title={m.label}
                    onClick={() => setPaymentMode(m.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[11px] font-medium transition-all",
                      active
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <PaymentModeIcon mode={m.value} className="h-4 w-4" />
                    <span className="truncate w-full text-center">{m.label.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div className="grid gap-2">
            <Label htmlFor="tx-date">Date</Label>
            <Input
              id="tx-date"
              type="date"
              value={date}
              max="2100-12-31"
              onChange={(e) => setDate(e.target.value)}
              className="tnum"
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="tx-desc">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="tx-desc"
              placeholder="e.g. Weekly groceries at Trader Joe's"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="min-w-36">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Add Transaction"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
