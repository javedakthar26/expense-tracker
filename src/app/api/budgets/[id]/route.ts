import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const existing = await db.budget.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

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

    const budget = await db.budget.update({ where: { id }, data });
    return NextResponse.json({ budget });
  } catch (error) {
    console.error("PATCH /api/budgets/[id] error:", error);
    return NextResponse.json({ error: "Failed to update budget" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const existing = await db.budget.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }
    await db.budget.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/budgets/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete budget" }, { status: 500 });
  }
}
