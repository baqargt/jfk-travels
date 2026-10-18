import { useState, type FormEvent } from "react";
import { Plus, RotateCcw, Search, Settings2, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Tabs from "@/components/ui/Tabs";
import FileUpload from "@/components/ui/FileUpload";
import { Label, Input, Select } from "@/components/ui/Input";
import { airlines, cabins } from "@/lib/bookingData";
import type { BookingFlightLeg, FlightSearchFilters, TravelerCounts } from "@/types";

interface FlightsSearchFormProps {
  onSearch: (filters: FlightSearchFilters) => void;
  onTravelersChange?: (travelers: TravelerCounts) => void;
  onReset: () => void;
}

type FlightTab = "one-way" | "round-trip" | "multi" | "flexi" | "import" | "sync" | "group-fare";
type GroupFareTab = "one-way" | "return" | "multi" | "specific";
interface EditableLeg extends BookingFlightLeg { id: number }

const flightTabs: { id: FlightTab; label: string }[] = [
  { id: "one-way", label: "One Way" }, { id: "round-trip", label: "Round Trip" },
  { id: "multi", label: "Multi City" }, { id: "flexi", label: "Flexi/Best Buy" },
  { id: "import", label: "Import" }, { id: "sync", label: "Sync" }, { id: "group-fare", label: "Group Fare" },
];
const groupFareTabs: { id: GroupFareTab; label: string }[] = [
  { id: "one-way", label: "One-Way" }, { id: "return", label: "Return" },
  { id: "multi", label: "Multi" }, { id: "specific", label: "Specific" },
];
const suppliers = ["Sabre", "Galileo", "Amadeus", "Airline Direct API's", "Consolidator"];
const currencies = ["AED", "USD", "EUR", "SAR", "PKR", "INR"];

let legCounter = 0;
const createLeg = (): EditableLeg => ({
  id: ++legCounter, origin: "", destination: "", depart: "", cabin: "Any", airline: "Any", time: "",
});
const createLegs = (count: number) => Array.from({ length: count }, createLeg);

function LegFields({ leg, onChange, onRemove, removable }: {
  leg: EditableLeg;
  onChange: (leg: EditableLeg) => void;
  onRemove: (id: number) => void;
  removable: boolean;
}) {
  const set = (field: keyof BookingFlightLeg, value: string) => onChange({ ...leg, [field]: value });
  return (
    <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4 md:grid-cols-6">
      <div><Label>From</Label><Input placeholder="JFK - New York" value={leg.origin} onChange={(e) => set("origin", e.target.value)} /></div>
      <div><Label>To</Label><Input placeholder="DXB - Dubai" value={leg.destination} onChange={(e) => set("destination", e.target.value)} /></div>
      <div><Label>Date</Label><Input type="date" value={leg.depart} onChange={(e) => set("depart", e.target.value)} /></div>
      <div>
        <Label>Cabin</Label>
        <Select value={leg.cabin} onChange={(e) => set("cabin", e.target.value)}>
          {["Any", ...cabins].map((cabin) => <option key={cabin} value={cabin}>{cabin}</option>)}
        </Select>
      </div>
      <div>
        <Label>Airline</Label>
        <Select value={leg.airline} onChange={(e) => set("airline", e.target.value)}>
          {["Any", ...airlines].map((airline) => <option key={airline} value={airline}>{airline}</option>)}
        </Select>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1"><Label>Time</Label><Input type="time" value={leg.time} onChange={(e) => set("time", e.target.value)} /></div>
        {removable && (
          <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(leg.id)} className="mb-0.5 shrink-0 text-slate-400 hover:text-rose-500" aria-label="Remove segment">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function MultiLeg({ legs, minCount, showAddMore, onChange }: {
  legs: EditableLeg[];
  minCount: number;
  showAddMore: boolean;
  onChange: (legs: EditableLeg[]) => void;
}) {
  const updateLeg = (next: EditableLeg) => onChange(legs.map((leg) => leg.id === next.id ? next : leg));
  const removeLeg = (id: number) => legs.length > minCount && onChange(legs.filter((leg) => leg.id !== id));
  return (
    <div className="space-y-4">
      {legs.map((leg) => <LegFields key={leg.id} leg={leg} removable={legs.length > minCount} onChange={updateLeg} onRemove={removeLeg} />)}
      {showAddMore && <Button type="button" variant="secondary" size="sm" onClick={() => onChange([...legs, createLeg()])}><Plus className="h-3.5 w-3.5" /> Add segment</Button>}
    </div>
  );
}

function TravelersBlock({ travelers, stopType, stopCity, onTravelersChange, onStopTypeChange, onStopCityChange }: {
  travelers: TravelerCounts;
  stopType: string;
  stopCity: string;
  onTravelersChange: (travelers: TravelerCounts) => void;
  onStopTypeChange: (value: string) => void;
  onStopCityChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-4">
      {([
        { key: "adults", label: "Adults", options: ["1", "2", "3", "4", "5", "6"] },
        { key: "children", label: "Children", options: ["0", "1", "2", "3", "4"] },
        { key: "infants", label: "Infants", options: ["0", "1", "2"] },
      ] as const).map(({ key, label, options }) => (
        <div key={key}><Label>{label}</Label><Select value={travelers[key]} onChange={(e) => onTravelersChange({ ...travelers, [key]: Number(e.target.value) })}>{options.map((option) => <option key={option}>{option}</option>)}</Select></div>
      ))}
      <div><Label>Stop</Label><Select value={stopType} onChange={(e) => onStopTypeChange(e.target.value)}><option>Any</option><option>Direct</option><option>City</option></Select></div>
      {stopType === "City" && <div className="sm:col-span-3"><Label>Stop City Code</Label><Input placeholder="e.g. DXB" value={stopCity} onChange={(e) => onStopCityChange(e.target.value)} /></div>}
    </div>
  );
}

function AdvancedFilters({ values, onChange }: {
  values: Pick<FlightSearchFilters, "fareType" | "baggage" | "fareSource">;
  onChange: (name: keyof typeof values, value: string) => void;
}) {
  const fields: { name: keyof typeof values; label: string; options: string[] }[] = [
    { name: "fareType", label: "Fare Type", options: ["Any", "Refundable", "Non-Refundable"] },
    { name: "baggage", label: "Baggage", options: ["Any", "Include Bags", "No Baggage"] },
    { name: "fareSource", label: "Fare Source", options: ["Any", "GDS", "NDC", "Budget", "Consolidator"] },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
      {fields.map(({ name, label, options }) => <div key={name}><Label>{label}</Label><Select value={values[name]} onChange={(e) => onChange(name, e.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</Select></div>)}
    </div>
  );
}

function ImportFields({ sync = false }: { sync?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div><Label>PNR</Label><Input type="text" placeholder="e.g. KF7G2M" /></div>
      <div><Label>Supplier</Label><Select defaultValue=""><option value="">Select supplier...</option>{suppliers.map((supplier) => <option key={supplier}>{supplier}</option>)}</Select></div>
      {sync ? <FileUpload name="uploadDocument" label="Upload Document" /> : <div><Label>Currency</Label><Select defaultValue="AED">{currencies.map((currency) => <option key={currency}>{currency}</option>)}</Select></div>}
    </div>
  );
}

const tabSectionLabel: Partial<Record<FlightTab, string>> = {
  "one-way": "One Way", "round-trip": "Round Trip", multi: "Multi City", flexi: "Flexi / Best Buy", "group-fare": "Group Fare",
};

export default function FlightsSearchForm({ onSearch, onTravelersChange, onReset }: FlightsSearchFormProps) {
  const [tab, setTab] = useState<FlightTab>("one-way");
  const [groupTab, setGroupTab] = useState<GroupFareTab>("one-way");
  const [legs, setLegs] = useState<EditableLeg[]>(() => createLegs(1));
  const [searching, setSearching] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [travelers, setTravelers] = useState<TravelerCounts>({ adults: 1, children: 0, infants: 0 });
  const [stopType, setStopType] = useState("Any");
  const [stopCity, setStopCity] = useState("");
  const [advanced, setAdvanced] = useState({ fareType: "Any", baggage: "Any", fareSource: "Any" });

  const minCount = tab === "round-trip" || tab === "multi" || (tab === "group-fare" && (groupTab === "return" || groupTab === "multi")) ? 2 : 1;
  const showAddMore = tab === "multi" || tab === "flexi" || (tab === "group-fare" && (groupTab === "multi" || groupTab === "specific"));
  const isSearchTab = tab !== "import" && tab !== "sync";
  const isAdvancedTab = tab === "one-way" || tab === "round-trip" || tab === "multi" || tab === "flexi";

  const updateTravelers = (next: TravelerCounts) => { setTravelers(next); onTravelersChange?.(next); };
  const resetLegCount = (count: number) => setLegs(createLegs(count));
  const changeTab = (next: FlightTab) => {
    setTab(next);
    resetLegCount(next === "round-trip" || next === "multi" ? 2 : 1);
  };
  const changeGroupTab = (next: GroupFareTab) => {
    setGroupTab(next);
    resetLegCount(next === "return" || next === "multi" ? 2 : 1);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSearching(true);
    if (isSearchTab) {
      onSearch({
        tab: tab === "group-fare" ? "group-fare" : tab,
        legs: legs.map(({ id: _id, ...leg }) => leg), travelers, stopType, stopCity,
        fareType: advanced.fareType, baggage: advanced.baggage, fareSource: advanced.fareSource,
      });
    }
    window.setTimeout(() => setSearching(false), 700);
  };

  const handleReset = () => {
    const defaultTravelers = { adults: 1, children: 0, infants: 0 };
    resetLegCount(minCount);
    updateTravelers(defaultTravelers);
    setStopType("Any"); setStopCity("");
    setAdvanced({ fareType: "Any", baggage: "Any", fareSource: "Any" });
    setAdvancedOpen(false); setSearching(false);
    onReset();
  };

  return (
    <form onSubmit={handleSubmit} onReset={handleReset} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <Tabs tabs={flightTabs} active={tab} onChange={(id) => changeTab(id as FlightTab)} className="mb-5" />
      {tabSectionLabel[tab] && <span className="mb-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">{tabSectionLabel[tab]}</span>}
      {tab === "group-fare" && <Tabs tabs={groupFareTabs} active={groupTab} onChange={(id) => changeGroupTab(id as GroupFareTab)} className="mb-4" />}
      {isSearchTab && <MultiLeg legs={legs} minCount={minCount} showAddMore={showAddMore} onChange={setLegs} />}
      {tab === "import" && <ImportFields />}
      {tab === "sync" && <ImportFields sync />}
      {isSearchTab && <div className="mt-5"><TravelersBlock travelers={travelers} stopType={stopType} stopCity={stopCity} onTravelersChange={updateTravelers} onStopTypeChange={(value) => { setStopType(value); if (value !== "City") setStopCity(""); }} onStopCityChange={setStopCity} /></div>}
      {advancedOpen && isAdvancedTab && <div className="mt-4"><AdvancedFilters values={advanced} onChange={(name, value) => setAdvanced((current) => ({ ...current, [name]: value }))} /></div>}
      <div className="mt-5 flex items-center justify-end gap-2">
        <Button type="reset" variant="ghost" size="sm"><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>
        {isAdvancedTab && <Button type="button" variant="secondary" size="sm" onClick={() => setAdvancedOpen((open) => !open)} aria-expanded={advancedOpen}><Settings2 className="h-3.5 w-3.5" />{advancedOpen ? "Hide Advanced" : "Advanced"}</Button>}
        <Button type="submit" disabled={searching}><Search className="h-4 w-4" />{
          searching ? (tab === "import" ? "Importing..." : tab === "sync" ? "Syncing..." : tab === "group-fare" ? "Submitting..." : "Searching...")
            : tab === "import" ? "Import PNR" : tab === "sync" ? "Sync PNR" : tab === "group-fare" ? "Submit request" : "Search Flights"
        }</Button>
      </div>
    </form>
  );
}
