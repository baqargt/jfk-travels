import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, Plus, Trash2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Input";
import MultiSelect from "@/components/ui/MultiSelect";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import StatusToggle from "@/components/ui/StatusToggle";
import Tabs from "@/components/ui/Tabs";
import AirTemplateForm, { defaultAirTemplate } from "@/features/pricing/components/AirTemplateForm";
import HotelTemplateForm, { defaultHotelTemplate } from "@/features/pricing/components/HotelTemplateForm";
import TourTemplateForm, { defaultTourTemplate } from "@/features/pricing/components/TourTemplateForm";
import { airlines, cabins } from "@/lib/bookingData";
import { ALL_TEMPLATE_CATEGORIES } from "@/types";
import { fmtMoney } from "@/lib/utils";
import { PATHS } from "@/routes/paths";
import { apiRequest } from "@/api/client";
import type { ApiPricingModel, ApiPricingModelDetail } from "@/api/types";

interface RuleRow {
  id: number;
  airline: string;
  routeFrom: string;
  routeTo: string;
  cabin: string;
  mType: "%" | "$";
  value: string;
}

let nextId = 1;
const newRule = (): RuleRow => ({
  id: nextId++,
  airline: "",
  routeFrom: "",
  routeTo: "",
  cabin: "",
  mType: "%",
  value: "",
});

const availableCategories = ALL_TEMPLATE_CATEGORIES.map((c) => ({ label: c, value: c }));

const categoryVariant: Record<string, "blue" | "violet" | "amber" | "green" | "red" | "gray"> = {
  Air: "blue",
  Hotel: "amber",
  Tour: "green",
  Car: "red",
  Transfer: "gray",
  Insurance: "violet",
  "Offline MISC": "gray",
};

