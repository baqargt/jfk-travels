import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import StatusToggle from "@/components/ui/StatusToggle";
import PageHeader from "@/components/ui/PageHeader";
import { apiRequest } from "@/api/client";
import { apiStatus, type ApiPage, type ApiUser } from "@/api/types";
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
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<AppUser | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiRequest<ApiPage<ApiUser>>("/users?page_size=100"),
  });
  const list: AppUser[] = (data?.items ?? []).map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.roles[0] ?? "Agent",
    subCompany: user.branchId ?? "Head Office",
    status: apiStatus(user.status),
    lastLogin: user.lastLoginAt ?? "Never",
  }));
  const updateUser = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiRequest(`/users/${id}`, { method: "PATCH", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
  const deactivateUser = useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/users/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const toggleStatus = (id: string) => {
    const selected = list.find((user) => user.id === id);
    if (selected) updateUser.mutate({ id, body: { status: selected.status === "Active" ? "inactive" : "active" } });
  };

  const confirmDelete = () => {
    if (toDelete) deactivateUser.mutate(toDelete.id);
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

      {isLoading && <p className="mt-3 text-sm text-slate-500">Loading users...</p>}
      {error && <p className="mt-3 text-sm text-rose-600">{error instanceof Error ? error.message : "Users could not be loaded."}</p>}

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Deactivate user?"
        subtitle="The account will immediately lose access."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deactivateUser.isPending}>
              Deactivate account
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          You're about to deactivate <span className="font-semibold text-slate-900">{toDelete?.name}</span>{" "}
          (<StatusBadge status="Inactive" /> account). Their booking history will be retained and
          they will immediately lose system access.
        </p>
      </Modal>
    </>
  );
}
