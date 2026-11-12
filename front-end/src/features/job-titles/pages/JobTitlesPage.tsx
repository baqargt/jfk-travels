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
import { apiStatus, type ApiJobTitle, type ApiPage } from "@/api/types";
import { fmtDate } from "@/lib/utils";
import { PATHS } from "@/routes/paths";
import type { AccountStatus } from "@/types";

type JobTitleRow = {
  id: string;
  name: string;
  code: string;
  status: AccountStatus;
  createdAt: string;
};

export default function JobTitlesPage() {
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<JobTitleRow | null>(null);
  const [selected, setSelected] = useState<JobTitleRow | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["job-titles"],
    queryFn: () => apiRequest<ApiPage<ApiJobTitle>>("/job-titles?page_size=100"),
  });
  const list: JobTitleRow[] = (data?.items ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code,
    status: apiStatus(item.status),
    createdAt: item.createdAt,
  }));
  const updateJobTitle = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest(`/job-titles/${id}`, { method: "PATCH", body: { status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["job-titles"] }),
  });
  const deactivateJobTitle = useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/job-titles/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["job-titles"] }),
  });

  const columns: Column<JobTitleRow>[] = [
    {
      key: "name",
      header: "Job Title",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.name}</p>
          <p className="font-mono text-[11px] text-slate-400">{row.code}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusToggle
          label={false}
          checked={row.status === "Active"}
          onChange={() =>
            updateJobTitle.mutate({
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
          <Button variant="ghost" size="sm" onClick={() => setSelected(row)} aria-label="View">
            <Eye className="h-4 w-4" />
          </Button>
          <Link to={PATHS.jobTitles.edit(row.id)}>
            <Button variant="ghost" size="sm" aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setToDelete(row)} aria-label="Deactivate">
            <Trash2 className="h-4 w-4 text-rose-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Job Titles"
        description="Create and manage job titles for your company and branches."
        actions={
          <Link to={PATHS.jobTitles.create}>
            <Button>
              <Plus className="h-4 w-4" />
              Create Job Title
            </Button>
          </Link>
        }
      />
      {error && (
        <p className="mb-4 text-sm text-rose-600">
          {error instanceof Error ? error.message : "Job titles could not be loaded."}
        </p>
      )}
      <DataTable
        columns={columns}
        data={list}
        rowKey={(row) => row.id}
        emptyMessage="No job titles yet."
      />
      {isLoading && <p className="mt-3 text-sm text-slate-500">Loading...</p>}
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Job Title"}
      >
        {selected && (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-500">Code</dt>
              <dd className="font-medium">{selected.code}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd className="font-medium">{selected.status}</dd>
            </div>
          </dl>
        )}
      </Modal>
      <Modal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Deactivate job title"
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (toDelete) deactivateJobTitle.mutate(toDelete.id);
                setToDelete(null);
              }}
            >
              Deactivate
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Deactivate <span className="font-semibold">{toDelete?.name}</span>? Users must be
          reassigned first.
        </p>
      </Modal>
    </>
  );
}
