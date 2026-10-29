"use client";

import { useTheme } from "next-themes";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PieChartIcon, BarChart3Icon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  getCategoryColor,
  formatCompact,
  formatCurrency,
  monthLabelShort,
  type Stats,
} from "@/lib/finance";
import { CategoryIcon } from "./category-icon";

function ChartTooltip({
  active,
  payload,
  label,
  prefix = "",
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; payload?: { category?: string; fullLabel?: string } }[];
  label?: string;
  prefix?: string;
}) {
  if (!active || !payload?.length) return null;
  const first = payload[0];
  const title = first?.payload?.fullLabel ?? first?.payload?.category ?? label;
  return (
    <div
      className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md"
      style={{ background: "var(--popover)", borderColor: "var(--border)" }}
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-0.5 tnum text-muted-foreground">
        {prefix}
        {formatCurrency(first?.value ?? 0)}
      </p>
    </div>
  );
}

export function ChartsPanel({ stats }: { stats: Stats }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const axisColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const pieData = stats.categoryBreakdown.slice(0, 9).map((d) => ({
    ...d,
    fullLabel: d.category,
  }));
  const trendData = stats.monthlyTrend.map((t) => ({
    ...t,
    label: monthLabelShort(t.month),
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* Spending by category — donut */}
      <Card className="lg:col-span-2 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChartIcon className="h-4 w-4 text-primary" aria-hidden />
            Spending by Category
          </CardTitle>
          <CardDescription>Where your money went this month</CardDescription>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
              <PieChartIcon className="h-10 w-10 opacity-30" aria-hidden />
              <p className="text-sm">No expenses recorded this month</p>
            </div>
          ) : (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={92}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {pieData.map((d) => (
                        <Cell key={d.category} fill={getCategoryColor(d.category)} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 grid max-h-32 gap-1.5 overflow-y-auto scrollbar-thin pr-1 text-sm">
                {pieData.map((d) => (
                  <li key={d.category} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: getCategoryColor(d.category) }}
                      aria-hidden
                    />
                    <CategoryIcon category={d.category} className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{d.category}</span>
                    <span className="ml-auto shrink-0 font-medium tnum">
                      {formatCurrency(d.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      {/* 6-month trend — bars */}
      <Card className="lg:col-span-3 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3Icon className="h-4 w-4 text-primary" aria-hidden />
            Income vs Expenses
          </CardTitle>
          <CardDescription>Last 6 months overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: axisColor, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: axisColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => formatCompact(v)}
                  width={52}
                />
                <Tooltip
                  cursor={{ fill: "rgba(128,128,128,0.08)" }}
                  content={
                    <ChartTooltip />
                  }
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: axisColor }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="#f43f5e"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
