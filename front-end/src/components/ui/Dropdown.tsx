import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/useClickOutside";

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  panelClassName?: string;
}

export default function Dropdown({ trigger, children, align = "right", panelClassName }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
      >
        {trigger}
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "animate-scale-in absolute z-50 mt-2 origin-top rounded-xl border border-slate-200 bg-white shadow-xl",
            align === "right" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
