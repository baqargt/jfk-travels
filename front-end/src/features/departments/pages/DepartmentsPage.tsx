import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import StatusToggle from "@/components/ui/StatusToggle";
import PageHeader from "@/components/ui/PageHeader";
import { apiRequest } from "@/api/client";
import { apiStatus, type ApiDepartment, type ApiPage } from "@/api/types";
import { fmtDate } from "@/lib/utils";
import { PATHS } from "@/routes/paths";
import type { Department } from "@/types";

type DepartmentRow = Department & { code?: string };

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<DepartmentRow | null>(null);
  const [selected, setSelected] = useState<DepartmentRow | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiRequest<ApiPage<ApiDepartment>>("/departments?page_size=100"),
  });
  const list: DepartmentRow[] = (data?.items ?? []).map((department) => ({
    id: department.id,
    name: department.name,
    code: department.code,
    head: department.headName,
    users: department.users,
    status: apiStatus(department.status),
    createdAt: department.createdAt,
  }));
  const updateDepartment = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest(`/departments/${id}`, { method: "PATCH", body: { status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });
  const deactivateDepartment = useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/departments/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });

  const toggleStatus = (id: string) => {
    const department = list.find((item) => item.id === id);
    if (department) updateDepartment.mutate({ id, status: department.status === "Active" ? "inactive" : "active" });
  };

  const confirmDelete = () => {
    if (toDelete) deactivateDepartment.mutate(toDelete.id);
    setToDelete(null);
  };

  const columns: Column<DepartmentRow>[] = [
    {
      key: "name",
      header: "Department",
      render: (d) => (
        <div>
          <p className="font-semibold text-slate-900">{d.name}</p>
          <p className="font-mono text-[11px] text-slate-400">{d.code ?? d.id}</p>
        </div>
      ),
    },
    { key: "head", header: "Head" },
    { key: "users", header: "Users", sortValue: (d) => d.users, className: "tabular-nums" },
    {
      key: "status",
      header: "Status",
      render: (d) => (
        <StatusToggle
          label={false}
          checked={d.status === "Active"}
          onChange={() => toggleStatus(d.id)}
        />
      ),
    },
    { key: "createdAt", header: "Created", sortValue: (d) => d.createdAt, render: (d) => fmtDate(d.createdAt) },
    {
      key: "actions",
      header: "",
      headerClassName: "!text-right",
      className: "!text-right",
      render: (d) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="!h-8 !w-8 text-slate-400 hover:text-brand-600"
            title="View department"
            onClick={() => setSelected(d)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Link to={PATHS.departments.edit(d.id)} title="Edit department">
            <Button variant="ghost" size="icon" className="!h-8 !w-8 text-slate-400 hover:text-brand-600">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="!h-8 !w-8 text-slate-400 hover:text-rose-600"
            title="Delete department"
            onClick={() => setToDelete(d)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Departments"
        description="Manage departments under the JFK Travel umbrella."
        actions={
          <Link to={PATHS.departments.create}>
            <Button>
              <Plus className="h-4 w-4" />
              Add Department
            </Button>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={list}
        rowKey={(d) => d.id}
        searchPlaceholder="Search by name or head..."
        searchKeys={["name", "head"]}
      />

      {isLoading && <p className="mt-3 text-sm text-slate-500">Loading departments...</p>}
      {error && <p className="mt-3 text-sm text-rose-600">{error instanceof Error ? error.message : "Departments could not be loaded."}</p>}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? selected.name : "Department"}
        subtitle={selected ? `${selected.code ?? selected.id}` : undefined}
        size="lg"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
            {selected && (
              <Link to={PATHS.departments.edit(selected.id)}>
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
              ["Code", selected.code || "—"],
              ["Head", selected.head || "—"],
              ["Users", String(selected.users)],
              ["Status", selected.status],
              ["Created", fmtDate(selected.createdAt)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">{label}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Deactivate department?"
        subtitle="Only empty departments can be deactivated."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deactivateDepartment.isPending}>
              Deactivate
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          You're about to remove <span className="font-semibold text-slate-900">{toDelete?.name}</span>.{" "}
          <StatusBadge status={toDelete?.status ?? "Inactive"} /> Users assigned to this department will
          need to be reassigned.
        </p>
      </Modal>
    </>
  );
}
