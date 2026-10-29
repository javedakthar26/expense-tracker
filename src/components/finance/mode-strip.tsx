"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCardIcon } from "lucide-react";
import { formatCurrency, getPaymentMode, PAYMENT_MODES, type Stats } from "@/lib/finance";
import { PaymentModeIcon } from "./category-icon";
import { cn } from "@/lib/utils";

export function ModeStrip({ stats }: { stats: Stats }) {
  const total = stats.paymentModeBreakdown.reduce((s, m) => s + m.amount, 0);
  const modeMap = new Map(stats.paymentModeBreakdown.map((m) => [m.mode, m.amount]));

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCardIcon className="h-4 w-4 text-primary" aria-hidden />
          Cash Modes Used
        </CardTitle>
        <CardDescription>
          How you paid this month
          {stats.topPaymentMode
            ? ` — favourite: ${getPaymentMode(stats.topPaymentMode.mode).label}`
            : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {stats.paymentModeBreakdown.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            No transactions this month yet — your cash mode usage will appear here.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {PAYMENT_MODES.map((m) => {
              const amount = modeMap.get(m.value) ?? 0;
              const pct = total > 0 ? (amount / total) * 100 : 0;
              const used = amount > 0;
              return (
                <div
                  key={m.value}
                  className={cn(
                    "rounded-xl border p-3 transition-colors",
                    used ? "bg-card" : "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <PaymentModeIcon mode={m.value} className={cn("h-4 w-4", m.color)} />
                    <span className="text-sm font-medium">{m.label}</span>
                  </div>
                  <p className="mt-1.5 text-lg font-bold tnum">{formatCurrency(amount)}</p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground tnum">
                    {pct > 0 ? `${pct.toFixed(0)}% of spending` : "not used"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
