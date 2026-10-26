import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CircleCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { FormField, Label } from "@/components/ui/Input";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import Stepper from "@/components/ui/Stepper";
import { pricingRules } from "@/lib/mockReports";
import { fmtMoney } from "@/lib/utils";
import { PATHS } from "@/routes/paths";

const STEPS = ["Company Details", "Contact & Address", "Limits & Pricing", "Review"];

interface SubCompanyDraft {
  legalName: string;
  displayName: string;
  type: string;
  license: string;
  currency: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  cashLimit: string;
  creditLimit: string;
  pricingModel: string;
  notes: string;
}

const initial: SubCompanyDraft = {
  legalName: "",
  displayName: "",
  type: "Branch",
  license: "",
  currency: "USD",
  email: "",
  phone: "",
  country: "United States",
  city: "",
  address: "",
  cashLimit: "25000",
  creditLimit: "50000",
  pricingModel: pricingRules[0].name,
  notes: "",
};

export default function CreateSubCompanyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<SubCompanyDraft>(initial);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof SubCompanyDraft) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const canContinue =
    step === 0
      ? form.legalName.trim() !== "" && form.displayName.trim() !== ""
      : step === 1
        ? form.email.includes("@") && form.city.trim() !== ""
        : true;

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    navigate(PATHS.company.subCompanies, { replace: true });
  };

  const reviewRows: [string, string][] = [
    ["Legal name", form.legalName || "—"],
    ["Display name", form.displayName || "—"],
    ["Type", form.type],
    ["License no.", form.license || "—"],
    ["Settlement currency", form.currency],
    ["Email", form.email || "—"],
    ["Phone", form.phone || "—"],
    ["Location", [form.city, form.country].filter(Boolean).join(", ") || "—"],
    ["Address", form.address || "—"],
    ["Cash limit", fmtMoney(Number(form.cashLimit) || 0)],
    ["Credit limit", fmtMoney(Number(form.creditLimit) || 0)],
    ["Pricing model", form.pricingModel],
  ];

  return (
    <>
      <PageHeader
        title="Create Sub Company"
        description="Onboard a new branch or franchise in four guided steps."
      />

      <Card bodyClassName="p-6">
        <Stepper steps={STEPS} current={step} />

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="mx-auto max-w-2xl">
            {step === 0 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField label="Legal name" required>
                  <Input value={form.legalName} onChange={set("legalName")} placeholder="e.g. Blue Line Travels LLC" />
                </FormField>
                <FormField label="Display name" required hint="Shown across the platform">
                  <Input value={form.displayName} onChange={set("displayName")} placeholder="e.g. Blue Line Travels" />
                </FormField>
                <FormField label="Entity type">
                  <Select value={form.type} onChange={set("type")}>
                    <option>Branch</option>
                    <option>Franchise</option>
                  </Select>
                </FormField>
                <FormField label="Business license no.">
                  <Input value={form.license} onChange={set("license")} placeholder="IL-DOS ..." />
                </FormField>
                <FormField label="Settlement currency" className="sm:col-span-1">
                  <Select value={form.currency} onChange={set("currency")}>
                    {["USD", "EUR", "GBP", "AED", "PKR"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                </FormField>
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField label="Email address" required>
                  <Input type="email" value={form.email} onChange={set("email")} placeholder="ops@branch.com" />
                </FormField>
                <FormField label="Phone">
                  <Input value={form.phone} onChange={set("phone")} placeholder="+1 ..." />
                </FormField>
                <FormField label="Country">
                  <Select value={form.country} onChange={set("country")}>
                    {["United States", "United Kingdom", "Pakistan", "UAE", "Saudi Arabia"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="City" required>
                  <Input value={form.city} onChange={set("city")} placeholder="Chicago" />
                </FormField>
                <FormField label="Street address" className="sm:col-span-2">
                  <Textarea value={form.address} onChange={set("address")} placeholder="Building, street, area..." />
                </FormField>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField label="Cash limit (USD)" hint="Allocated float from head office">
                  <Input type="number" min={0} value={form.cashLimit} onChange={set("cashLimit")} />
                </FormField>
                <FormField label="Credit limit (USD)" hint="Weekly settlement cycle applies">
                  <Input type="number" min={0} value={form.creditLimit} onChange={set("creditLimit")} />
                </FormField>
                <FormField
                  label="Pricing model"
                  className="sm:col-span-2"
                  hint="Determines markups and commissions applied to all bookings"
                >
                  <Select value={form.pricingModel} onChange={set("pricingModel")}>
                    {pricingRules.map((p) => (
                      <option key={p.id}>{p.name}</option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Internal notes" className="sm:col-span-2">
                  <Textarea value={form.notes} onChange={set("notes")} placeholder="Optional context for finance team..." />
                </FormField>
              </div>
            )}

            {step === 3 && (
              <div>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-5 sm:grid-cols-2">
                  {reviewRows.map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">{k}</dt>
                      <dd className="mt-0.5 text-sm font-semibold text-slate-800">{v}</dd>
                    </div>
                  ))}
                </dl>
                <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-brand-600"
                  />
                  I confirm the details are accurate and accept the franchise/branch operating agreement.
                </label>
              </div>
            )}
          </div>

          <div className="mx-auto mt-8 flex max-w-2xl items-center justify-between border-t border-slate-100 pt-5">
            <Button variant="ghost" onClick={() => navigate(-1)} disabled={saving}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button variant="secondary" onClick={() => setStep((s) => s - 1)} disabled={saving}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button onClick={() => canContinue && setStep((s) => s + 1)} disabled={!canContinue || saving}>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={!agreed || saving}>
                  {saving ? "Creating..." : (
                    <>
                      <CircleCheck className="h-4 w-4" />
                      Create Sub Company
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>
    </>
  );
}