export default function CreatePricingModelPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { modelId } = useParams<{ modelId?: string }>();
  const isEdit = Boolean(modelId);
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [type, setType] = useState<"Markup" | "Commission">("Markup");
  const [scope, setScope] = useState("Airline");
  const [appliesTo, setAppliesTo] = useState("");
  const [priority, setPriority] = useState("5");
  const [active, setActive] = useState(true);
  const [commissionPct, setCommissionPct] = useState("");
  const [commissionBasis, setCommissionBasis] = useState("Base fare");
  const [rules, setRules] = useState<RuleRow[]>([newRule()]);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [airData, setAirData] = useState(defaultAirTemplate);
  const [hotelData, setHotelData] = useState(defaultHotelTemplate);
  const [tourData, setTourData] = useState(defaultTourTemplate);

  const { data: existing, isLoading, error: loadError } = useQuery({
    queryKey: ["pricing-models", modelId],
    queryFn: () => apiRequest<ApiPricingModelDetail>(`/pricing-models/${modelId}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!existing) return;
    const rulesPayload = existing.rules ?? {};
    setName(existing.name);
    setDetail(typeof rulesPayload.detail === "string" ? rulesPayload.detail : "");
    setType(existing.pricingType);
    setScope(existing.scope);
    setAppliesTo(typeof rulesPayload.appliesTo === "string" ? rulesPayload.appliesTo : "");
    setPriority(String(existing.priority));
    setActive(existing.status === "active" || existing.status === "pending");
    setCommissionPct(String(rulesPayload.commissionPercentage ?? ""));
    setCommissionBasis(typeof rulesPayload.commissionBasis === "string" ? rulesPayload.commissionBasis : "Base fare");
    const rows = Array.isArray(rulesPayload.rows) ? rulesPayload.rows : [];
    if (rows.length) {
      setRules(
        rows.map((row) => {
          const item = row as Partial<RuleRow>;
          return {
            id: nextId++,
            airline: String(item.airline ?? ""),
            routeFrom: String(item.routeFrom ?? ""),
            routeTo: String(item.routeTo ?? ""),
            cabin: String(item.cabin ?? ""),
            mType: item.mType === "$" ? "$" : "%",
            value: String(item.value ?? ""),
          };
        }),
      );
    }
    const templates = (rulesPayload.templates ?? {}) as Record<string, unknown>;
    const categories = Object.entries(templates)
      .filter(([, value]) => Boolean(value))
      .map(([key]) => key);
    setSelectedCategories(categories);
    setActiveTab(categories[0] ?? "");
    if (templates.Air && typeof templates.Air === "object") setAirData({ ...defaultAirTemplate, ...(templates.Air as object) });
    if (templates.Hotel && typeof templates.Hotel === "object") setHotelData({ ...defaultHotelTemplate, ...(templates.Hotel as object) });
    if (templates.Tour && typeof templates.Tour === "object") setTourData({ ...defaultTourTemplate, ...(templates.Tour as object) });
  }, [existing]);

  const patch = (id: number, key: keyof RuleRow, v: string) =>
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: v } : r)));

  const sampleFare = 500;
  const firstRule = rules[0];
  const markupValue = Number(firstRule?.value || 0);
  const markupAmount = firstRule?.mType === "%" ? (sampleFare * markupValue) / 100 : markupValue;
  const commissionAmount = type === "Commission" ? (sampleFare * Number(commissionPct || 0)) / 100 : 0;
  const finalPrice = sampleFare + markupAmount;

  const handleCategoryChange = (values: string[]) => {
    setSelectedCategories(values);
    if (values.length === 0) {
      setActiveTab("");
    } else if (!values.includes(activeTab)) {
      setActiveTab(values[0]);
    }
  };

  const tabs = selectedCategories.map((c) => ({ id: c, label: c }));

  const buildRules = () => ({
    detail,
    appliesTo,
    percentage: firstRule?.mType === "%" ? Number(firstRule.value) || 0 : 0,
    amount: firstRule?.mType === "$" ? Number(firstRule.value) || 0 : 0,
    commissionPercentage: Number(commissionPct) || 0,
    commissionBasis,
    rows: rules,
    templates: {
      Air: selectedCategories.includes("Air") ? airData : null,
      Hotel: selectedCategories.includes("Hotel") ? hotelData : null,
      Tour: selectedCategories.includes("Tour") ? tourData : null,
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSubmitError("");
    try {
      let modelIdToSubmit = modelId;
      if (isEdit && modelId) {
        await apiRequest<ApiPricingModelDetail>(`/pricing-models/${modelId}`, {
          method: "PATCH",
          body: {
            name: name.trim(),
            pricingType: type,
            scope,
            priority: Number(priority) || 100,
            rules: buildRules(),
          },
        });
      } else {
        const model = await apiRequest<ApiPricingModel>("/pricing-models", {
          method: "POST",
          body: {
            name: name.trim(),
            pricingType: type,
            scope,
            priority: Number(priority) || 100,
            rules: buildRules(),
          },
        });
        modelIdToSubmit = model.id;
      }
      if (active && modelIdToSubmit) {
        await apiRequest(`/pricing-models/${modelIdToSubmit}/submit`, { method: "POST" });
      }
      await queryClient.invalidateQueries({ queryKey: ["pricing-models"] });
      navigate(PATHS.pricing, { replace: true });
    } catch (reason) {
      setSubmitError(
        reason instanceof Error
          ? reason.message
          : isEdit
            ? "Pricing model could not be updated."
            : "Pricing model could not be created.",
      );
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={isEdit ? "Edit Pricing Model" : "Create Pricing Model"}
        description={
          isEdit
            ? "Update markup/commission rules. Rule changes create a new draft version pending approval."
            : "Define dynamic markup and commission rules for fares across suppliers."
        }
      />

      {isEdit && isLoading && <p className="mb-4 text-sm text-slate-500">Loading pricing model...</p>}
      {isEdit && loadError && (
        <p className="mb-4 text-sm text-rose-600">
          {loadError instanceof Error ? loadError.message : "Pricing model could not be loaded."}
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {submitError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 xl:col-span-3">{submitError}</p>}
        <div className="space-y-6 xl:col-span-2">
          <Card title="Model Basics">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField label="Model name" required>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emirates Peak Season Markup" />
              </FormField>
              <FormField label="Detail" required>
                <Input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Pricing description" />
              </FormField>
              {/* <FormField label="Rule type">
                <Select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
                  <option>Markup</option>
                  <option>Commission</option>
                </Select>
              </FormField>
              <FormField label="Scope">
                <Select value={scope} onChange={(e) => setScope(e.target.value)}>
                  {["Global", "Airline", "Route", "Cabin Class", "Sub Company"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </FormField>
              <FormField
                label={type === "Commission" ? "Commission basis" : "Applies to"}
                hint={type === "Commission" ? "What the percentage is calculated on" : "Free text, e.g. Emirates (EK)"}
              >
                {type === "Commission" ? (
                  <Select value={commissionBasis} onChange={(e) => setCommissionBasis(e.target.value)}>
                    {["Base fare", "Base + taxes", "Total incl. surcharges"].map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </Select>
                ) : (
                  <Input value={appliesTo} onChange={(e) => setAppliesTo(e.target.value)} placeholder="Emirates (EK) / JFK-DXB / ..." />
                )}
              </FormField>
              {type === "Commission" && (
                <>
                  <FormField label="Applies to">
                    <Input value={appliesTo} onChange={(e) => setAppliesTo(e.target.value)} placeholder="All hotels / Hotelbeds..." />
                  </FormField>
                  <FormField label="Commission %">
                    <Input type="number" min={0} step="0.25" value={commissionPct} onChange={(e) => setCommissionPct(e.target.value)} />
                  </FormField>
                </>
              )} */}
            </div>
          </Card>

          {/* <Card
            title="Dynamic Rules"
            description="Add conditions evaluated top to bottom — first match wins"
            actions={
              <Button variant="secondary" size="sm" onClick={() => setRules((rs) => [...rs, newRule()])}>
                <Plus className="h-3.5 w-3.5" />
                Add Rule
              </Button>
            }
            bodyClassName="p-5 space-y-4"
          >
            {rules.map((rule, idx) => (
              <div key={rule.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wide text-slate-500 uppercase">
                    <span className="grid h-5 w-5 place-items-center rounded bg-brand-100 text-[10px] font-bold text-brand-700">
                      {idx + 1}
                    </span>
                    Condition Set
                  </span>
                  {rules.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="!h-7 !w-7 text-slate-400 hover:text-rose-600"
                      title="Remove rule"
                      onClick={() => setRules((rs) => rs.filter((r) => r.id !== rule.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
                  <FormField label="Airline">
                    <Select value={rule.airline} onChange={(e) => patch(rule.id, "airline", e.target.value)}>
                      <option value="">Any</option>
                      {airlines.map((a) => (
                        <option key={a}>{a}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Route from">
                    <Input value={rule.routeFrom} onChange={(e) => patch(rule.id, "routeFrom", e.target.value)} placeholder="JFK" />
                  </FormField>
                  <FormField label="Route to">
                    <Input value={rule.routeTo} onChange={(e) => patch(rule.id, "routeTo", e.target.value)} placeholder="DXB" />
                  </FormField>
                  <FormField label="Cabin">
                    <Select value={rule.cabin} onChange={(e) => patch(rule.id, "cabin", e.target.value)}>
                      <option value="">Any</option>
                      {cabins.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Markup type">
                    <Select value={rule.mType} onChange={(e) => patch(rule.id, "mType", e.target.value)}>
                      <option value="%">Percent (%)</option>
                      <option value="$">Fixed ($)</option>
                    </Select>
                  </FormField>
                  <FormField label="Value">
                    <Input type="number" min={0} step="0.25" value={rule.value} onChange={(e) => patch(rule.id, "value", e.target.value)} />
                  </FormField>
                </div>
              </div>
            ))}
          </Card> */}

          <Card title="Templates" description="Assign templates to this pricing model">
            <div className="space-y-5">
              <FormField label="Select Templates" hint="Choose categories to attach template configurations">
                <MultiSelect
                  options={availableCategories}
                  value={selectedCategories}
                  onChange={handleCategoryChange}
                  placeholder="Select template categories..."
                />
              </FormField>

              {selectedCategories.length > 0 && (
                <div className="space-y-4">
                  <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

                  <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <Badge variant={categoryVariant[activeTab] ?? "gray"}>{activeTab}</Badge>
                      <span className="text-sm font-medium text-slate-700">Template Configuration</span>
                    </div>

                    {activeTab === "Air" && (
                      <AirTemplateForm data={airData} onChange={setAirData} />
                    )}
                    {activeTab === "Hotel" && (
                      <HotelTemplateForm data={hotelData} onChange={setHotelData} />
                    )}
                    {activeTab === "Tour" && (
                      <TourTemplateForm data={tourData} onChange={setTourData} />
                    )}

                    {activeTab !== "Air" && activeTab !== "Hotel" && activeTab !== "Tour" && (
                      <div className="py-8 text-center text-sm text-slate-400">
                        Template for <span className="font-semibold">{activeTab}</span> is not yet available.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Settings">
            <div className="space-y-5">
              <FormField label="Priority" hint="1 = highest precedence">
                <Input type="number" min={1} max={10} value={priority} onChange={(e) => setPriority(e.target.value)} />
              </FormField>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-3">
                <span className="text-sm font-medium text-slate-700">
                  {isEdit ? "Submit for approval" : "Activate immediately"}
                </span>
                <StatusToggle checked={active} onChange={setActive} label={false} />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-5">
              <Button variant="ghost" type="button" className="flex-1" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={!name.trim() || saving || (isEdit && isLoading)}>
                {saving ? "Saving..." : (
                  <>
                    <CircleCheck className="h-4 w-4" />
                    {isEdit ? "Update Model" : "Save Model"}
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card title="Preview" description={`Applied to a sample ${fmtMoney(sampleFare)} base fare`}>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Base fare</dt>
                <dd className="font-medium tabular-nums">{fmtMoney(sampleFare)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">
                  Markup ({markupValue}
                  {firstRule?.mType === "%" ? "%" : " USD"})
                </dt>
                <dd className="font-semibold text-emerald-700 tabular-nums">+{fmtMoney(markupAmount)}</dd>
              </div>
              {type === "Commission" && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Agency commission</dt>
                  <dd className="font-semibold text-brand-700 tabular-nums">+{fmtMoney(commissionAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-3">
                <dt className="font-semibold text-slate-900">Customer pays</dt>
                <dd className="text-base font-bold text-slate-900 tabular-nums">{fmtMoney(finalPrice)}</dd>
              </div>
            </dl>
            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-400 ring-1 ring-slate-100 ring-inset">
              Preview uses the first condition set only. Full evaluation follows priority order at search time.
            </p>
          </Card>
        </div>
      </form>
    </>
  );
}
