import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import StatusToggle from "@/components/ui/StatusToggle";
import PageHeader from "@/components/ui/PageHeader";
import { departments as seed } from "@/lib/mockData";
import { fmtDate } from "@/lib/utils";
import { PATHS } from "@/routes/paths";
import type { Department } from "@/types";

export default function DepartmentsPage() {
  const [list, setList] = useState<Department[]>(seed);
  const [toDelete, setToDelete] = useState<Department | null>(null);

  const toggleStatus = (id: string) => {
    setList((depts) =>
      depts.map((d) =>
        d.id === id ? { ...d, status: d.status === "Active" ? "Inactive" : "Active" } : d,
      ),
    );
  };

  const confirmDelete = () => {
    if (toDelete) setList((depts) => depts.filter((d) => d.id !== toDelete.id));
    setToDelete(null);
  };

  const columns: Column<Department>[] = [
    {
      key: "name",
      header: "Department",
      render: (d) => (
        <div>
          <p className="font-semibold text-slate-900">{d.name}</p>
          <p className="font-mono text-[11px] text-slate-400">{d.id}</p>
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
          <Link to={PATHS.departments.create} title="Edit department">
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

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete department?"
        subtitle="This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete permanently
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