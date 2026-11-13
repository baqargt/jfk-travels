import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Eye, Pencil, Plus } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import Badge, { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import QuotaUsageBanner from "@/components/ui/QuotaUsageBanner";
import { apiRequest } from "@/api/client";
import { apiStatus, type ApiBranch, type ApiPage } from "@/api/types";
import { fmtDate, fmtMoney } from "@/lib/utils";
import { PATHS } from "@/routes/paths";
import type { SubCompany } from "@/types";

export default function SubCompaniesPage() {
  const [selected, setSelected] = useState<SubCompany | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["branches"],
    queryFn: () => apiRequest<ApiPage<ApiBranch>>("/branches?page_size=100"),
  });
  const companies: SubCompany[] = (data?.items ?? []).map((branch) => ({
    id: branch.id,
    name: branch.name,
    type: branch.branchType,
    location: branch.location,
    manager: branch.managerName,
    users: branch.users,
    creditLimit: Number(branch.creditLimit),
    cashBalance: Number(branch.cashBalance),
    status: apiStatus(branch.status),
    createdAt: branch.createdAt,
  }));

  const columns: Column<SubCompany>[] = [
    {
      key: "name",
      header: "Sub Company",
      render: (s) => (
        <div>
          <p className="font-semibold text-slate-900">{s.name}</p>
          <p className="font-mono text-[11px] text-slate-400">{s.id}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (s) => (
        <Badge variant={s.type === "Branch" ? "blue" : "violet"}>{s.type}</Badge>
      ),
    },
    { key: "location", header: "Location" },
    { key: "manager", header: "Manager" },
    { key: "users", header: "Users", sortValue: (s) => s.users },
    {
      key: "creditLimit",
      header: "Credit Limit",
      sortValue: (s) => s.creditLimit,
      className: "tabular-nums",
      render: (s) => fmtMoney(s.creditLimit),
    },
    {
      key: "cashBalance",
      header: "Cash Balance",
      sortValue: (s) => s.cashBalance,
      className: "tabular-nums",
      render: (s) => fmtMoney(s.cashBalance),
    },
    { key: "status", header: "Status", render: (s) => <StatusBadge status={s.status} /> },
    { key: "createdAt", header: "Onboarded", sortValue: (s) => s.createdAt, render: (s) => fmtDate(s.createdAt) },
    {
      key: "actions",
      header: "",
      headerClassName: "!text-right",
      className: "!text-right",
      render: (s) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="!h-8 !w-8 text-slate-400 hover:text-brand-600"
            title="View sub company"
            onClick={() => setSelected(s)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Link to={PATHS.company.editSubCompany(s.id)} title="Edit sub company">
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
        title="Sub Companies"
        description="Branches and franchises operating under the JFK Travel umbrella."
        actions={
          <Link to={PATHS.company.createSubCompany}>
            <Button>
              <Plus className="h-4 w-4" />
              Add Sub Company
            </Button>
          </Link>
        }
      />
      <QuotaUsageBanner kind="subCompanies" />
      <DataTable
        columns={columns}
        data={companies}
        rowKey={(s) => s.id}
        searchPlaceholder="Search by name, city or manager..."
        searchKeys={["name", "location", "manager"]}
      />
      {isLoading && <p className="mt-3 text-sm text-slate-500">Loading sub-companies...</p>}
      {error && <p className="mt-3 text-sm text-rose-600">{error instanceof Error ? error.message : "Sub-companies could not be loaded."}</p>}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? selected.name : "Sub Company"}
        subtitle={selected ? `${selected.type} · ${selected.id}` : undefined}
        size="lg"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
            {selected && (
              <Link to={PATHS.company.editSubCompany(selected.id)}>
                <Button>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            )}
          </>
        )}
      >
        {selected && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {[
              ["Type", selected.type],
              ["Location", selected.location || "—"],
              ["Manager", selected.manager || "—"],
              ["Users", String(selected.users)],
              ["Credit Limit", fmtMoney(selected.creditLimit)],
              ["Cash Balance", fmtMoney(selected.cashBalance)],
              ["Status", selected.status],
              ["Onboarded", fmtDate(selected.createdAt)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">{label}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>
    </>
  );
}
