import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/Input";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import { apiRequest } from "@/api/client";
import type { ApiCompany } from "@/api/types";
import { PATHS } from "@/routes/paths";

const CURRENCIES = ["USD", "EUR", "GBP", "AED", "PKR"] as const;
const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Asia/Dubai",
  "Asia/Karachi",
] as const;

const emptyForm = {
  legalName: "",
  tradingName: "",
  email: "",
  phone: "",
  address: "",
  iataNumber: "",
  uicCode: "",
  businessLicense: "",
  baseCurrency: "USD",
  timezone: "America/New_York",
};

export default function EditCompanyProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  const { data: company, isLoading, error: loadError } = useQuery({
    queryKey: ["company"],
    queryFn: () => apiRequest<ApiCompany>("/company"),
  });

  useEffect(() => {
    if (!company) return;
    setForm({
      legalName: company.legalName,
      tradingName: company.tradingName,
      email: company.email,
      phone: company.phone,
      address: company.address,
      iataNumber: company.iataNumber,
      uicCode: company.uicCode,
      businessLicense: company.businessLicense,
      baseCurrency: company.baseCurrency || "USD",
      timezone: company.timezone || "America/New_York",
    });
  }, [company]);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest("/company", {
        method: "PATCH",
        body: {
          legalName: form.legalName.trim(),
          tradingName: form.tradingName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          iataNumber: form.iataNumber.trim(),
          uicCode: form.uicCode.trim(),
          businessLicense: form.businessLicense.trim(),
          baseCurrency: form.baseCurrency,
          timezone: form.timezone,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["company"] });
      navigate(PATHS.company.profile, { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Company profile could not be updated.");
      setSaving(false);
    }
  };

  const valid = form.legalName.trim().length > 1 && form.tradingName.trim().length > 1 && form.email.includes("@");

  return (
    <>
      <PageHeader
        title="Edit Company Profile"
        description="Update organization identity, licensing and settlement settings."
      />

      {isLoading && <p className="mb-4 text-sm text-slate-500">Loading company...</p>}
      {loadError && (
        <p className="mb-4 text-sm text-rose-600">
          {loadError instanceof Error ? loadError.message : "Company could not be loaded."}
        </p>
      )}

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <Card title="Organization Details">
          {error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Legal name" required>
              <Input value={form.legalName} onChange={set("legalName")} />
            </FormField>
            <FormField label="Trading name" required>
              <Input value={form.tradingName} onChange={set("tradingName")} />
            </FormField>
            <FormField label="Email" required>
              <Input type="email" value={form.email} onChange={set("email")} />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={set("phone")} />
            </FormField>
            <FormField label="IATA number">
              <Input value={form.iataNumber} onChange={set("iataNumber")} />
            </FormField>
            <FormField label="UIC code">
              <Input value={form.uicCode} onChange={set("uicCode")} />
            </FormField>
            <FormField label="Business license">
              <Input value={form.businessLicense} onChange={set("businessLicense")} />
            </FormField>
            <FormField label="Base currency">
              <Select value={form.baseCurrency} onChange={set("baseCurrency")}>
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Timezone">
              <Select value={form.timezone} onChange={set("timezone")}>
                {TIMEZONES.map((tz) => (
                  <option key={tz}>{tz}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Address" className="sm:col-span-2">
              <Textarea value={form.address} onChange={set("address")} rows={3} />
            </FormField>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-5">
            <Button variant="ghost" type="button" onClick={() => navigate(PATHS.company.profile)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !valid || isLoading}>
              {saving ? "Saving..." : (
                <>
                  <CircleCheck className="h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </>
  );
}
