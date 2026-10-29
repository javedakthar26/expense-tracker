import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");

    const where = month && /^\d{4}-\d{2}$/.test(month) ? { month } : {};
    const budgets = await db.budget.findMany({
      where,
      orderBy: [{ category: "asc" }],
    });

    return NextResponse.json({ budgets });
  } catch (error) {
    console.error("GET /api/budgets error:", error);
    return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 });
  }
}

/** Create or update the budget for a given category + month (upsert semantics). */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, amount, month } = body;

    if (!category || typeof category !== "string" || !category.trim()) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "Month must be in YYYY-MM format" }, { status: 400 });
    }

    const budget = await db.budget.upsert({
      where: { category_month: { category: category.trim(), month } },
      update: { amount: numAmount },
      create: { category: category.trim(), amount: numAmount, month },
    });

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    console.error("POST /api/budgets error:", error);
    return NextResponse.json({ error: "Failed to save budget" }, { status: 500 });
  }
}
