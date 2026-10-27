import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Plus, X } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import Badge, { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { getCustomers } from "@/features/customers/customerRepository";
import { fmtDate } from "@/lib/utils";
import { PATHS } from "@/routes/paths";
import type { Customer } from "@/types";

interface SuccessState {
  createdAgentCode?: string;
  customerName?: string;
}

export default function CustomersPage() {
  const location = useLocation();
  const state = location.state as SuccessState | null;
  const [successVisible, setSuccessVisible] = useState(Boolean(state?.createdAgentCode));
  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Customer",
      render: (customer) => (
        <div>
          <p className="font-semibold text-slate-900">{customer.name}</p>
          <p className="font-mono text-[11px] text-slate-400">{customer.agentCode}</p>
        </div>
      ),
    },
    { key: "accountCode", header: "Account Code", className: "font-mono text-xs" },
    {
      key: "customerTypes",
      header: "Type",
      render: (customer) => (
        <div className="flex max-w-52 flex-wrap gap-1">
          {customer.customerTypes.map((type) => <Badge key={type} variant="blue">{type}</Badge>)}
        </div>
      ),
    },
    {
      key: "branches",
      header: "Branches",
      render: (customer) => customer.branches.join(", "),
    },
    { key: "accountManager", header: "Account Manager", render: (customer) => customer.accountManager || "Unassigned" },
    { key: "defaultCurrency", header: "Currency" },
    { key: "status", header: "Status", render: (customer) => <StatusBadge status={customer.status} /> },
    { key: "createdAt", header: "Created", render: (customer) => fmtDate(customer.createdAt) },
  ];

  return (
    <>
      <PageHeader
        title="Customers"
        description="Manage customer organizations, commercial settings and access."
        actions={
          <Link to={PATHS.customers.create}>
            <Button><Plus className="h-4 w-4" />Create Customer</Button>
          </Link>
        }
      />

      {successVisible && state?.createdAgentCode && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">{state.customerName ?? "Customer"} was created successfully.</p>
            <p className="mt-0.5 text-emerald-700">Agent Code: <span className="font-mono font-semibold">{state.createdAgentCode}</span></p>
          </div>
          <button type="button" onClick={() => setSuccessVisible(false)} aria-label="Dismiss" className="rounded p-1 hover:bg-emerald-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={customers}
        rowKey={(customer) => customer.id}
        searchPlaceholder="Search name, code, email, type, branch or manager..."
        searchKeys={["name", "agentCode", "accountCode", "email", "customerTypes", "branches", "accountManager"]}
        emptyTitle="No customers yet"
        emptyMessage="Create your first customer to start managing their account."
      />
      {isLoading && <p className="mt-3 text-sm text-slate-500">Loading customers...</p>}
      {error && <p className="mt-3 text-sm text-rose-600">{error instanceof Error ? error.message : "Customers could not be loaded."}</p>}
    </>
  );
}
