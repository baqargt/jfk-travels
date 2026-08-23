import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, SlidersHorizontal } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import Badge, { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { pricingRules as seed } from "@/lib/mockReports";
import { fmtDate } from "@/lib/utils";
import { PATHS } from "@/routes/paths";
import type { PricingRule } from "@/types";

const scopeVariant: Record<string, "blue" | "violet" | "amber" | "green"> = {
  Global: "green",
  Airline: "blue",
  Route: "violet",
  "Sub Company": "amber",
};

export default function PricingModelsPage() {
  const [rules] = useState<PricingRule[]>(seed);

  const columns: Column<PricingRule>[] = [
    {
      key: "name",
      header: "Model",
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-900">{r.name}</p>
          <p className="font-mono text-[11px] text-slate-400">{r.id}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      sortValue: (r) => r.type,
      render: (r) => <Badge variant={r.type === "Markup" ? "blue" : "violet"}>{r.type}</Badge>,
    },
    {
      key: "scope",
      header: "Scope",
      sortValue: (r) => r.scope,
      render: (r) => (
        <Badge variant={scopeVariant[r.scope] ?? "gray"}>{r.scope}</Badge>
      ),
    },
    { key: "appliesTo", header: "Applies To" },
    {
      key: "value",
      header: "Value",
      sortValue: (r) => r.value,
      className: "!text-right font-semibold tabular-nums",
      render: (r) =>
        r.suffix === "%" ? `${r.value.toFixed(2)}%` : `$${r.value.toFixed(2)}`,
    },
    {
      key: "priority",
      header: "Priority",
      sortValue: (r) => r.priority,
      className: "!text-center",
      render: (r) => (
        <span className="inline-grid h-6 w-6 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-600">
          {r.priority}
        </span>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "updatedAt", header: "Updated", sortValue: (r) => r.updatedAt, render: (r) => fmtDate(r.updatedAt) },
  ];

  return (
    <>
      <PageHeader
        title="Pricing Models"
        description="Markup and commission rules applied to fares across all channels."
        actions={
          <>
            <Button variant="secondary">
              <SlidersHorizontal className="h-4 w-4" />
              Simulate Fare
            </Button>
            <Link to={PATHS.createPricing}>
              <Button>
                <Plus className="h-4 w-4" />
                New Model
              </Button>
            </Link>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={rules}
        rowKey={(r) => r.id}
        searchPlaceholder="Search models..."
        searchKeys={["name", "appliesTo", "scope"]}
      />

      <p className="mt-3 px-1 text-xs text-slate-400">
        Rules are evaluated by priority — the lowest number wins when multiple models match a fare.
      </p>
    </>
  );
}
