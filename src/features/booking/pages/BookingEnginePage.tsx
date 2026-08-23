import { useState } from "react";
import { Navigate, NavLink, useParams } from "react-router-dom";
import PageHeader from "@/components/ui/PageHeader";
import ResultsGrid from "@/features/booking/components/ResultsGrid";
import SearchForm from "@/features/booking/components/SearchForm";
import { SERVICES, serviceBySlug } from "@/features/booking/config";
import { bookingResults } from "@/lib/bookingData";
import { PATHS } from "@/routes/paths";
import { cn } from "@/lib/utils";

export default function BookingEnginePage() {
  const { service } = useParams<{ service: string }>();
  const config = serviceBySlug(service);
  const [loading, setLoading] = useState(false);

  if (!config) {
    return <Navigate to={PATHS.booking.flights} replace />;
  }

  const results = bookingResults[config.slug] ?? [];

  return (
    <>
      <PageHeader
        title={`${config.label} Booking`}
        description={config.description}
      />

      <nav className="mb-6 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {SERVICES.map((s) => (
          <NavLink
            key={s.slug}
            to={`${PATHS.booking.root}/${s.slug}`}
            className={({ isActive }) =>
              cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                isActive
                  ? "border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-600/25"
                  : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700",
              )
            }
          >
            <s.icon className="h-4 w-4" />
            {s.label}
          </NavLink>
        ))}
      </nav>

      <SearchForm config={config} onSearch={() => setLoading(true)} />

      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
          <h2 className="text-sm font-semibold text-slate-900">
            Available options <span className="font-normal text-slate-400">· {results.length} results</span>
          </h2>
          <p className="text-xs text-slate-400">Prices include your active pricing model (PRM-01)</p>
        </div>
        <div key={config.slug + loading} className="animate-fade-up">
          <ResultsGrid results={results} loading={loading} />
        </div>
      </section>
    </>
  );
}
