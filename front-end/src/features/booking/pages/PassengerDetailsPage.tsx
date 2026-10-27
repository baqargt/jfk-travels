import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Eye,
  Search,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { FormField, Input, Label, Select, Textarea } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import { countries } from "@/lib/bookingData";
import { apiRequest } from "@/api/client";
import { apiStatus, type ApiPage, type ApiTraveller, type Quote } from "@/api/types";
import { cn } from "@/lib/utils";
import { PATHS } from "@/routes/paths";
import type { BookingResult, TravelerCounts, TravellerProfile } from "@/types";

type PassengerType = "Adult" | "Child" | "Infant";
type BookingAction = "hold" | "cart" | "payment";

interface PassengerForm {
  id: string;
  type: PassengerType;
  number: number;
  profileId: string;
  title: string;
  firstName: string;
  lastName: string;
  dob: string;
  passportNumber: string;
  passportExpiry: string;
  issuedBy: string;
  nationality: string;
  originMobile: string;
  email: string;
  destinationMobile: string;
  frequentFlyer: string;
  clubMember: boolean;
  saveAsProfile: boolean;
  ancillaries: "N/A" | "Available";
  meal: string;
  seating: string;
  wheelchair: boolean;
  otherService: string;
  okToBoard: boolean;
  misc: string;
}

type PassengerErrors = Record<string, string>;

const defaultCounts: TravelerCounts = { adults: 1, children: 0, infants: 0 };
const requiredFields: Array<keyof PassengerForm> = [
  "title",
  "firstName",
  "lastName",
  "dob",
  "passportNumber",
  "passportExpiry",
  "nationality",
];

const fieldLabels: Partial<Record<keyof PassengerForm, string>> = {
  title: "Title",
  firstName: "First name",
  lastName: "Last name",
  dob: "Date of birth",
  passportNumber: "Passport number",
  passportExpiry: "Passport expiry",
  nationality: "Nationality",
};

function parseCounts(params: URLSearchParams): TravelerCounts | null {
  const values = {
    adults: Number(params.get("adults")),
    children: Number(params.get("children")),
    infants: Number(params.get("infants")),
  };

  const valid =
    Number.isInteger(values.adults) && values.adults >= 1 && values.adults <= 6 &&
    Number.isInteger(values.children) && values.children >= 0 && values.children <= 4 &&
    Number.isInteger(values.infants) && values.infants >= 0 && values.infants <= 2;

  return valid ? values : null;
}

function newPassenger(type: PassengerType, number: number): PassengerForm {
  return {
    id: `${type.toLowerCase()}-${number}`,
    type,
    number,
    profileId: "",
    title: "",
    firstName: "",
    lastName: "",
    dob: "",
    passportNumber: "",
    passportExpiry: "",
    issuedBy: "",
    nationality: "",
    originMobile: "",
    email: "",
    destinationMobile: "",
    frequentFlyer: "",
    clubMember: false,
    saveAsProfile: false,
    ancillaries: "N/A",
    meal: "None",
    seating: "No preference",
    wheelchair: false,
    otherService: "",
    okToBoard: false,
    misc: "",
  };
}

