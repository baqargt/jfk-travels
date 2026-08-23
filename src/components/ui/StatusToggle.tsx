import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatusToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: boolean;
}

export default function StatusToggle({ checked, onChange, disabled = false, label = true }: StatusToggleProps) {
  const [optimistic, setOptimistic] = useState(checked);
  const value = optimistic;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => {
        setOptimistic(!value);
        onChange(!value);
      }}
      className={cn(
        "inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 rounded-full",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "relative inline-flex h-5.5 w-10 shrink-0 items-center rounded-full transition-colors",
          value ? "bg-emerald-500" : "bg-slate-300",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
            value ? "translate-x-5" : "translate-x-1",
          )}
        />
      </span>
      {label && (
        <span className={cn("text-xs font-medium", value ? "text-emerald-600" : "text-slate-400")}>
          {value ? "Active" : "Inactive"}
        </span>
      )}
    </button>
  );
}
