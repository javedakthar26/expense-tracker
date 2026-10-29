import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TYPES = ["INCOME", "EXPENSE"];
const MODES = ["CASH", "CARD", "UPI", "BANK", "WALLET"];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // "YYYY-MM" optional
    const type = searchParams.get("type"); // INCOME | EXPENSE optional
    const category = searchParams.get("category"); // optional
    const mode = searchParams.get("mode"); // payment mode optional
    const search = searchParams.get("search"); // free text optional

    const where: Record<string, unknown> = {};

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split("-").map(Number);
      where.date = {
        gte: new Date(y, m - 1, 1),
        lt: new Date(y, m, 1),
      };
    }
    if (type && TYPES.includes(type)) where.type = type;
    if (category && category !== "ALL") where.category = category;
    if (mode && mode !== "ALL") where.paymentMode = mode;
    if (search && search.trim()) {
      where.OR = [
        { description: { contains: search.trim() } },
        { category: { contains: search.trim() } },
      ];
    }

    const transactions = await db.transaction.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, amount, category, description, paymentMode, date } = body;

    if (!TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
    }
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }
    if (!category || typeof category !== "string" || !category.trim()) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    if (!MODES.includes(paymentMode)) {
      return NextResponse.json({ error: "Invalid payment mode" }, { status: 400 });
    }

    let txDate = new Date();
    if (date) {
      txDate = new Date(date);
      if (isNaN(txDate.getTime())) {
        return NextResponse.json({ error: "Invalid date" }, { status: 400 });
      }
    }

    const transaction = await db.transaction.create({
      data: {
        type,
        amount: numAmount,
        category: category.trim(),
        description: description?.trim() || null,
        paymentMode,
        date: txDate,
      },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