function createPassengers(counts: TravelerCounts) {
  return [
    ...Array.from({ length: counts.adults }, (_, index) => newPassenger("Adult", index + 1)),
    ...Array.from({ length: counts.children }, (_, index) => newPassenger("Child", index + 1)),
    ...Array.from({ length: counts.infants }, (_, index) => newPassenger("Infant", index + 1)),
  ];
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

function ProfileSearch({
  profiles,
  query,
  selectedId,
  usedIds,
  onQueryChange,
  onSelect,
}: {
  profiles: TravellerProfile[];
  query: string;
  selectedId: string;
  usedIds: Set<string>;
  onQueryChange: (value: string) => void;
  onSelect: (profile: TravellerProfile) => void;
}) {
  const [focused, setFocused] = useState(false);
  const normalized = query.trim().toLowerCase();
  const matches = profiles.filter((profile) => {
    if (usedIds.has(profile.id) && profile.id !== selectedId) return false;
    if (!normalized) return true;
    return [profile.name, profile.email, profile.phone, profile.passport]
      .join(" ")
      .toLowerCase()
      .includes(normalized);
  });

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 150)}
        placeholder="Search name, email, passport or phone"
        className="pl-9"
        aria-label="Search Traveller Profile"
        autoComplete="off"
      />
      {focused && matches.length > 0 && (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
          {matches.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onSelect(profile);
                setFocused(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-slate-50",
                selectedId === profile.id && "bg-brand-50",
              )}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                {profile.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-800">{profile.name}</span>
                <span className="block truncate text-xs text-slate-500">{profile.passport} · {profile.email}</span>
              </span>
              <span className="shrink-0 text-[10px] font-medium text-slate-400">{profile.id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckOption({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
      />
      <span>
        <span className="block text-sm font-medium text-slate-700">{label}</span>
        {description && <span className="block text-xs text-slate-400">{description}</span>}
      </span>
    </label>
  );
}

function PassengerCard({
  profiles,
  passenger,
  passengerIndex,
  searchQuery,
  usedProfileIds,
  errors,
  countryOptions,
  onSearchQueryChange,
  onSelectProfile,
  onChange,
}: {
  profiles: TravellerProfile[];
  passenger: PassengerForm;
  passengerIndex: number;
  searchQuery: string;
  usedProfileIds: Set<string>;
  errors: PassengerErrors;
  countryOptions: string[];
  onSearchQueryChange: (value: string) => void;
  onSelectProfile: (profile: TravellerProfile) => void;
  onChange: <K extends keyof PassengerForm>(field: K, value: PassengerForm[K]) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const error = (field: keyof PassengerForm) => errors[`${passenger.id}.${field}`];
  const hasErrors = Object.keys(errors).some((key) => key.startsWith(`${passenger.id}.`));

  useEffect(() => {
    if (hasErrors) setExpanded(true);
  }, [hasErrors]);

  return (
    <section className={cn("overflow-hidden rounded-xl border bg-white shadow-sm", hasErrors ? "border-rose-300" : "border-slate-200")}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-700">
            <UserRound className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-slate-900">{passenger.type} {passenger.number}</span>
            <span className="block text-xs text-slate-500">
              {passenger.firstName || passenger.lastName
                ? `${passenger.firstName} ${passenger.lastName}`.trim()
                : passengerIndex === 0 ? "Lead passenger" : "Passenger details"}
            </span>
          </span>
        </span>
        <span className="flex items-center gap-2">
          {hasErrors && <span className="text-xs font-medium text-rose-600">Needs attention</span>}
          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", expanded && "rotate-180")} />
        </span>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-5">
          <div className="mb-6">
            <Label>Search Traveller Profile</Label>
            <ProfileSearch
              profiles={profiles}
              query={searchQuery}
              selectedId={passenger.profileId}
              usedIds={usedProfileIds}
              onQueryChange={onSearchQueryChange}
              onSelect={onSelectProfile}
            />
            <p className="mt-1.5 text-xs text-slate-400">Select an existing profile to prefill available details.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <FormField label="Title" required error={error("title")}>
              <Select id={`${passenger.id}-title`} value={passenger.title} onChange={(event) => onChange("title", event.target.value)}>
                <option value="">Select</option>
                {["Mr", "Mrs", "Ms", "Miss", "Master", "Dr"].map((title) => <option key={title}>{title}</option>)}
              </Select>
            </FormField>
            <FormField label="First Name" required error={error("firstName")}>
              <Input id={`${passenger.id}-firstName`} value={passenger.firstName} onChange={(event) => onChange("firstName", event.target.value)} />
            </FormField>
            <FormField label="Last Name" required error={error("lastName")}>
              <Input id={`${passenger.id}-lastName`} value={passenger.lastName} onChange={(event) => onChange("lastName", event.target.value)} />
            </FormField>
            <FormField label="DOB" required error={error("dob")}>
              <Input id={`${passenger.id}-dob`} type="date" value={passenger.dob} onChange={(event) => onChange("dob", event.target.value)} />
            </FormField>

            <FormField label="Passport" required error={error("passportNumber")}>
              <Input id={`${passenger.id}-passportNumber`} value={passenger.passportNumber} onChange={(event) => onChange("passportNumber", event.target.value.toUpperCase())} className="font-mono" />
            </FormField>
            <FormField label="Expiry" required error={error("passportExpiry")}>
              <Input id={`${passenger.id}-passportExpiry`} type="date" value={passenger.passportExpiry} onChange={(event) => onChange("passportExpiry", event.target.value)} />
            </FormField>
            <FormField label="Issued By">
              <Select value={passenger.issuedBy} onChange={(event) => onChange("issuedBy", event.target.value)}>
                <option value="">Select country</option>
                {countryOptions.map((country) => <option key={country}>{country}</option>)}
              </Select>
            </FormField>
            <FormField label="Nationality" required error={error("nationality")}>
              <Select id={`${passenger.id}-nationality`} value={passenger.nationality} onChange={(event) => onChange("nationality", event.target.value)}>
                <option value="">Select nationality</option>
                {countryOptions.map((country) => <option key={country}>{country}</option>)}
              </Select>
            </FormField>

            <FormField label="Origin Mobile" required={passengerIndex === 0} error={error("originMobile")}>
              <Input id={`${passenger.id}-originMobile`} type="tel" value={passenger.originMobile} onChange={(event) => onChange("originMobile", event.target.value)} placeholder="+92 300 0000000" />
            </FormField>
            <FormField label="Email" required={passengerIndex === 0} error={error("email")}>
              <Input id={`${passenger.id}-email`} type="email" value={passenger.email} onChange={(event) => onChange("email", event.target.value)} placeholder="name@example.com" />
            </FormField>
            <FormField label="Destination Mobile">
              <Input type="tel" value={passenger.destinationMobile} onChange={(event) => onChange("destinationMobile", event.target.value)} placeholder="Optional" />
            </FormField>
            <FormField label="Frequent Flyer">
              <Input value={passenger.frequentFlyer} onChange={(event) => onChange("frequentFlyer", event.target.value.toUpperCase())} placeholder="e.g. EK-0100000" />
            </FormField>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CheckOption checked={passenger.clubMember} onChange={(value) => onChange("clubMember", value)} label="Club Member" description="Apply the passenger's membership benefits." />
            <CheckOption checked={passenger.saveAsProfile} onChange={(value) => onChange("saveAsProfile", value)} label="Save as Traveller Profile" description="Mock only — no permanent profile will be created." />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 border-t border-slate-100 pt-5 lg:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Ancillaries</h3>
              <FormField label="Availability">
                <Select value={passenger.ancillaries} onChange={(event) => onChange("ancillaries", event.target.value as PassengerForm["ancillaries"])}>
                  <option>N/A</option>
                  <option>Available</option>
                </Select>
              </FormField>
            </div>
            <div className="space-y-3 rounded-lg bg-slate-50 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Special Request</h3>
              <FormField label="Meal">
                <Select value={passenger.meal} onChange={(event) => onChange("meal", event.target.value)}>
                  {["None", "Standard", "Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free"].map((meal) => <option key={meal}>{meal}</option>)}
                </Select>
              </FormField>
              <FormField label="Seating">
                <Select value={passenger.seating} onChange={(event) => onChange("seating", event.target.value)}>
                  {["No preference", "Window", "Aisle", "Middle"].map((seat) => <option key={seat}>{seat}</option>)}
                </Select>
              </FormField>
              <CheckOption checked={passenger.wheelchair} onChange={(value) => onChange("wheelchair", value)} label="Wheel Chair" />
            </div>
            <div className="space-y-3 rounded-lg bg-slate-50 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Remarks</h3>
              <FormField label="Other Service">
                <Input value={passenger.otherService} onChange={(event) => onChange("otherService", event.target.value)} placeholder="Optional request" />
              </FormField>
              <CheckOption checked={passenger.okToBoard} onChange={(value) => onChange("okToBoard", value)} label="OK to Board" />
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">MISC</h3>
              <FormField label="Free Text">
                <Textarea rows={5} value={passenger.misc} onChange={(event) => onChange("misc", event.target.value)} placeholder="Additional booking notes" />
              </FormField>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ItinerarySummary({ result, passengerCount }: { result: BookingResult; passengerCount: number }) {
  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Selected itinerary</p>
          <h2 className="mt-1 text-base font-bold text-slate-900">{result.title}</h2>
          <p className="text-sm text-slate-600">{result.subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold tabular-nums text-slate-900">${result.price.toLocaleString()}</p>
          <p className="text-xs text-slate-500">{passengerCount} passenger{passengerCount === 1 ? "" : "s"}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-brand-100 pt-4 sm:grid-cols-4">
        {result.meta.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className="mt-0.5 text-xs font-semibold text-slate-700">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function PassengerDetailsPage() {
  const { resultId } = useParams<{ resultId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: quote, isLoading: quoteLoading, error: quoteError } = useQuery({
    queryKey: ["quote", resultId],
    queryFn: () => apiRequest<Quote>(`/quotes/${resultId}`),
    enabled: Boolean(resultId),
  });
  const { data: travellerData } = useQuery({
    queryKey: ["travellers"],
    queryFn: () => apiRequest<ApiPage<ApiTraveller>>("/travellers?page_size=100"),
  });
  const travellerProfiles: TravellerProfile[] = (travellerData?.items ?? []).map((value) => ({
    id: value.id,
    name: `${value.firstName} ${value.lastName}`,
    email: value.email,
    phone: value.phone,
    city: value.city,
    country: value.country,
    passport: value.passportMasked,
    passportExpiry: value.passportExpiry ?? "",
    bookings: 0,
    lifetimeValue: 0,
    status: apiStatus(value.status),
    joinedAt: value.createdAt,
    history: [],
  }));
  const result: BookingResult | undefined = quote ? {
    id: quote.id,
    title: quote.offer.title,
    subtitle: quote.offer.subtitle,
    price: Number(quote.totalAmount),
    meta: [["Provider", "Fake supplier"], ["Currency", quote.currency]],
    search: {},
  } : undefined;
  const counts = parseCounts(searchParams);
  const [passengers, setPassengers] = useState<PassengerForm[]>(() => createPassengers(counts ?? defaultCounts));
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<PassengerErrors>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [holdAvailability, setHoldAvailability] = useState<"N/A" | "Available">("Available");
  const [outcome, setOutcome] = useState<{ action: BookingAction; reference: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const countryOptions = useMemo(
    () => Array.from(new Set([...countries, ...travellerProfiles.map((profile) => profile.country)])).sort(),
    [travellerProfiles],
  );
  const usedProfileIds = useMemo(
    () => new Set(passengers.map((passenger) => passenger.profileId).filter(Boolean)),
    [passengers],
  );

  if (!counts) {
    return <Navigate to={PATHS.booking.flights} replace />;
  }
  if (quoteLoading) return <p className="p-8 text-sm text-slate-500">Loading repriced quote...</p>;
  if (!result || quoteError) return <Navigate to={PATHS.booking.flights} replace />;

  const updatePassenger = <K extends keyof PassengerForm>(index: number, field: K, value: PassengerForm[K]) => {
    setPassengers((current) => current.map((passenger, passengerIndex) =>
      passengerIndex === index ? { ...passenger, [field]: value } : passenger,
    ));
    setErrors((current) => {
      const next = { ...current };
      delete next[`${passengers[index].id}.${field}`];
      return next;
    });
    setOutcome(null);
  };

  const selectProfile = (index: number, profile: TravellerProfile) => {
    const name = splitName(profile.name);
    setPassengers((current) => current.map((passenger, passengerIndex) => passengerIndex === index ? {
      ...passenger,
      profileId: profile.id,
      firstName: name.firstName,
      lastName: name.lastName,
      passportNumber: profile.passport,
      passportExpiry: profile.passportExpiry,
      nationality: profile.country,
      issuedBy: profile.country,
      originMobile: profile.phone,
      email: profile.email,
      saveAsProfile: false,
    } : passenger));
    setSearchQueries((current) => ({ ...current, [passengers[index].id]: profile.name }));
    setErrors((current) => {
      const next = { ...current };
      ["profileId", "firstName", "lastName", "passportNumber", "passportExpiry", "nationality", "originMobile", "email"]
        .forEach((field) => delete next[`${passengers[index].id}.${field}`]);
      return next;
    });
    setOutcome(null);
  };

  const validate = (action: BookingAction) => {
    const nextErrors: PassengerErrors = {};
    const today = new Date().toISOString().slice(0, 10);

    passengers.forEach((passenger, index) => {
      requiredFields.forEach((field) => {
        if (!String(passenger[field]).trim()) {
          nextErrors[`${passenger.id}.${field}`] = `${fieldLabels[field]} is required.`;
        }
      });
      if (passenger.passportExpiry && passenger.passportExpiry <= today) {
        nextErrors[`${passenger.id}.passportExpiry`] = "Passport must not be expired.";
      }
      if (index === 0) {
        if (!passenger.originMobile.trim()) nextErrors[`${passenger.id}.originMobile`] = "Origin mobile is required.";
        if (!passenger.email.trim()) {
          nextErrors[`${passenger.id}.email`] = "Email is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.email)) {
          nextErrors[`${passenger.id}.email`] = "Enter a valid email address.";
        }
      } else if (passenger.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.email)) {
        nextErrors[`${passenger.id}.email`] = "Enter a valid email address.";
      }
    });

    passengers.forEach((passenger) => {
      if (passenger.profileId && passengers.filter((item) => item.profileId === passenger.profileId).length > 1) {
        nextErrors[`${passenger.id}.profileId`] = "This Traveller Profile is already assigned.";
      }
    });

    if (action === "payment" && !paymentMethod) nextErrors.paymentMethod = "Select a payment method.";
    if (action === "hold" && holdAvailability === "N/A") nextErrors.holdAvailability = "Hold is not available for this selection.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      window.setTimeout(() => {
        const firstField = Object.keys(nextErrors).find((key) => key.includes("."));
        if (firstField) document.getElementById(firstField.replace(".", "-"))?.focus();
      });
      return false;
    }
    return true;
  };

  const completeAction = async (action: BookingAction) => {
    if (!validate(action)) return;
    if (action !== "payment") return;
    setSubmitting(true);
    setApiError("");
    try {
      const booking = await apiRequest<{ reference: string }>(`/quotes/${resultId}/confirm`, {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: {
          passengers: passengers.map((passenger) => ({
            travellerId: passenger.profileId || null,
            passengerType: passenger.type.toLowerCase(),
            snapshot: passenger,
          })),
        },
      });
      setOutcome({ action, reference: booking.reference });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (reason) {
      setApiError(reason instanceof Error ? reason.message : "Booking could not be confirmed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent) => event.preventDefault();
  const actionCopy = outcome?.action === "hold"
    ? "Booking held successfully"
    : outcome?.action === "cart"
      ? "Booking added to cart"
      : "Payment accepted and booking confirmed";

  return (
    <>
      <PageHeader
        title="Passenger Details"
        description="Complete traveler information and choose how to finalize this booking."
        actions={<Button variant="secondary" onClick={() => navigate(-1)}>Back to results</Button>}
      />

      {outcome && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3" role="status" aria-live="polite">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">{actionCopy}</p>
            <p className="text-xs text-emerald-700">Reference {outcome.reference} · Booking saved successfully.</p>
          </div>
        </div>
      )}

      <ItinerarySummary result={result} passengerCount={passengers.length} />

      {apiError && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{apiError}</p>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        {passengers.map((passenger, index) => (
          <PassengerCard
            profiles={travellerProfiles}
            key={passenger.id}
            passenger={passenger}
            passengerIndex={index}
            searchQuery={searchQueries[passenger.id] ?? ""}
            usedProfileIds={usedProfileIds}
            errors={errors}
            countryOptions={countryOptions}
            onSearchQueryChange={(value) => {
              setSearchQueries((current) => ({ ...current, [passenger.id]: value }));
              if (passenger.profileId) updatePassenger(index, "profileId", "");
            }}
            onSelectProfile={(profile) => selectProfile(index, profile)}
            onChange={(field, value) => updatePassenger(index, field, value)}
          />
        ))}

        <Card title="Complete Booking" description="Choose one outcome for this booking.">
          {(errors.holdAvailability || errors.paymentMethod) && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              <AlertCircle className="h-4 w-4" />
              {errors.holdAvailability ?? errors.paymentMethod}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField label="Hold">
              <Select value={holdAvailability} onChange={(event) => setHoldAvailability(event.target.value as typeof holdAvailability)}>
                <option>N/A</option>
                <option>Available</option>
              </Select>
            </FormField>
            <FormField label="Add to Cart">
              <Input value="Yes" disabled />
            </FormField>
            <FormField label="Payment" error={errors.paymentMethod}>
              <Select value={paymentMethod} onChange={(event) => { setPaymentMethod(event.target.value); setErrors((current) => ({ ...current, paymentMethod: "" })); }}>
                <option value="">Select payment method</option>
                <option>Credit Card</option>
                <option>Credit</option>
                <option>Cash</option>
              </Select>
            </FormField>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-5">
            <Button variant="ghost" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-4 w-4" />
              Preview Details
            </Button>
            <Button variant="secondary" disabled title="Hold workflow is unavailable for the fake supplier">
              <Clock3 className="h-4 w-4" />
              Hold Booking
            </Button>
            <Button variant="secondary" disabled title="Cart workflow is unavailable for the fake supplier">
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </Button>
            <Button onClick={() => void completeAction("payment")} disabled={submitting || Boolean(outcome)}>
              <CreditCard className="h-4 w-4" />
              {submitting ? "Confirming..." : "Pay & Confirm"}
            </Button>
          </div>
        </Card>
      </form>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Booking Preview"
        subtitle={`${result.title} · ${passengers.length} passenger${passengers.length === 1 ? "" : "s"}`}
        size="xl"
        footer={<Button onClick={() => setPreviewOpen(false)}>Continue Editing</Button>}
      >
        <div className="space-y-5">
          <ItinerarySummary result={result} passengerCount={passengers.length} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {passengers.map((passenger) => (
              <section key={passenger.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">{passenger.type} {passenger.number}</h3>
                  {passenger.profileId && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">{passenger.profileId}</span>}
                </div>
                <p className="mt-1 text-sm font-medium text-slate-800">{[passenger.title, passenger.firstName, passenger.lastName].filter(Boolean).join(" ") || "Details not entered"}</p>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div><dt className="text-slate-400">Passport</dt><dd className="font-medium text-slate-700">{passenger.passportNumber || "—"}</dd></div>
                  <div><dt className="text-slate-400">Nationality</dt><dd className="font-medium text-slate-700">{passenger.nationality || "—"}</dd></div>
                  <div><dt className="text-slate-400">Meal</dt><dd className="font-medium text-slate-700">{passenger.meal}</dd></div>
                  <div><dt className="text-slate-400">Seat</dt><dd className="font-medium text-slate-700">{passenger.seating}</dd></div>
                  <div><dt className="text-slate-400">Wheel Chair</dt><dd className="font-medium text-slate-700">{passenger.wheelchair ? "Requested" : "No"}</dd></div>
                  <div><dt className="text-slate-400">OK to Board</dt><dd className="font-medium text-slate-700">{passenger.okToBoard ? "Yes" : "No"}</dd></div>
                </dl>
                {(passenger.otherService || passenger.misc) && (
                  <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">{passenger.otherService || passenger.misc}</p>
                )}
              </section>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
            <span className="text-sm text-slate-600">Payment method</span>
            <span className="text-sm font-semibold text-slate-900">{paymentMethod || "Not selected"}</span>
          </div>
        </div>
      </Modal>
    </>
  );
}
