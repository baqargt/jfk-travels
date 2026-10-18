import { useEffect, useState, type FormEvent } from "react";
import { RotateCcw, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import { Label, Input, Select } from "@/components/ui/Input";
import type { ServiceConfig } from "@/features/booking/config";
import type { BookingSearchFilters } from "@/types";

interface SearchFormProps {
  config: ServiceConfig;
  onSearch: (filters: BookingSearchFilters) => void;
  onReset: () => void;
}

const initialValues = (config: ServiceConfig): BookingSearchFilters => ({
  ...Object.fromEntries(config.fields.map((field) => [field.name, ""])),
  ...(config.showTravelers ? { adults: "1", children: "0", rooms: "1" } : {}),
});

export default function SearchForm({ config, onSearch, onReset }: SearchFormProps) {
  const [tripType, setTripType] = useState(config.tripTypes?.[0] ?? "");
  const [values, setValues] = useState<BookingSearchFilters>(() => initialValues(config));
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setTripType(config.tripTypes?.[0] ?? "");
    setValues(initialValues(config));
    setSearching(false);
  }, [config]);

  const setValue = (name: string, value: string) => setValues((current) => ({ ...current, [name]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSearching(true);
    onSearch(values);
    window.setTimeout(() => setSearching(false), 700);
  };

  const handleReset = () => {
    setTripType(config.tripTypes?.[0] ?? "");
    setValues(initialValues(config));
    setSearching(false);
    onReset();
  };

  return (
    <form onSubmit={handleSubmit} onReset={handleReset} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {config.tripTypes && (
        <div className="mb-5 inline-flex rounded-lg bg-slate-100 p-1">
          {config.tripTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTripType(type)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
                tripType === type ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {config.fields.map((field) => (
          <div key={field.name} className={field.colSpan === 2 ? "md:col-span-2" : undefined}>
            <Label htmlFor={`${config.slug}-${field.name}`}>{field.label}</Label>
            {field.type === "select" ? (
              <Select
                id={`${config.slug}-${field.name}`}
                name={field.name}
                value={values[field.name] ?? ""}
                onChange={(event) => setValue(field.name, event.target.value)}
              >
                <option value="">Select...</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </Select>
            ) : (
              <Input
                id={`${config.slug}-${field.name}`}
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                value={values[field.name] ?? ""}
                onChange={(event) => setValue(field.name, event.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      {config.showTravelers && (
        <div className="mt-5 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
          {[
            { name: "adults", label: "Adults", options: ["1", "2", "3", "4", "5", "6"] },
            { name: "children", label: "Children", options: ["0", "1", "2", "3", "4"] },
            { name: "rooms", label: "Rooms", options: ["1", "2", "3", "4"] },
          ].map(({ name, label, options }) => (
            <div key={name}>
              <Label htmlFor={`${config.slug}-${name}`}>{label}</Label>
              <Select
                id={`${config.slug}-${name}`}
                name={name}
                value={values[name]}
                onChange={(event) => setValue(name, event.target.value)}
              >
                {options.map((option) => <option key={option} value={option}>{option}</option>)}
              </Select>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center justify-end gap-2">
        <Button type="reset" variant="ghost" size="sm">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
        <Button type="submit" disabled={searching}>
          <Search className="h-4 w-4" />
          {searching ? "Searching..." : `Search ${config.label}`}
        </Button>
      </div>
    </form>
  );
}
