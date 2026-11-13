import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import { FormField, Input, PasswordInput, Select } from "@/components/ui/Input";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import { apiRequest } from "@/api/client";
import type { ApiCompany } from "@/api/types";
import { PATHS } from "@/routes/paths";

export default function CreatePlatformCompanyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    legalName: "",
    tradingName: "",
    email: "",
    phone: "",
    address: "",
    baseCurrency: "USD",
    timezone: "UTC",
    maxSubCompanies: "5",
    maxUsers: "50",
    maxTravellers: "500",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: e.target.value }));

  const valid =
    form.legalName.trim().length >= 2 &&
    form.tradingName.trim().length >= 2 &&
    form.email.includes("@") &&
    form.adminName.trim().length >= 2 &&
    form.adminEmail.includes("@") &&
    form.adminPassword.length >= 10 &&
    Number(form.maxSubCompanies) >= 1 &&
    Number(form.maxUsers) >= 1 &&
    Number(form.maxTravellers) >= 1;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    setError("");
    try {
      const company = await apiRequest<ApiCompany>("/platform/companies", {
        method: "POST",
        body: {
          legalName: form.legalName.trim(),
          tradingName: form.tradingName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          baseCurrency: form.baseCurrency,
          timezone: form.timezone.trim() || "UTC",
          maxSubCompanies: Number(form.maxSubCompanies),
          maxUsers: Number(form.maxUsers),
          maxTravellers: Number(form.maxTravellers),
          adminName: form.adminName.trim(),
          adminEmail: form.adminEmail.trim(),
          adminPassword: form.adminPassword,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["platform-companies"] });
      navigate(PATHS.platform.companyDetail(company.id), { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Company could not be created.");
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Create Company"
        description="Provision a tenant company with quotas and an initial administrator."
      />
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Company Profile">
          <div className="space-y-4">
            <FormField label="Legal Name" required>
              <Input value={form.legalName} onChange={set("legalName")} required />
            </FormField>
            <FormField label="Trading Name" required>
              <Input value={form.tradingName} onChange={set("tradingName")} required />
            </FormField>
            <FormField label="Email" required>
              <Input type="email" value={form.email} onChange={set("email")} required />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={set("phone")} />
            </FormField>
            <FormField label="Address">
              <Input value={form.address} onChange={set("address")} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Currency">
                <Select value={form.baseCurrency} onChange={set("baseCurrency")}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="AED">AED</option>
                  <option value="PKR">PKR</option>
                </Select>
              </FormField>
              <FormField label="Timezone">
                <Input value={form.timezone} onChange={set("timezone")} />
              </FormField>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Quotas">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="Max Sub Companies" required>
                <Input
                  type="number"
                  min={1}
                  value={form.maxSubCompanies}
                  onChange={set("maxSubCompanies")}
                  required
                />
              </FormField>
              <FormField label="Max Users" required>
                <Input type="number" min={1} value={form.maxUsers} onChange={set("maxUsers")} required />
              </FormField>
              <FormField label="Max Travellers" required>
                <Input
                  type="number"
                  min={1}
                  value={form.maxTravellers}
                  onChange={set("maxTravellers")}
                  required
                />
              </FormField>
            </div>
          </Card>

          <Card title="Initial Administrator">
            <div className="space-y-4">
              <FormField label="Admin Name" required>
                <Input value={form.adminName} onChange={set("adminName")} required />
              </FormField>
              <FormField label="Admin Email" required>
                <Input type="email" value={form.adminEmail} onChange={set("adminEmail")} required />
              </FormField>
              <FormField label="Admin Password" required>
                <PasswordInput
                  value={form.adminPassword}
                  onChange={set("adminPassword")}
                  minLength={10}
                  required
                />
              </FormField>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 flex flex-wrap items-center gap-3">
          {error && <p className="w-full text-sm text-rose-600">{error}</p>}
          <Button type="submit" disabled={!valid || saving}>
            {saving ? "Creating..." : "Create Company"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(PATHS.platform.companies)}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
