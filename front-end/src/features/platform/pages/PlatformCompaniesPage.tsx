import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Eye, FileText, Pencil, Plus } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { apiRequest } from "@/api/client";
import { apiStatus, type ApiCompany, type ApiPage } from "@/api/types";
import { PATHS } from "@/routes/paths";

function usageLabel(used: number | undefined, max: number) {
  return `${used ?? 0} / ${max}`;
}

export default function PlatformCompaniesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["platform-companies"],
    queryFn: () => apiRequest<ApiPage<ApiCompany>>("/platform/companies?page_size=100"),
  });
  const companies = data?.items ?? [];

  const columns: Column<ApiCompany>[] = [
    {
      key: "tradingName",
      header: "Company",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.tradingName}</p>
          <p className="text-xs text-slate-400">{row.legalName}</p>
        </div>
      ),
    },
    { key: "email", header: "Email" },
    {
      key: "maxSubCompanies",
      header: "Sub Companies",
      render: (row) => usageLabel(row.usage?.subCompanies, row.maxSubCompanies),
    },
    {
      key: "maxUsers",
      header: "Users",
      render: (row) => usageLabel(row.usage?.users, row.maxUsers),
    },
    {
      key: "maxTravellers",
      header: "Travellers",
      render: (row) => usageLabel(row.usage?.travellers, row.maxTravellers),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={apiStatus(row.status)} />,
    },
    {
      key: "actions",
      header: "",
      headerClassName: "!text-right",
      className: "!text-right",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Link to={`${PATHS.dashboard}?companyId=${row.id}`} title="Dashboard report">
            <Button variant="ghost" size="icon" className="!h-8 !w-8 text-slate-400 hover:text-brand-600">
              <FileText className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={PATHS.platform.companyDetail(row.id)} title="View company">
            <Button variant="ghost" size="icon" className="!h-8 !w-8 text-slate-400 hover:text-brand-600">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={PATHS.platform.companyEdit(row.id)} title="Edit company">
            <Button variant="ghost" size="icon" className="!h-8 !w-8 text-slate-400 hover:text-brand-600">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Companies"
        description="Create companies and manage platform quotas for sub-companies, users, and travellers."
        actions={
          <Link to={PATHS.platform.createCompany}>
            <Button>
              <Plus className="h-4 w-4" />
              Create Company
            </Button>
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={companies}
        rowKey={(row) => row.id}
        searchPlaceholder="Search companies..."
        searchKeys={["tradingName", "legalName", "email"]}
      />
      {isLoading && <p className="mt-3 text-sm text-slate-500">Loading companies...</p>}
      {error && (
        <p className="mt-3 text-sm text-rose-600">
          {error instanceof Error ? error.message : "Companies could not be loaded."}
        </p>
      )}
    </>
  );
}
