import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import Badge, { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Input";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import { apiRequest } from "@/api/client";
import {
  apiStatus,
  type ApiBranch,
  type ApiCompany,
  type ApiPage,
  type ApiTraveller,
  type ApiUser,
} from "@/api/types";
import { fmtDate } from "@/lib/utils";
import { PATHS } from "@/routes/paths";

type TabKey = "overview" | "branches" | "users" | "travellers";

function usageChip(label: string, used: number | undefined, max: number) {
  const current = used ?? 0;
  const nearLimit = current >= max;
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${nearLimit ? "text-rose-600" : "text-slate-900"}`}>
        {current} / {max}
      </p>
    </div>
  );
}

export default function PlatformCompanyDetailPage() {
  const { companyId = "" } = useParams<{ companyId: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>("overview");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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

  const branchesQuery = useQuery({
    queryKey: ["platform-companies", companyId, "branches"],
    queryFn: () => apiRequest<ApiPage<ApiBranch>>(`/platform/companies/${companyId}/branches?page_size=100`),
    enabled: Boolean(companyId) && tab === "branches",
  });

  const usersQuery = useQuery({
    queryKey: ["platform-companies", companyId, "users"],
    queryFn: () => apiRequest<ApiPage<ApiUser>>(`/platform/companies/${companyId}/users?page_size=100`),
    enabled: Boolean(companyId) && tab === "users",
  });

  const travellersQuery = useQuery({
    queryKey: ["platform-companies", companyId, "travellers"],
    queryFn: () =>
      apiRequest<ApiPage<ApiTraveller>>(`/platform/companies/${companyId}/travellers?page_size=100`),
    enabled: Boolean(companyId) && tab === "travellers",
  });

  const company = companyQuery.data;

  const branchColumns: Column<ApiBranch>[] = [
    { key: "name", header: "Sub Company", render: (row) => (
      <div>
        <p className="font-semibold text-slate-900">{row.name}</p>
        <p className="font-mono text-[11px] text-slate-400">{row.code}</p>
      </div>
    ) },
    {
      key: "branchType",
      header: "Type",
      render: (row) => <Badge variant={row.branchType === "Branch" ? "blue" : "violet"}>{row.branchType}</Badge>,
    },
    { key: "location", header: "Location" },
    { key: "managerName", header: "Manager" },
    { key: "users", header: "Users" },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={apiStatus(row.status)} /> },
  ];

  const userColumns: Column<ApiUser>[] = [
    { key: "name", header: "Name", render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: "email", header: "Email" },
    {
      key: "roles",
      header: "Roles",
      render: (row) => row.roles.join(", ") || "—",
    },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={apiStatus(row.status)} /> },
    {
      key: "lastLoginAt",
      header: "Last Login",
      render: (row) => (row.lastLoginAt ? fmtDate(row.lastLoginAt) : "—"),
    },
  ];

  const travellerColumns: Column<ApiTraveller>[] = [
    {
      key: "firstName",
      header: "Traveller",
      render: (row) => (
        <span className="font-semibold text-slate-900">
          {row.firstName} {row.lastName}
        </span>
      ),
    },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    { key: "city", header: "City" },
    { key: "country", header: "Country" },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={apiStatus(row.status)} /> },
  ];

  const handleSaveLimits = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
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
      setSaving(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Limits could not be updated.");
      setSaving(false);
    }
  };

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "branches", label: "Sub Companies" },
    { key: "users", label: "Users" },
    { key: "travellers", label: "Travellers" },
  ];

  return (
    <>
      <PageHeader
        title={company?.tradingName ?? "Company"}
        description={company ? company.legalName : "Loading company details..."}
        actions={
          <Link to={PATHS.platform.companies}>
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      {companyQuery.isLoading && <p className="text-sm text-slate-500">Loading company...</p>}
      {companyQuery.error && (
        <p className="text-sm text-rose-600">
          {companyQuery.error instanceof Error
            ? companyQuery.error.message
            : "Company could not be loaded."}
        </p>
      )}

      {company && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {usageChip("Sub Companies", company.usage?.subCompanies, company.maxSubCompanies)}
            {usageChip("Users", company.usage?.users, company.maxUsers)}
            {usageChip("Travellers", company.usage?.travellers, company.maxTravellers)}
          </div>

          <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  tab === item.key
                    ? "bg-brand-600 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card title="Company Details">
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    ["Email", company.email],
                    ["Phone", company.phone || "—"],
                    ["Currency", company.baseCurrency],
                    ["Timezone", company.timezone],
                    ["IATA", company.iataNumber || "—"],
                    ["UIC", company.uicCode || "—"],
                    ["License", company.businessLicense || "—"],
                    ["Status", company.status],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                        {label}
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold text-slate-800">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 text-sm text-slate-500">{company.address || "No address on file."}</p>
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
                  {error && <p className="text-sm text-rose-600">{error}</p>}
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Limits"}
                  </Button>
                </form>
              </Card>
            </div>
          )}

          {tab === "branches" && (
            <>
              <DataTable
                columns={branchColumns}
                data={branchesQuery.data?.items ?? []}
                rowKey={(row) => row.id}
                searchPlaceholder="Search sub companies..."
                searchKeys={["name", "code", "location", "managerName"]}
              />
              {branchesQuery.isLoading && <p className="mt-3 text-sm text-slate-500">Loading sub companies...</p>}
            </>
          )}

          {tab === "users" && (
            <>
              <DataTable
                columns={userColumns}
                data={usersQuery.data?.items ?? []}
                rowKey={(row) => row.id}
                searchPlaceholder="Search users..."
                searchKeys={["name", "email"]}
              />
              {usersQuery.isLoading && <p className="mt-3 text-sm text-slate-500">Loading users...</p>}
            </>
          )}

          {tab === "travellers" && (
            <>
              <DataTable
                columns={travellerColumns}
                data={travellersQuery.data?.items ?? []}
                rowKey={(row) => row.id}
                searchPlaceholder="Search travellers..."
                searchKeys={["firstName", "lastName", "email", "city"]}
              />
              {travellersQuery.isLoading && (
                <p className="mt-3 text-sm text-slate-500">Loading travellers...</p>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
