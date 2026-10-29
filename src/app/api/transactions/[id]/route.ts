import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TYPES = ["INCOME", "EXPENSE"];
const MODES = ["CASH", "CARD", "UPI", "BANK", "WALLET"];

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const existing = await db.transaction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.type !== undefined) {
      if (!TYPES.includes(body.type)) {
        return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
      }
      data.type = body.type;
    }
    if (body.amount !== undefined) {
      const numAmount = Number(body.amount);
      if (!Number.isFinite(numAmount) || numAmount <= 0) {
        return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
      }
      data.amount = numAmount;
    }
    if (body.category !== undefined) {
      if (!body.category || typeof body.category !== "string" || !body.category.trim()) {
        return NextResponse.json({ error: "Category is required" }, { status: 400 });
      }
      data.category = body.category.trim();
    }
    if (body.paymentMode !== undefined) {
      if (!MODES.includes(body.paymentMode)) {
        return NextResponse.json({ error: "Invalid payment mode" }, { status: 400 });
      }
      data.paymentMode = body.paymentMode;
    }
    if (body.description !== undefined) {
      data.description = body.description?.trim() || null;
    }
    if (body.date !== undefined) {
      const d = new Date(body.date);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid date" }, { status: 400 });
      }
      data.date = d;
    }

    const transaction = await db.transaction.update({ where: { id }, data });
    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("PATCH /api/transactions/[id] error:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const existing = await db.transaction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    await db.transaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/transactions/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
