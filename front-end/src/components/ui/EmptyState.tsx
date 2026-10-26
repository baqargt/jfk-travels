import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon: Icon = Inbox, title, message, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <span className="grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-400">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
