import { useEffect, useState } from "react";
import { Navigate, NavLink, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "@/api/client";
import type { Quote, SupplierOffer } from "@/api/types";
import PageHeader from "@/components/ui/PageHeader";
import ResultsGrid from "@/features/booking/components/ResultsGrid";
import SearchForm from "@/features/booking/components/SearchForm";
import FlightsSearchForm from "@/features/booking/components/FlightsSearchForm";
import { SERVICES, serviceBySlug } from "@/features/booking/config";
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
  const [results, setResults] = useState<BookingResult[]>([]);
  const [formKey, setFormKey] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    setResults([]);
    setLoading(false);
    setTravelers({ adults: 1, children: 0, infants: 0 });
    setFormKey((key) => key + 1);
  }, [serviceSlug]);

  if (!config) return <Navigate to={PATHS.booking.flights} replace />;

  const runSearch = async (filters: Record<string, unknown>) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<{ items: SupplierOffer[] }>(`/booking-searches/${serviceSlug}`, {
        method: "POST",
        body: { filters },
      });
      setResults(response.items.map((offer) => ({
        id: offer.id,
        title: offer.title,
        subtitle: offer.subtitle,
        price: Number(offer.price),
        meta: [["Provider", "Fake supplier"], ["Currency", offer.currency]],
        search: filters as Record<string, string | number | boolean>,
      })));
    } catch (reason) {
      setResults([]);
      setError(reason instanceof Error ? reason.message : "Search could not be completed.");
    } finally {
      setLoading(false);
    }
  };

  const handleFlightSearch = (filters: FlightSearchFilters) => {
    setTravelers(filters.travelers);
    void runSearch(filters as unknown as Record<string, unknown>);
  };

  const handleSearch = (filters: BookingSearchFilters) => {
    void runSearch(filters);
  };

  const handleReset = () => {
    setResults([]);
    setLoading(false);
    setTravelers({ adults: 1, children: 0, infants: 0 });
    setFormKey((key) => key + 1);
  };

  const handleBook = async (result: BookingResult) => {
    setError("");
    try {
      const quote = await apiRequest<Quote>("/quotes", {
        method: "POST",
        body: { serviceType: serviceSlug, offerId: result.id, search: result.search },
      });
      const params = new URLSearchParams({
        adults: String(travelers.adults), children: String(travelers.children), infants: String(travelers.infants),
      });
      navigate(`${PATHS.booking.passengers(quote.id)}?${params.toString()}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Quote could not be created.");
    }
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
        {error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
          <h2 className="text-sm font-semibold text-slate-900">Available options <span className="font-normal text-slate-400">· {results.length} results</span></h2>
          <p className="text-xs text-slate-400">Prices are repriced before confirmation</p>
        </div>
        <div key={`${config.slug}-${loading}`} className="animate-fade-up">
          <ResultsGrid results={results} loading={loading} onBook={config.slug === "flights" ? (result) => void handleBook(result) : undefined} onReset={handleReset} />
        </div>
      </section>
    </>
  );
}
