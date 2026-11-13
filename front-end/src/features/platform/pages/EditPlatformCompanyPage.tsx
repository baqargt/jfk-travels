import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
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
  "UTC",
] as const;

const emptyDetails = {
  legalName: "",
  tradingName: "",
  email: "",
  phone: "",
  address: "",
  iataNumber: "",
  uicCode: "",
  businessLicense: "",
  baseCurrency: "USD",
  timezone: "UTC",
};

export default function EditPlatformCompanyPage() {
  const { companyId = "" } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingLimits, setSavingLimits] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [limitsError, setLimitsError] = useState("");
  const [details, setDetails] = useState(emptyDetails);
  const [limits, setLimits] = useState({
    maxSubCompanies: "",
    maxUsers: "",
    maxTravellers: "",
    status: "active",
  });

  const companyQuery = useQuery({
    queryKey: ["platform-companies", companyId],
    queryFn: async () => {
      const company = await apiRequest<ApiCompany>(`/platform/companies/${companyId}`);
      setDetails({
        legalName: company.legalName,
        tradingName: company.tradingName,
        email: company.email,
        phone: company.phone ?? "",
        address: company.address ?? "",
        iataNumber: company.iataNumber ?? "",
        uicCode: company.uicCode ?? "",
        businessLicense: company.businessLicense ?? "",
        baseCurrency: company.baseCurrency || "USD",
        timezone: company.timezone || "UTC",
      });
      setLimits({
        maxSubCompanies: String(company.maxSubCompanies),
        maxUsers: String(company.maxUsers),
        maxTravellers: String(company.maxTravellers),
        status: company.status,
      });
      return company;
    },
    enabled: Boolean(companyId),
  });

  const setDetail =
    (key: keyof typeof details) => (e: { target: { value: string } }) =>
      setDetails((current) => ({ ...current, [key]: e.target.value }));

  const detailsValid =
    details.legalName.trim().length > 1 &&
    details.tradingName.trim().length > 1 &&
    details.email.includes("@");

  const handleSaveDetails = async (e: FormEvent) => {
    e.preventDefault();
    if (!detailsValid) return;
    setSavingDetails(true);
    setDetailsError("");
    try {
      await apiRequest(`/platform/companies/${companyId}`, {
        method: "PATCH",
        body: {
          legalName: details.legalName.trim(),
          tradingName: details.tradingName.trim(),
          email: details.email.trim(),
          phone: details.phone.trim(),
          address: details.address.trim(),
          iataNumber: details.iataNumber.trim(),
          uicCode: details.uicCode.trim(),
          businessLicense: details.businessLicense.trim(),
          baseCurrency: details.baseCurrency,
          timezone: details.timezone,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["platform-companies", companyId] });
      await queryClient.invalidateQueries({ queryKey: ["platform-companies"] });
      navigate(PATHS.platform.companyDetail(companyId), { replace: true });
    } catch (reason) {
      setDetailsError(reason instanceof Error ? reason.message : "Company details could not be updated.");
      setSavingDetails(false);
    }
  };

  const handleSaveLimits = async (e: FormEvent) => {
    e.preventDefault();
    setSavingLimits(true);
    setLimitsError("");
    try {
      await apiRequest(`/platform/companies/${companyId}`, {
        method: "PATCH",
        body: {
          maxSubCompanies: Number(limits.maxSubCompanies),
          maxUsers: Number(limits.maxUsers),
          maxTravellers: Number(limits.maxTravellers),
          status: limits.status,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["platform-companies", companyId] });
      await queryClient.invalidateQueries({ queryKey: ["platform-companies"] });
      navigate(PATHS.platform.companyDetail(companyId), { replace: true });
    } catch (reason) {
      setLimitsError(reason instanceof Error ? reason.message : "Limits could not be updated.");
      setSavingLimits(false);
    }
  };

  return (
    <>
      <PageHeader
        title={companyQuery.data ? `Edit ${companyQuery.data.tradingName}` : "Edit Company"}
        description="Update company profile fields and platform quotas."
        actions={
          <Link to={companyId ? PATHS.platform.companyDetail(companyId) : PATHS.platform.companies}>
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </Button>
          </Link>
        }
      />

      {companyQuery.isLoading && <p className="mb-4 text-sm text-slate-500">Loading company...</p>}
      {companyQuery.error && (
        <p className="mb-4 text-sm text-rose-600">
          {companyQuery.error instanceof Error
            ? companyQuery.error.message
            : "Company could not be loaded."}
        </p>
      )}

      {companyQuery.data && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Company Details">
            <form onSubmit={handleSaveDetails} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Legal name" required>
                  <Input value={details.legalName} onChange={setDetail("legalName")} required />
                </FormField>
                <FormField label="Trading name" required>
                  <Input value={details.tradingName} onChange={setDetail("tradingName")} required />
                </FormField>
                <FormField label="Email" required>
                  <Input type="email" value={details.email} onChange={setDetail("email")} required />
                </FormField>
                <FormField label="Phone">
                  <Input value={details.phone} onChange={setDetail("phone")} />
                </FormField>
                <FormField label="IATA number">
                  <Input value={details.iataNumber} onChange={setDetail("iataNumber")} />
                </FormField>
                <FormField label="UIC code">
                  <Input value={details.uicCode} onChange={setDetail("uicCode")} />
                </FormField>
                <FormField label="Business license">
                  <Input value={details.businessLicense} onChange={setDetail("businessLicense")} />
                </FormField>
                <FormField label="Base currency">
                  <Select value={details.baseCurrency} onChange={setDetail("baseCurrency")}>
                    {CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Timezone" className="sm:col-span-2">
                  <Select value={details.timezone} onChange={setDetail("timezone")}>
                    {TIMEZONES.map((timezone) => (
                      <option key={timezone} value={timezone}>
                        {timezone}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Address" className="sm:col-span-2">
                  <Textarea value={details.address} onChange={setDetail("address")} rows={3} />
                </FormField>
              </div>
              {detailsError && <p className="text-sm text-rose-600">{detailsError}</p>}
              <Button type="submit" disabled={savingDetails || !detailsValid}>
                {savingDetails ? "Saving..." : "Save Details"}
              </Button>
            </form>
          </Card>

          <Card title="Quotas & Status">
            <form onSubmit={handleSaveLimits} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField label="Max Sub Companies">
                  <Input
                    type="number"
                    min={0}
                    value={limits.maxSubCompanies}
                    onChange={(e) =>
                      setLimits((current) => ({ ...current, maxSubCompanies: e.target.value }))
                    }
                  />
                </FormField>
                <FormField label="Max Users">
                  <Input
                    type="number"
                    min={0}
                    value={limits.maxUsers}
                    onChange={(e) => setLimits((current) => ({ ...current, maxUsers: e.target.value }))}
                  />
                </FormField>
                <FormField label="Max Travellers">
                  <Input
                    type="number"
                    min={0}
                    value={limits.maxTravellers}
                    onChange={(e) =>
                      setLimits((current) => ({ ...current, maxTravellers: e.target.value }))
                    }
                  />
                </FormField>
              </div>
              <FormField label="Status">
                <Select
                  value={limits.status}
                  onChange={(e) => setLimits((current) => ({ ...current, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </Select>
              </FormField>
              {limitsError && <p className="text-sm text-rose-600">{limitsError}</p>}
              <Button type="submit" disabled={savingLimits}>
                {savingLimits ? "Saving..." : "Save Limits"}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
