import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

function split(ms: number) {
  const clamped = Math.max(0, ms);
  const d = Math.floor(clamped / 86_400_000);
  const h = Math.floor((clamped % 86_400_000) / 3_600_000);
  const m = Math.floor((clamped % 3_600_000) / 60_000);
  const s = Math.floor((clamped % 60_000) / 1000);
  return { d, h, m, s };
}

export default function ExpiryTimer({ expiresAt }: { expiresAt: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = expiresAt - now;
  const expired = remaining <= 0;
  const urgent = remaining < 24 * 3_600_000;
  const { d, h, m, s } = split(remaining);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs font-semibold tabular-nums",
        expired && "bg-slate-100 text-slate-400 line-through",
        !expired && urgent && "animate-pulse bg-rose-50 text-rose-600 ring-1 ring-rose-200 ring-inset",
        !expired && !urgent && "bg-amber-50 text-amber-700 ring-1 ring-amber-200 ring-inset",
      )}
    >
      <Timer className="h-3.5 w-3.5" />
      {expired
        ? "expired"
        : `${d > 0 ? `${d}d ` : ""}${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`}
    </span>
  );
}
