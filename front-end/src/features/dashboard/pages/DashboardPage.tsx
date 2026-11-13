import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Car, CreditCard, FileText, Hotel, Plane, ShieldCheck } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { apiRequest } from "@/api/client";
import type { ApiCompany, ApiPage, DashboardSummary, FinancialAccount } from "@/api/types";
import { useAuth } from "@/context/AuthContext";
import { fmtDate, fmtMoney, pct } from "@/lib/utils";
import { PATHS } from "@/routes/paths";

interface RecentBooking {
  id: string;
  reference: string;
  service: string;
  amount: string;
  currency: string;
  status: string;
  date: string;
}

const quickLinks = [
  { label: "Flights", icon: Plane, path: PATHS.booking.flights },
  { label: "Hotels", icon: Hotel, path: PATHS.booking.hotels },
  { label: "Insurance", icon: ShieldCheck, path: PATHS.booking.insurance },
  { label: "Transfers", icon: Car, path: PATHS.booking.transfers },
];

const columns: Column<RecentBooking>[] = [
  { key: "reference", header: "Booking", className: "font-mono text-xs font-medium" },
  { key: "service", header: "Service" },
  {
    key: "amount",
    header: "Amount",
    className: "!text-right font-semibold",
    render: (row) => fmtMoney(Number(row.amount)),
  },
  { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
  { key: "date", header: "Date", render: (row) => fmtDate(row.date) },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const isSuperAdmin = Boolean(user?.isSuperAdmin);
  const [searchParams, setSearchParams] = useSearchParams();
  const companyId = searchParams.get("companyId") ?? "";

  const { data: companiesPage } = useQuery({
    queryKey: ["platform-companies"],
    queryFn: () => apiRequest<ApiPage<ApiCompany>>("/platform/companies?page_size=100"),
    enabled: isSuperAdmin,
  });
  const companies = companiesPage?.items ?? [];
  const selectedCompany = companies.find((company) => company.id === companyId);
  const canLoadCompanyDashboard = isSuperAdmin && Boolean(companyId);

  const { data: summary } = useQuery({
    queryKey: isSuperAdmin
      ? ["platform-dashboard-summary", companyId]
      : ["dashboard-summary"],
    queryFn: () =>
      isSuperAdmin
        ? apiRequest<DashboardSummary>(`/platform/companies/${companyId}/dashboard/summary`)
        : apiRequest<DashboardSummary>("/dashboard/summary"),
    enabled: isSuperAdmin ? canLoadCompanyDashboard : true,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: isSuperAdmin
      ? ["platform-financial-accounts", companyId]
      : ["financial-accounts"],
    queryFn: () =>
      isSuperAdmin
        ? apiRequest<FinancialAccount[]>(`/platform/companies/${companyId}/financial-accounts`)
        : apiRequest<FinancialAccount[]>("/financial-accounts"),
    enabled: isSuperAdmin ? canLoadCompanyDashboard : true,
  });

  const { data: recent } = useQuery({
    queryKey: isSuperAdmin
      ? ["platform-dashboard-bookings", companyId]
      : ["dashboard-bookings"],
    queryFn: () =>
      isSuperAdmin
        ? apiRequest<ApiPage<RecentBooking>>(
            `/platform/companies/${companyId}/reports/dsr?page_size=8`,
          )
        : apiRequest<ApiPage<RecentBooking>>("/reports/dsr?page_size=8"),
    enabled: isSuperAdmin ? canLoadCompanyDashboard : true,
  });

  const cash = accounts.filter((item) => item.accountType === "cash");
  const credit = accounts.filter((item) => item.accountType === "credit");
  const cashTotal = cash.reduce((sum, item) => sum + Number(item.limitAmount), 0);
  const cashAvailable = cash.reduce((sum, item) => sum + Number(item.balance), 0);
  const creditTotal = credit.reduce((sum, item) => sum + Number(item.limitAmount), 0);
  const creditAvailable = credit.reduce((sum, item) => sum + Number(item.balance), 0);
  const utilization = [
    {
      label: "Cash",
      used: Math.max(0, cashTotal - cashAvailable),
      total: cashTotal,
      bar: "bg-emerald-500",
      link: PATHS.limits.cash,
    },
    {
      label: "Credit",
      used: Math.max(0, creditTotal - creditAvailable),
      total: creditTotal,
      bar: "bg-brand-500",
      link: PATHS.limits.credit,
    },
  ];

  const handleCompanyChange = (nextId: string) => {
    if (!nextId) {
      setSearchParams({}, { replace: true });
      return;
    }
    setSearchParams({ companyId: nextId }, { replace: true });
  };

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          isSuperAdmin
            ? selectedCompany
              ? `Reporting for ${selectedCompany.tradingName}`
              : "Select a company to view dashboard reporting."
            : "Live operational and financial overview from PostgreSQL."
        }
        actions={
          isSuperAdmin ? (
            <div className="min-w-[240px]">
              <Select
                value={companyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
                aria-label="Select company"
              >
                <option value="">Select company…</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.tradingName}
                  </option>
                ))}
              </Select>
            </div>
          ) : undefined
        }
      />

      {isSuperAdmin && !companyId && (
        <Card title="Company required" description="Dashboard reporting is company-scoped for Super Admin.">
          <p className="text-sm text-slate-600">
            Choose a company above, or open a company from{" "}
            <Link to={PATHS.platform.companies} className="font-medium text-brand-600 hover:underline">
              Platform Companies
            </Link>{" "}
            using the Report button.
          </p>
        </Card>
      )}

      {(!isSuperAdmin || companyId) && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Bookings"
              value={String(summary?.bookings ?? 0)}
              note="all recorded bookings"
              icon={FileText}
              tone="blue"
            />
            <StatCard
              label="Gross Sales"
              value={fmtMoney(Number(summary?.grossSales ?? 0))}
              note={summary?.currency ?? "USD"}
              icon={ArrowRight}
              tone="emerald"
            />
            <StatCard
              label="Customers / Travellers"
              value={`${summary?.customers ?? 0} / ${summary?.travellers ?? 0}`}
              note="active database records"
              icon={CreditCard}
              tone="violet"
            />
            <StatCard
              label="Pending Refunds"
              value={String(summary?.refundsPending ?? 0)}
              note="awaiting workflow action"
              icon={ShieldCheck}
              tone="amber"
            />
          </div>
          <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <DataTable
                columns={columns}
                data={recent?.items ?? []}
                rowKey={(row) => row.id}
                searchable={false}
                initialPageSize={8}
                pageSizeOptions={[8]}
                compact
                emptyTitle="No bookings yet"
                toolbarActions={
                  !isSuperAdmin ? (
                    <Link to={PATHS.reports.dsr}>
                      <Button variant="ghost" size="sm">
                        View report
                      </Button>
                    </Link>
                  ) : undefined
                }
              />
            </div>
            <div className="space-y-6">
              <Card title="Limit Utilization" description="Live financial headroom">
                <div className="space-y-4">
                  {utilization.map((item) => {
                    const body = (
                      <>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">{item.label}</span>
                          <span className="tabular-nums text-slate-400">
                            {pct(item.used, item.total)}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${item.bar}`}
                            style={{ width: `${pct(item.used, item.total)}%` }}
                          />
                        </div>
                      </>
                    );
                    return isSuperAdmin ? (
                      <div key={item.label}>{body}</div>
                    ) : (
                      <Link key={item.label} to={item.link} className="block group">
                        {body}
                      </Link>
                    );
                  })}
                </div>
              </Card>
              {!isSuperAdmin && (
                <Card title="Quick Booking" description="Start a deterministic supplier search">
                  <div className="grid grid-cols-2 gap-2">
                    {quickLinks.map(({ label, icon: Icon, path }) => (
                      <Link
                        key={path}
                        to={path}
                        className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:border-brand-300 hover:bg-brand-50"
                      >
                        <Icon className="h-4 w-4 text-brand-600" />
                        {label}
                      </Link>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
