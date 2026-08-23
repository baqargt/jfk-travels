import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  current: number;
}

export default function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="flex w-full items-center">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step} className={cn("flex items-center", i < steps.length - 1 && "flex-1")}>
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors",
                  done && "bg-brand-600 text-white",
                  active && "bg-white text-brand-700 ring-2 ring-brand-600",
                  !done && !active && "bg-slate-100 text-slate-400 ring-1 ring-slate-200",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium whitespace-nowrap sm:block",
                  active ? "text-slate-900" : done ? "text-slate-600" : "text-slate-400",
                )}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className={cn("mx-3 h-0.5 flex-1 rounded-full", done ? "bg-brand-600" : "bg-slate-200")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
