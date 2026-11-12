import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import StatusToggle from "@/components/ui/StatusToggle";
import PageHeader from "@/components/ui/PageHeader";
import { apiRequest } from "@/api/client";
import { apiStatus, type ApiAccessProfile, type ApiPage } from "@/api/types";
import { fmtDate } from "@/lib/utils";
import { PATHS } from "@/routes/paths";
import type { AccountStatus } from "@/types";

type Row = {
  id: string;
  name: string;
  description: string;
  permissionCount: number;
  status: AccountStatus;
  createdAt: string;
};

export default function AccessProfilesPage() {
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const [selected, setSelected] = useState<ApiAccessProfile | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["access-profiles"],
    queryFn: () => apiRequest<ApiPage<ApiAccessProfile>>("/access-profiles?page_size=100"),
  });
  const list: Row[] = (data?.items ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    permissionCount: item.permissionKeys.length,
    status: apiStatus(item.status),
    createdAt: item.createdAt,
  }));
  const updateProfile = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest(`/access-profiles/${id}`, { method: "PATCH", body: { status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["access-profiles"] }),
  });
  const deactivate = useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/access-profiles/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["access-profiles"] }),
  });

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Access Profile",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">{row.description || "No description"}</p>
        </div>
      ),
    },
    {
      key: "permissionCount",
      header: "Permissions",
      className: "tabular-nums",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusToggle
          label={false}
          checked={row.status === "Active"}
          onChange={() =>
            updateProfile.mutate({
              id: row.id,
              status: row.status === "Active" ? "inactive" : "active",
            })
          }
        />
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortValue: (row) => row.createdAt,
      render: (row) => fmtDate(row.createdAt),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(data?.items.find((item) => item.id === row.id) ?? null)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Link to={PATHS.accessProfiles.edit(row.id)}>
            <Button variant="ghost" size="sm">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setToDelete(row)}>
            <Trash2 className="h-4 w-4 text-rose-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Access Profiles"
        description="Define company/branch rights matrices assigned to users."
        actions={
          <Link to={PATHS.accessProfiles.create}>
            <Button>
              <Plus className="h-4 w-4" />
              Create Access Profile
            </Button>
          </Link>
        }
      />
      {error && (
        <p className="mb-4 text-sm text-rose-600">
          {error instanceof Error ? error.message : "Access profiles could not be loaded."}
        </p>
      )}
      <DataTable
        columns={columns}
        data={list}
        rowKey={(row) => row.id}
        emptyMessage="No access profiles yet."
      />
      {isLoading && <p className="mt-3 text-sm text-slate-500">Loading...</p>}
      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name ?? ""}>
        {selected && (
          <div className="space-y-2 text-sm">
            <p className="text-slate-600">{selected.description || "No description"}</p>
            <p className="font-medium text-slate-800">Permissions</p>
            <ul className="max-h-60 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs">
              {selected.permissionKeys.map((key) => (
                <li key={key}>{key}</li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
      <Modal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Deactivate access profile"
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (toDelete) deactivate.mutate(toDelete.id);
                setToDelete(null);
              }}
            >
              Deactivate
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Deactivate <span className="font-semibold">{toDelete?.name}</span>? Reassign users first.
        </p>
      </Modal>
    </>
  );
}
