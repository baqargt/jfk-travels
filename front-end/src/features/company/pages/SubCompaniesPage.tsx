import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import Badge, { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { subCompanies as seed } from "@/lib/mockData";
import { fmtDate, fmtMoney } from "@/lib/utils";
import { PATHS } from "@/routes/paths";
import type { SubCompany } from "@/types";

export default function SubCompaniesPage() {
  const [companies] = useState<SubCompany[]>(seed);

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
      <DataTable
        columns={columns}
        data={companies}
        rowKey={(s) => s.id}
        searchPlaceholder="Search by name, city or manager..."
        searchKeys={["name", "location", "manager"]}
      />
    </>
  );
}
