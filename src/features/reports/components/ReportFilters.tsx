import type { ReactNode } from "react";
import { Download, Filter } from "lucide-react";
import Button from "@/components/ui/Button";
import Input, { Label, Select } from "@/components/ui/Input";

interface ReportFiltersProps {
  extra?: ReactNode;
  statusOptions?: string[];
  agents?: string[];
}

export default function ReportFilters({ extra, statusOptions = ["All statuses"], agents }: ReportFiltersProps) {
  return (
    <div className="mb-5 grid grid-cols-1 items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
      <div>
        <Label>From</Label>
        <Input type="date" defaultValue="2026-08-01" />
      </div>
      <div>
        <Label>To</Label>
        <Input type="date" defaultValue="2026-08-22" />
      </div>
      {agents && (
        <div>
          <Label>Agent</Label>
          <Select defaultValue="">
            <option value="">All agents</option>
            {agents.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </Select>
        </div>
      )}
      {extra ?? null}
      <div>
        <Label>Status</Label>
        <Select defaultValue={statusOptions[0]}>
          {statusOptions.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" title="Export CSV">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button title="Apply filters">
          <Filter className="h-4 w-4" />
          Apply
        </Button>
      </div>
    </div>
  );
}
