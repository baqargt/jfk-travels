import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "gray" | "green" | "red" | "amber" | "blue" | "violet";

const variants: Record<Variant, string> = {
  gray: "bg-slate-100 text-slate-600 ring-slate-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  blue: "bg-brand-50 text-brand-700 ring-brand-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
};

const statusMap: Record<string, Variant> = {
  Active: "green",
  Completed: "green",
  Approved: "green",
  Confirmed: "green",
  Issued: "green",
  Ticketed: "green",
  Paid: "green",
  Sent: "green",
  Pending: "amber",
  Partial: "amber",
  Hold: "amber",
  Due: "red",
  Rejected: "red",
  Void: "red",
  Cancelled: "red",
  Suspended: "red",
  Failed: "red",
  Overdue: "red",
  Refunded: "gray",
  Inactive: "gray",
  Expired: "gray",
  Exchanged: "blue",
};

export function Badge({
  variant = "gray",
  className,
  children,
}: {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusMap[status] ?? "gray"}>{status}</Badge>;
}

export default Badge;
