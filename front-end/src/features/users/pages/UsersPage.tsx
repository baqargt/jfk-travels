import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import StatusToggle from "@/components/ui/StatusToggle";
import PageHeader from "@/components/ui/PageHeader";
import { users as seed } from "@/lib/mockUsers";
import { initials } from "@/lib/utils";
import { PATHS } from "@/routes/paths";
import type { AppUser, Role } from "@/types";

const roleVariant: Record<Role, "red" | "violet" | "blue" | "amber" | "gray"> = {
  Administrator: "red",
  Manager: "violet",
  Agent: "blue",
  Accounts: "amber",
  "Sub Agent": "gray",
};

export default function UsersPage() {
  const [list, setList] = useState<AppUser[]>(seed);
  const [toDelete, setToDelete] = useState<AppUser | null>(null);

  const toggleStatus = (id: string) => {
    setList((users) =>
      users.map((u) =>
        u.id === id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u,
      ),
    );
  };

  const confirmDelete = () => {
    if (toDelete) setList((users) => users.filter((u) => u.id !== toDelete.id));
    setToDelete(null);
  };

  const columns: Column<AppUser>[] = [
    {
      key: "name",
      header: "User",
      render: (u) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
            {initials(u.name)}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{u.name}</p>
            <p className="truncate text-xs text-slate-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortValue: (u) => u.role,
      render: (u) => <Badge variant={roleVariant[u.role]}>{u.role}</Badge>,
    },
    { key: "subCompany", header: "Sub Company" },
    {
      key: "status",
      header: "Status",
      render: (u) => (
        <StatusToggle
          label={false}
          checked={u.status === "Active"}
          onChange={() => toggleStatus(u.id)}
        />
      ),
    },
    { key: "lastLogin", header: "Last Login", sortValue: (u) => u.lastLogin, className: "text-xs text-slate-500" },
    {
      key: "actions",
      header: "",
      headerClassName: "!text-right",
      className: "!text-right",
      render: (u) => (
        <div className="flex justify-end gap-1">
          <Link to={PATHS.createUser} title="Edit user">
            <Button variant="ghost" size="icon" className="!h-8 !w-8 text-slate-400 hover:text-brand-600">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="!h-8 !w-8 text-slate-400 hover:text-rose-600"
            title="Delete user"
            onClick={() => setToDelete(u)}
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
        title="Users"
        description="Manage platform accounts, roles and access for your team."
        actions={
          <Link to={PATHS.createUser}>
            <Button>
              <Plus className="h-4 w-4" />
              Create User
            </Button>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={list}
        rowKey={(u) => u.id}
        searchPlaceholder="Search by name, email or role..."
        searchKeys={["name", "email", "role", "subCompany"]}
      />

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete user?"
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
          You're about to remove <span className="font-semibold text-slate-900">{toDelete?.name}</span>{" "}
          (<StatusBadge status="Inactive" /> account). Their booking history will be retained but
          they will immediately lose system access.
        </p>
      </Modal>
    </>
  );
}
