import type { ReactNode } from "react";
import { Plane } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">{children}</div>
  );
}

export function BrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-brand-950 to-brand-800 p-10 text-white lg:flex">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 25%, white 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 shadow-lg shadow-brand-600/40">
            <Plane className="h-6 w-6" />
          </span>
          <div>
            <p className="text-lg font-bold tracking-tight">JFK Travel Group</p>
            <p className="text-xs font-medium tracking-widest text-brand-300 uppercase">
              Enterprise ERP Suite
            </p>
          </div>
        </div>

        <h1 className="mt-16 max-w-md text-4xl leading-tight font-bold tracking-tight">
          One platform for every journey your agency sells.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
          Flights, hotels, insurance, transfers and holidays — booked, priced,
          reported and settled in a single enterprise workspace.
        </p>

        <ul className="mt-10 space-y-4 text-sm text-slate-200">
          {[
            "Global travel engine across 8 service verticals",
            "Real-time cash, credit & temporary limit controls",
            "Role-based access for branches and franchises",
            "DSR, air, hotel and refund reporting built-in",
          ].map((point) => (
            <li key={point} className="flex items-start gap-3">
              <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500/30 text-brand-300">
                <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 6.5L5 9l5-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-slate-500">
        © 2026 JFK Travel Group LLC · IATA 336-4 2048 5 · All rights reserved.
      </p>
    </div>
  );
}
