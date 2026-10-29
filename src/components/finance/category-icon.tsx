"use client";

import {
  UtensilsCrossed,
  ShoppingCart,
  Car,
  ShoppingBag,
  Home,
  Zap,
  Clapperboard,
  HeartPulse,
  GraduationCap,
  Plane,
  Repeat,
  CircleEllipsis,
  BadgeDollarSign,
  PenLine,
  Briefcase,
  TrendingUp,
  Gift,
  Banknote,
  CreditCard,
  Smartphone,
  Landmark,
  Wallet,
  LucideIcon,
} from "lucide-react";
import { getPaymentMode } from "@/lib/finance";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Food & Dining": UtensilsCrossed,
  Groceries: ShoppingCart,
  Transport: Car,
  Shopping: ShoppingBag,
  "Rent & Housing": Home,
  Utilities: Zap,
  Entertainment: Clapperboard,
  Health: HeartPulse,
  Education: GraduationCap,
  Travel: Plane,
  Subscriptions: Repeat,
  Other: CircleEllipsis,
  Salary: BadgeDollarSign,
  Freelance: PenLine,
  Business: Briefcase,
  Investment: TrendingUp,
  Gift: Gift,
};

const MODE_ICONS: Record<string, LucideIcon> = {
  CASH: Banknote,
  CARD: CreditCard,
  UPI: Smartphone,
  BANK: Landmark,
  WALLET: Wallet,
};

export function CategoryIcon({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const Icon = CATEGORY_ICONS[category] ?? CircleEllipsis;
  return <Icon className={className ?? "h-4 w-4"} />;
}

export function PaymentModeIcon({
  mode,
  className,
}: {
  mode: string;
  className?: string;
}) {
  const Icon = MODE_ICONS[mode] ?? Banknote;
  return <Icon className={className ?? "h-4 w-4"} />;
}

export { getPaymentMode };
