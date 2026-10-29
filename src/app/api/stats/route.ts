import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/stats?month=YYYY-MM
 * Returns aggregated dashboard statistics for the given month plus all-time totals.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const month =
      monthParam && /^\d{4}-\d{2}$/.test(monthParam)
        ? monthParam
        : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

    const [y, m] = month.split("-").map(Number);
    const rangeGte = new Date(y, m - 1, 1);
    const rangeLt = new Date(y, m, 1);

    // 6-month trend window ending at the selected month
    const trendStart = new Date(y, m - 6, 1);

    const [monthAgg, allTimeAgg, monthTxs, trendTxs, count] = await Promise.all([
      db.transaction.groupBy({
        by: ["type"],
        where: { date: { gte: rangeGte, lt: rangeLt } },
        _sum: { amount: true },
      }),
      db.transaction.groupBy({
        by: ["type"],
        _sum: { amount: true },
      }),
      db.transaction.findMany({
        where: { date: { gte: rangeGte, lt: rangeLt }, type: "EXPENSE" },
        select: { category: true, paymentMode: true, amount: true },
      }),
      db.transaction.findMany({
        where: { date: { gte: trendStart, lt: rangeLt } },
        select: { type: true, amount: true, date: true },
      }),
      db.transaction.count(),
    ]);

    const monthIncome = monthAgg.find((g) => g.type === "INCOME")?._sum.amount ?? 0;
    const monthExpenses = monthAgg.find((g) => g.type === "EXPENSE")?._sum.amount ?? 0;
    const totalIncome = allTimeAgg.find((g) => g.type === "INCOME")?._sum.amount ?? 0;
    const totalExpenses = allTimeAgg.find((g) => g.type === "EXPENSE")?._sum.amount ?? 0;

    // Category breakdown for the selected month (expenses)
    const catMap = new Map<string, number>();
    for (const tx of monthTxs) {
      catMap.set(tx.category, (catMap.get(tx.category) ?? 0) + tx.amount);
    }
    const categoryBreakdown = Array.from(catMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Payment mode breakdown for the selected month (expenses + income usage)
    const modeMap = new Map<string, number>();
    for (const tx of monthTxs) {
      modeMap.set(tx.paymentMode, (modeMap.get(tx.paymentMode) ?? 0) + tx.amount);
    }
    const paymentModeBreakdown = Array.from(modeMap.entries())
      .map(([mode, amount]) => ({ mode, amount }))
      .sort((a, b) => b.amount - a.amount);

    // 6-month trend
    const trendMap = new Map<string, { income: number; expenses: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(y, m - 1 - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      trendMap.set(key, { income: 0, expenses: 0 });
    }
    for (const tx of trendTxs) {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entry = trendMap.get(key);
      if (!entry) continue;
      if (tx.type === "INCOME") entry.income += tx.amount;
      else entry.expenses += tx.amount;
    }
    const monthlyTrend = Array.from(trendMap.entries()).map(([month, v]) => ({
      month,
      income: Math.round(v.income * 100) / 100,
      expenses: Math.round(v.expenses * 100) / 100,
    }));

    const topPaymentMode = paymentModeBreakdown[0] ?? null;

    const stats = {
      month,
      monthIncome: Math.round(monthIncome * 100) / 100,
      monthExpenses: Math.round(monthExpenses * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      balance: Math.round((totalIncome - totalExpenses) * 100) / 100,
      monthBalance: Math.round((monthIncome - monthExpenses) * 100) / 100,
      categoryBreakdown,
      paymentModeBreakdown,
      monthlyTrend,
      topPaymentMode,
      transactionCount: count,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
