import { useEffect, useState } from "react";
import { Navigate, NavLink, useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/ui/PageHeader";
import ResultsGrid from "@/features/booking/components/ResultsGrid";
import SearchForm from "@/features/booking/components/SearchForm";
import FlightsSearchForm from "@/features/booking/components/FlightsSearchForm";
import { filterBookingResults, filterFlightResults } from "@/features/booking/filterResults";
import { SERVICES, serviceBySlug } from "@/features/booking/config";
import { bookingResults } from "@/lib/bookingData";
import { PATHS } from "@/routes/paths";
import { cn } from "@/lib/utils";
import type { BookingResult, BookingSearchFilters, FlightSearchFilters, TravelerCounts } from "@/types";

export default function BookingEnginePage() {
  const { service } = useParams<{ service: string }>();
  const config = serviceBySlug(service);
  const navigate = useNavigate();
  const serviceSlug = config?.slug ?? "flights";
  const [loading, setLoading] = useState(false);
  const [travelers, setTravelers] = useState<TravelerCounts>({ adults: 1, children: 0, infants: 0 });
  const [results, setResults] = useState<BookingResult[]>(() => bookingResults[serviceSlug] ?? []);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    setResults(bookingResults[serviceSlug] ?? []);
    setLoading(false);
    setTravelers({ adults: 1, children: 0, infants: 0 });
    setFormKey((key) => key + 1);
  }, [serviceSlug]);

  if (!config) return <Navigate to={PATHS.booking.flights} replace />;

  const showLoading = () => {
    setLoading(true);
    window.setTimeout(() => setLoading(false), 700);
  };

  const handleFlightSearch = (filters: FlightSearchFilters) => {
    setTravelers(filters.travelers);
    setResults(filterFlightResults(bookingResults.flights, filters));
    showLoading();
  };

  const handleSearch = (filters: BookingSearchFilters) => {
    setResults(filterBookingResults(config.slug, bookingResults[config.slug] ?? [], filters));
    showLoading();
  };

  const handleReset = () => {
    setResults(bookingResults[config.slug] ?? []);
    setLoading(false);
    setTravelers({ adults: 1, children: 0, infants: 0 });
    setFormKey((key) => key + 1);
  };

  const handleBook = (result: BookingResult) => {
    const params = new URLSearchParams({
      adults: String(travelers.adults), children: String(travelers.children), infants: String(travelers.infants),
    });
    navigate(`${PATHS.booking.passengers(result.id)}?${params.toString()}`);
  };

  return (
    <>
      <PageHeader title={`${config.label} Booking`} description={config.description} />
      <nav className="mb-6 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {SERVICES.map((item) => (
          <NavLink
            key={item.slug}
            to={`${PATHS.booking.root}/${item.slug}`}
            className={({ isActive }) => cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
              isActive ? "border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-600/25" : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700",
            )}
          >
            <item.icon className="h-4 w-4" /> {item.label}
          </NavLink>
        ))}
      </nav>

      {config.slug === "flights" ? (
        <FlightsSearchForm key={`${config.slug}-${formKey}`} onSearch={handleFlightSearch} onTravelersChange={setTravelers} onReset={handleReset} />
      ) : (
        <SearchForm key={`${config.slug}-${formKey}`} config={config} onSearch={handleSearch} onReset={handleReset} />
      )}

      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
          <h2 className="text-sm font-semibold text-slate-900">Available options <span className="font-normal text-slate-400">· {results.length} results</span></h2>
          <p className="text-xs text-slate-400">Prices include your active pricing model (PRM-01)</p>
        </div>
        <div key={`${config.slug}-${loading}`} className="animate-fade-up">
          <ResultsGrid results={results} loading={loading} onBook={config.slug === "flights" ? handleBook : undefined} onReset={handleReset} />
        </div>
      </section>
    </>
  );
}
