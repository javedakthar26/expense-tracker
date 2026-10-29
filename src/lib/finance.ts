export type TxType = "INCOME" | "EXPENSE";

export type PaymentMode = "CASH" | "CARD" | "UPI" | "BANK" | "WALLET";

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  description: string | null;
  paymentMode: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  month: string;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  month: string;
  monthIncome: number;
  monthExpenses: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  monthBalance: number;
  categoryBreakdown: { category: string; amount: number }[];
  paymentModeBreakdown: { mode: string; amount: number }[];
  monthlyTrend: { month: string; income: number; expenses: number }[];
  topPaymentMode: { mode: string; amount: number } | null;
  transactionCount: number;
}

export const PAYMENT_MODES: {
  value: PaymentMode;
  label: string;
  icon: string;
  color: string;
}[] = [
  { value: "CASH", label: "Cash", icon: "Banknote", color: "text-emerald-600 dark:text-emerald-400" },
  { value: "CARD", label: "Card", icon: "CreditCard", color: "text-violet-600 dark:text-violet-400" },
  { value: "UPI", label: "UPI", icon: "Smartphone", color: "text-orange-600 dark:text-orange-400" },
  { value: "BANK", label: "Bank Transfer", icon: "Landmark", color: "text-cyan-600 dark:text-cyan-400" },
  { value: "WALLET", label: "Wallet", icon: "Wallet", color: "text-pink-600 dark:text-pink-400" },
];

export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Groceries",
  "Transport",
  "Shopping",
  "Rent & Housing",
  "Utilities",
  "Entertainment",
  "Health",
  "Education",
  "Travel",
  "Subscriptions",
  "Other",
];

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Gift",
  "Other",
];

export const CATEGORY_COLORS: Record<string, string> = {
  // expenses
  "Food & Dining": "#f97316",
  Groceries: "#22c55e",
  Transport: "#06b6d4",
  Shopping: "#ec4899",
  "Rent & Housing": "#a855f7",
  Utilities: "#eab308",
  Entertainment: "#f43f5e",
  Health: "#10b981",
  Education: "#6366f1",
  Travel: "#0ea5e9",
  Subscriptions: "#d946ef",
  Other: "#94a3b8",
  // income
  Salary: "#22c55e",
  Freelance: "#14b8a6",
  Business: "#84cc16",
  Investment: "#eab308",
  Gift: "#f472b6",
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? "#94a3b8";
}

export function getPaymentMode(mode: string) {
  return PAYMENT_MODES.find((m) => m.value === mode) ?? PAYMENT_MODES[0];
}

export function formatCurrency(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? "-" : ""}$${formatted}`;
}

export function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `${amount < 0 ? "-" : ""}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${amount < 0 ? "-" : ""}$${(abs / 1_000).toFixed(1)}K`;
  return formatCurrency(amount);
}

/** Current month in "YYYY-MM" using local time. */
export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Build a list of the last N months ("YYYY-MM") ending at the given month. */
export function lastNMonths(n: number, endMonth?: string): string[] {
  const end = endMonth ?? currentMonth();
  const [y, m] = end.split("-").map(Number);
  const months: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(y, m - 1 - i, 1);
    months.unshift(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

/** "2026-01" -> "Jan 2026" */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/** "2026-01" -> "January" */
export function monthLabelShort(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function monthRange(month: string): { gte: Date; lt: Date } {
  const [y, m] = month.split("-").map(Number);
  return {
    gte: new Date(y, m - 1, 1),
    lt: new Date(y, m, 1),
  };
}
