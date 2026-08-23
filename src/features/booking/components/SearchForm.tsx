import { useState, type FormEvent } from "react";
import { RotateCcw, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import { Label, Input, Select } from "@/components/ui/Input";
import type { ServiceConfig } from "@/features/booking/config";
import { cabins } from "@/lib/bookingData";

interface SearchFormProps {
  config: ServiceConfig;
  onSearch: () => void;
}

export default function SearchForm({ config, onSearch }: SearchFormProps) {
  const [tripType, setTripType] = useState(config.tripTypes?.[0] ?? "");
  const [searching, setSearching] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSearching(true);
    onSearch();
    setTimeout(() => setSearching(false), 700);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      {config.tripTypes && (
        <div className="mb-5 inline-flex rounded-lg bg-slate-100 p-1">
          {config.tripTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTripType(t)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
                tripType === t ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {config.fields.map((field) => (
          <div key={field.name} className={field.colSpan === 2 ? "md:col-span-2" : undefined}>
            <Label>{field.label}</Label>
            {field.type === "select" ? (
              <Select defaultValue="">
                <option value="" disabled>
                  Select...
                </option>
                {field.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            ) : (
              <Input type={field.type} placeholder={field.placeholder} />
            )}
          </div>
        ))}
      </div>

      {config.showTravelers && (
        <div className="mt-5 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-4">
          {[
            { label: "Adults", options: ["1", "2", "3", "4", "5", "6"] },
            { label: "Children", options: ["0", "1", "2", "3", "4"] },
            ...(config.slug === "flights"
              ? [{ label: "Infants", options: ["0", "1", "2"] }]
              : [{ label: "Rooms", options: ["1", "2", "3", "4"] }]),
          ].map(({ label, options }) => (
            <div key={label}>
              <Label>{label}</Label>
              <Select defaultValue={options[0]}>
                {options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            </div>
          ))}
          {config.slug === "flights" && (
            <div>
              <Label>Cabin</Label>
              <Select defaultValue={cabins[0]}>
                {cabins.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex items-center justify-end gap-2">
        <Button type="reset" variant="ghost" size="sm">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
        <Button type="submit" disabled={searching}>
          <Search className="h-4 w-4" />
          {searching ? "Searching..." : `Search ${config.label}`}
        </Button>
      </div>
    </form>
  );
}
