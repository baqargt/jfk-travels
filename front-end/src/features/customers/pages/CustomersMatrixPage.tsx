import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import { apiRequest } from "@/api/client";
import type { ApiMatrix } from "@/api/types";
import { PATHS } from "@/routes/paths";

export default function CustomersMatrixPage() {
  const [branchType, setBranchType] = useState("");
  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (branchType) params.set("branch_type", branchType);
    const qs = params.toString();
    return qs ? `/customers/matrix?${qs}` : "/customers/matrix";
  }, [branchType]);
  const { data, isLoading, error } = useQuery({
    queryKey: ["customers-matrix", branchType],
    queryFn: () => apiRequest<ApiMatrix>(query),
  });

  return (
    <>
      <PageHeader
        title="Customers Matrix"
        description="Separate matrix view of customers across subcompany / branch / franchise."
        actions={
          <div className="flex items-center gap-2">
            <Select value={branchType} onChange={(e) => setBranchType(e.target.value)} className="w-40">
              <option value="">All types</option>
              <option value="Branch">Branch</option>
              <option value="Franchise">Franchise</option>
            </Select>
            <Link to={PATHS.customers.list}>
              <Button variant="ghost">Back to list</Button>
            </Link>
          </div>
        }
      />
      {error && (
        <p className="mb-4 text-sm text-rose-600">
          {error instanceof Error ? error.message : "Matrix could not be loaded."}
        </p>
      )}
      <Card bodyClassName="overflow-x-auto p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading matrix...</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="sticky left-0 bg-slate-50 px-4 py-3 text-left">Customer</th>
                {(data?.branches ?? []).map((branch) => (
                  <th key={branch.id} className="px-3 py-3 text-center">
                    <div>{branch.name}</div>
                    <div className="font-normal normal-case text-slate-400">{branch.branchType}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(data?.rows ?? []).map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70">
                  <td className="sticky left-0 bg-white px-4 py-2.5">
                    <Link
                      to={PATHS.customers.edit(row.id)}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      {row.name}
                    </Link>
                    <p className="text-xs text-slate-500">{String(row.accountCode ?? "")}</p>
                  </td>
                  {(data?.branches ?? []).map((branch) => (
                    <td key={branch.id} className="px-3 py-2.5 text-center">
                      {row.cells[branch.id] ? (
                        <Check className="mx-auto h-4 w-4 text-emerald-600" />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {!data?.rows.length && (
                <tr>
                  <td colSpan={(data?.branches.length ?? 0) + 1} className="px-4 py-8 text-center text-slate-500">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
