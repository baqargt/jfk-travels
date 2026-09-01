import { useState, type FormEvent } from "react";
import { Plus, RotateCcw, Search, Settings2, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Tabs from "@/components/ui/Tabs";
import FileUpload from "@/components/ui/FileUpload";
import { Label, Input, Select } from "@/components/ui/Input";
import { airlines, cabins } from "@/lib/bookingData";

interface FlightsSearchFormProps {
  onSearch: () => void;
}

type FlightTab = "one-way" | "round-trip" | "multi" | "flexi" | "import" | "sync" | "group-fare";
type GroupFareTab = "one-way" | "return" | "multi" | "specific";

const flightTabs: { id: FlightTab; label: string }[] = [
  { id: "one-way", label: "One Way" },
  { id: "round-trip", label: "Round Trip" },
  { id: "multi", label: "Multi City" },
  { id: "flexi", label: "Flexi/Best Buy" },
  { id: "import", label: "Import" },
  { id: "sync", label: "Sync" },
  { id: "group-fare", label: "Group Fare" },
];

const groupFareTabs: { id: GroupFareTab; label: string }[] = [
  { id: "one-way", label: "One-Way" },
  { id: "return", label: "Return" },
  { id: "multi", label: "Multi" },
  { id: "specific", label: "Specific" },
];

const suppliers = ["Sabre", "Galileo", "Amadeus", "Airline Direct API's", "Consolidator"];
const currencies = ["AED", "USD", "EUR", "SAR", "PKR", "INR"];

interface Leg {
  id: number;
  origin: string;
  destination: string;
  depart: string;
  cabin: string;
  airline: string;
  time: string;
}

let legCounter = 0;
const newLeg = (): Leg => ({
  id: ++legCounter,
  origin: "",
  destination: "",
  depart: "",
  cabin: "Economy",
  airline: "Any",
  time: "",
});

function LegFields({ onRemove, removable }: { onRemove: (id: number) => void; removable: boolean }) {
  const [leg, setLeg] = useState<Leg>(newLeg);

  const set = (field: keyof Leg, value: string) => setLeg((l) => ({ ...l, [field]: value }));

  return (
    <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4 md:grid-cols-6">
      <div>
        <Label>From</Label>
        <Input
          type="text"
          placeholder="JFK - New York"
          value={leg.origin}
          onChange={(e) => set("origin", e.target.value)}
        />
      </div>
      <div>
        <Label>To</Label>
        <Input
          type="text"
          placeholder="DXB - Dubai"
          value={leg.destination}
          onChange={(e) => set("destination", e.target.value)}
        />
      </div>
      <div>
        <Label>Date</Label>
        <Input
          type="date"
          value={leg.depart}
          onChange={(e) => set("depart", e.target.value)}
        />
      </div>
      <div>
        <Label>Cabin</Label>
        <Select value={leg.cabin} onChange={(e) => set("cabin", e.target.value)}>
          {cabins.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Airline</Label>
        <Select value={leg.airline} onChange={(e) => set("airline", e.target.value)}>
          {["Any", ...airlines].map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label>Time</Label>
          <Input
            type="time"
            value={leg.time}
            onChange={(e) => set("time", e.target.value)}
          />
        </div>
        {removable && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(leg.id)}
            className="mb-0.5 shrink-0 text-slate-400 hover:text-rose-500"
            aria-label="Remove segment"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function TravelersBlock() {
  const [stopType, setStopType] = useState("Any");
  const [stopCity, setStopCity] = useState("");

  return (
    <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-4">
      {[
        { label: "Adults", options: ["1", "2", "3", "4", "5", "6"] },
        { label: "Children", options: ["0", "1", "2", "3", "4"] },
        { label: "Infants", options: ["0", "1", "2"] },
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
      <div>
        <Label>Stop</Label>
        <Select value={stopType} onChange={(e) => setStopType(e.target.value)}>
          <option value="Any">Any</option>
          <option value="Direct">Direct</option>
          <option value="City">City Code</option>
        </Select>
      </div>
      {stopType === "City" && (
        <div className="sm:col-span-3">
          <Label>Stop City Code</Label>
          <Input
            type="text"
            placeholder="e.g. DXB"
            value={stopCity}
            onChange={(e) => setStopCity(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

function AdvancedFilters() {
  return (
    <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
      {[
        { label: "Fare Type", options: ["Any", "Refundable", "Non-Refundable"] },
        { label: "Baggage", options: ["Any", "Include Bags", "No Baggage"] },
        { label: "Fare Source", options: ["Any", "GDS", "NDC", "Budget", "Consolidator"] },
      ].map(({ label, options }) => (
        <div key={label}>
          <Label>{label}</Label>
          <Select defaultValue="Any">
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        </div>
      ))}
    </div>
  );
}

function MultiLeg({ minCount, showAddMore }: { minCount: number; showAddMore: boolean }) {
  const [legIds, setLegIds] = useState<number[]>(() => Array.from({ length: minCount }, () => legCounter++));

  const addLeg = () => setLegIds((l) => [...l, legCounter++]);
  const removeLeg = (id: number) => setLegIds((l) => (l.length > minCount ? l.filter((x) => x !== id) : l));

  return (
    <div className="space-y-4">
      {legIds.map((id) => (
        <LegFields key={id} removable={legIds.length > minCount} onRemove={removeLeg} />
      ))}
      {showAddMore && (
        <Button type="button" variant="secondary" size="sm" onClick={addLeg}>
          <Plus className="h-3.5 w-3.5" />
          Add segment
        </Button>
      )}
    </div>
  );
}

function GroupFareForm({ type }: { type: GroupFareTab }) {
  const showAddMore = type === "multi";
  const minCount = type === "return" || type === "multi" || type === "specific" ? 2 : 1;

  return (
    <div className="space-y-4">
      {type === "specific" ? (
        <SpecificFare />
      ) : (
        <MultiLeg minCount={minCount} showAddMore={showAddMore} />
      )}
    </div>
  );
}

function SpecificFare() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [depart, setDepart] = useState("");
  const [time, setTime] = useState("");
  const [airline, setAirline] = useState("Any");

  return (
    <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4 md:grid-cols-4 xl:grid-cols-5">
      <div>
        <Label>From</Label>
        <Input type="text" placeholder="JFK - New York" value={origin} onChange={(e) => setOrigin(e.target.value)} />
      </div>
      <div>
        <Label>To</Label>
        <Input type="text" placeholder="DXB - Dubai" value={destination} onChange={(e) => setDestination(e.target.value)} />
      </div>
      <div>
        <Label>Date</Label>
        <Input type="date" value={depart} onChange={(e) => setDepart(e.target.value)} />
      </div>
      <div>
        <Label>Time</Label>
        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <div>
        <Label>Airline</Label>
        <Select value={airline} onChange={(e) => setAirline(e.target.value)}>
          {["Any", ...airlines].map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

function ImportFields() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div>
        <Label>PNR</Label>
        <Input type="text" placeholder="e.g. KF7G2M" />
      </div>
      <div>
        <Label>Supplier</Label>
        <Select defaultValue="">
          <option value="" disabled>
            Select supplier...
          </option>
          {suppliers.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Currency</Label>
        <Select defaultValue="AED">
          {currencies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

function SyncFields() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div>
        <Label>PNR</Label>
        <Input type="text" placeholder="e.g. KF7G2M" />
      </div>
      <div>
        <Label>Supplier</Label>
        <Select defaultValue="">
          <option value="" disabled>
            Select supplier...
          </option>
          {suppliers.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
      <FileUpload name="uploadDocument" label="Upload Document" />
    </div>
  );
}

const tabSectionLabel: Partial<Record<FlightTab, string>> = {
  "one-way": "One Way",
  "round-trip": "Round Trip",
  multi: "Multi City",
  flexi: "Flexi / Best Buy",
  "group-fare": "Group Fare",
};

export default function FlightsSearchForm({ onSearch }: FlightsSearchFormProps) {
  const [tab, setTab] = useState<FlightTab>("one-way");
  const [groupTab, setGroupTab] = useState<GroupFareTab>("one-way");
  const [searching, setSearching] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSearching(true);
    onSearch();
    setTimeout(() => setSearching(false), 700);
  };

  const isGroupingTab = tab === "one-way" || tab === "round-trip" || tab === "multi" || tab === "flexi";
  const minCount = tab === "one-way" ? 1 : 2;
  const showAddMore = tab === "multi" || tab === "flexi";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <Tabs tabs={flightTabs} active={tab} onChange={(id) => setTab(id as FlightTab)} className="mb-5" />

      {tabSectionLabel[tab] && (
        <span className="mb-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          {tabSectionLabel[tab]}
        </span>
      )}

      {tab === "group-fare" && (
        <Tabs
          tabs={groupFareTabs}
          active={groupTab}
          onChange={(id) => setGroupTab(id as GroupFareTab)}
          className="mb-4"
        />
      )}

      {isGroupingTab && (
        <MultiLeg key={tab} minCount={minCount} showAddMore={showAddMore} />
      )}

      {tab === "group-fare" && <GroupFareForm key={groupTab} type={groupTab} />}

      {tab === "import" && <ImportFields />}

      {tab === "sync" && <SyncFields />}

      <div className="mt-5">
        <TravelersBlock />
      </div>

      {advancedOpen && (
        <div className="mt-4">
          <AdvancedFilters />
        </div>
      )}

      <div className="mt-5 flex items-center justify-end gap-2">
        <Button type="reset" variant="ghost" size="sm">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setAdvancedOpen((o) => !o)}
          aria-expanded={advancedOpen}
        >
          <Settings2 className="h-3.5 w-3.5" />
          {advancedOpen ? "Hide Advanced" : "Advanced"}
        </Button>
        <Button type="submit" disabled={searching}>
          <Search className="h-4 w-4" />
          {tab === "group-fare"
            ? searching
              ? "Submitting..."
              : "Submit request"
            : tab === "import"
              ? searching
                ? "Importing..."
                : "Import PNR"
              : tab === "sync"
                ? searching
                  ? "Syncing..."
                  : "Sync PNR"
                : searching
                  ? "Searching..."
                  : "Search Flights"}
        </Button>
      </div>
    </form>
  );
}
