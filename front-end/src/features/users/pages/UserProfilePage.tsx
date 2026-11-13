import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ArrowLeft, Pencil } from "lucide-react";
import Badge, { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import { apiRequest } from "@/api/client";
import { apiStatus, type ApiBranch, type ApiDepartment, type ApiPage, type ApiUser } from "@/api/types";
import { fmtDate, initials } from "@/lib/utils";
import { PATHS } from "@/routes/paths";
import type { Role } from "@/types";

const roleVariant: Record<Role, "red" | "violet" | "blue" | "amber" | "gray"> = {
  SuperAdmin: "red",
  Administrator: "red",
  Manager: "violet",
  Agent: "blue",
  Accounts: "amber",
  "Sub Agent": "gray",
};

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [archiveOpen, setArchiveOpen] = useState(false);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["users", userId],
    queryFn: () => apiRequest<ApiUser>(`/users/${userId}`),
    enabled: Boolean(userId),
  });
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => apiRequest<ApiPage<ApiBranch>>("/branches?page_size=100"),
  });
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiRequest<ApiPage<ApiDepartment>>("/departments?page_size=100"),
  });

  const archiveUser = useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      setArchiveOpen(false);
      navigate(PATHS.users);
    },
  });

  if (!userId) return <Navigate to={PATHS.users} replace />;
  if (isLoading) return <p className="p-8 text-sm text-slate-500">Loading user profile...</p>;
  if (error || !user) {
    return (
      <div className="space-y-4 p-8">
        <p className="text-sm text-rose-600">
          {error instanceof Error ? error.message : "User could not be loaded."}
        </p>
        <Link to={PATHS.users}>
          <Button variant="secondary">Back to Users</Button>
        </Link>
      </div>
    );
  }

  const role = (user.roles[0] ?? "Agent") as Role;
  const branchName = branches?.items.find((branch) => branch.id === user.branchId)?.name
    ?? (user.branchId ? user.branchId : "Head Office");
  const departmentName = departments?.items.find((department) => department.id === user.departmentId)?.name
    ?? (user.departmentId ? user.departmentId : "—");
  const status = apiStatus(user.status);
  const lastLogin = user.lastLoginAt ? fmtDate(user.lastLoginAt) : "Never";

  return (
    <>
      <PageHeader
        title="User Profile"
        description="View account details, role and branch assignment."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link to={PATHS.users}>
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Back to Users
              </Button>
            </Link>
            <Button
              variant="secondary"
              className="text-rose-600 hover:bg-rose-50"
              onClick={() => setArchiveOpen(true)}
            >
              <Archive className="h-4 w-4" />
              Archive
            </Button>
            <Link to={PATHS.editUser(user.id)}>
              <Button>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
        )}
      />

      <Card
        title={user.name}
        actions={<StatusBadge status={status} />}
      >
        <div className="mb-6 flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-base font-bold text-brand-700">
            {initials(user.name)}
          </span>
          <div>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="mt-1.5">
              <Badge variant={roleVariant[role] ?? "gray"}>{role}</Badge>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Email", user.email],
            ["Role", role],
            ["Sub Company", branchName],
            ["Department", departmentName],
            ["Status", status],
            ["Last Login", lastLogin],
            ["User ID", user.id],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-medium tracking-wide text-slate-400 uppercase">{label}</dt>
              <dd className="mt-0.5 break-all text-sm font-semibold text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Modal
        open={archiveOpen}
        onClose={() => { if (!archiveUser.isPending) setArchiveOpen(false); }}
        title="Archive user?"
        subtitle="The account will immediately lose access."
        size="sm"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setArchiveOpen(false)} disabled={archiveUser.isPending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => archiveUser.mutate(user.id)}
              disabled={archiveUser.isPending}
            >
              {archiveUser.isPending ? "Archiving..." : "Archive account"}
            </Button>
          </>
        )}
      >
        <p className="text-sm text-slate-600">
          You're about to archive <span className="font-semibold text-slate-900">{user.name}</span>.
          Their booking history will be retained and they will immediately lose system access.
        </p>
        {archiveUser.error && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {archiveUser.error instanceof Error ? archiveUser.error.message : "User could not be archived."}
          </p>
        )}
      </Modal>
    </>
  );
}
