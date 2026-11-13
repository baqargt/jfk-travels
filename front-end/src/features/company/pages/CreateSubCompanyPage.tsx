import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CircleCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { FormField } from "@/components/ui/Input";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import Stepper from "@/components/ui/Stepper";
import type { ApiBranch, ApiPage, ApiPricingModel } from "@/api/types";
import { apiStatus } from "@/api/types";
import { fmtMoney } from "@/lib/utils";
import { PATHS } from "@/routes/paths";
import { apiRequest } from "@/api/client";

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
  status: string;
  managerName: string;
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
  pricingModel: "",
  notes: "",
  status: "active",
  managerName: "",
};

export default function CreateSubCompanyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { branchId } = useParams<{ branchId?: string }>();
  const isEdit = Boolean(branchId);
  const { data: pricingPage } = useQuery({
    queryKey: ["pricing-models", "branch-form"],
    queryFn: () => apiRequest<ApiPage<ApiPricingModel>>("/pricing-models?page_size=100"),
  });
  const pricingModels = pricingPage?.items ?? [];
  const { data: branch, isLoading, error: loadError } = useQuery({
    queryKey: ["branches", branchId],
    queryFn: () => apiRequest<ApiBranch>(`/branches/${branchId}`),
    enabled: isEdit,
  });
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<SubCompanyDraft>(initial);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!branch) return;
    const [city = "", country = "United States"] = branch.location.split(",").map((part) => part.trim());
    setForm({
      legalName: branch.name,
      displayName: branch.name,
      type: branch.branchType,
      license: "",
      currency: branch.currency || "USD",
      email: "",
      phone: "",
      country: country || "United States",
      city,
      address: "",
      cashLimit: String(Number(branch.cashBalance) || 0),
      creditLimit: String(Number(branch.creditLimit) || 0),
      pricingModel: "",
      notes: "",
      status: branch.status,
      managerName: branch.managerName ?? "",
    });
    setAgreed(true);
  }, [branch]);

  const set = (key: keyof SubCompanyDraft) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const canContinue =
    step === 0
      ? form.legalName.trim() !== "" && form.displayName.trim() !== ""
      : step === 1
        ? (isEdit || form.email.includes("@")) && form.city.trim() !== ""
        : true;

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isEdit && branchId) {
        await apiRequest(`/branches/${branchId}`, {
          method: "PATCH",
          body: {
            name: form.displayName.trim(),
            branchType: form.type,
            location: [form.city, form.country].filter(Boolean).join(", "),
            managerName: form.managerName.trim(),
            currency: form.currency,
            status: form.status.toLowerCase() === "active" ? "active" : form.status.toLowerCase(),
          },
        });
      } else {
        const codeBase = form.displayName.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase() || "BRANCH";
        await apiRequest("/branches", {
          method: "POST",
          body: {
            code: codeBase,
            name: form.displayName.trim(),
            branchType: form.type,
            location: [form.city, form.country].filter(Boolean).join(", "),
            managerName: form.managerName.trim(),
            currency: form.currency,
            creditLimit: Number(form.creditLimit) || 0,
            cashBalance: Number(form.cashLimit) || 0,
          },
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["branches"] });
      await queryClient.invalidateQueries({ queryKey: ["company"] });
      navigate(PATHS.company.subCompanies, { replace: true });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : isEdit
            ? "Sub-company could not be updated."
            : "Sub-company could not be created.",
      );
      setSaving(false);
    }
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
    ...(isEdit ? [["Status", apiStatus(form.status)] as [string, string]] : []),
  ];

  return (
    <>
      <PageHeader
        title={isEdit ? "Edit Sub Company" : "Create Sub Company"}
        description={
          isEdit
            ? "Update branch or franchise details."
            : "Onboard a new branch or franchise in four guided steps."
        }
      />

      {isEdit && isLoading && <p className="mb-4 text-sm text-slate-500">Loading sub-company...</p>}
      {isEdit && loadError && (
        <p className="mb-4 text-sm text-rose-600">
          {loadError instanceof Error ? loadError.message : "Sub-company could not be loaded."}
        </p>
      )}

      <Card bodyClassName="p-6">
        <Stepper steps={STEPS} current={step} />

        <form onSubmit={handleSubmit} className="mt-8">
          {error && <p className="mx-auto mb-5 max-w-2xl rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
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
                <FormField label="Manager name">
                  <Input value={form.managerName} onChange={set("managerName")} placeholder="Branch manager" />
                </FormField>
                <FormField label="Settlement currency" className="sm:col-span-1">
                  <Select value={form.currency} onChange={set("currency")}>
                    {["USD", "EUR", "GBP", "AED", "PKR"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                </FormField>
                {isEdit && (
                  <FormField label="Status">
                    <Select value={form.status} onChange={set("status")}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </Select>
                  </FormField>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField label="Email address" required={!isEdit}>
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
                <FormField
                  label="Cash limit (USD)"
                  hint={isEdit ? "Managed via JFK Travel Limits after create" : "Allocated float from head office"}
                >
                  <Input type="number" min={0} value={form.cashLimit} onChange={set("cashLimit")} disabled={isEdit} />
                </FormField>
                <FormField
                  label="Credit limit (USD)"
                  hint={isEdit ? "Managed via JFK Travel Limits after create" : "Weekly settlement cycle applies"}
                >
                  <Input type="number" min={0} value={form.creditLimit} onChange={set("creditLimit")} disabled={isEdit} />
                </FormField>
                <FormField
                  label="Pricing model"
                  className="sm:col-span-2"
                  hint="Determines markups and commissions applied to all bookings"
                >
                  <Select value={form.pricingModel} onChange={set("pricingModel")}>
                    {pricingModels.map((p) => (
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
            <Button variant="ghost" type="button" onClick={() => navigate(-1)} disabled={saving}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button variant="secondary" type="button" onClick={() => setStep((s) => s - 1)} disabled={saving}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={() => canContinue && setStep((s) => s + 1)} disabled={!canContinue || saving}>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={!agreed || saving || (isEdit && isLoading)}>
                  {saving ? (isEdit ? "Saving..." : "Creating...") : (
                    <>
                      <CircleCheck className="h-4 w-4" />
                      {isEdit ? "Update Sub Company" : "Create Sub Company"}
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
