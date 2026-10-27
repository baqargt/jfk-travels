import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import { FormField, Textarea } from "@/components/ui/Input";
import { apiRequest } from "@/api/client";
import type { ApiApprovalRequest, ApiPage } from "@/api/types";
import { fmtDate } from "@/lib/utils";

export default function ApprovalRequestsPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<ApiApprovalRequest | null>(null);
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  const [comment, setComment] = useState("");
  const { data, isLoading, error } = useQuery({ queryKey: ["approval-requests"], queryFn: () => apiRequest<ApiPage<ApiApprovalRequest>>("/approval-requests?page_size=100") });
  const mutation = useMutation({
    mutationFn: () => apiRequest(`/approval-requests/${selected?.id}/decide`, { method: "POST", body: { decision, comment } }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["approval-requests"] }); setSelected(null); setComment(""); },
  });
  const open = (row: ApiApprovalRequest, next: "approved" | "rejected") => { setSelected(row); setDecision(next); setComment(""); };
  const columns: Column<ApiApprovalRequest>[] = [
    { key: "requestType", header: "Request", render: (row) => row.requestType.split("_").join(" ") },
    { key: "reason", header: "Reason" },
    { key: "createdAt", header: "Requested", render: (row) => fmtDate(row.createdAt) },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "actions", header: "", render: (row) => row.status === "pending" ? <div className="flex gap-2"><Button size="sm" onClick={() => open(row, "approved")}>Approve</Button><Button size="sm" variant="secondary" onClick={() => open(row, "rejected")}>Reject</Button></div> : null },
  ];
  return <>
    <PageHeader title="Approval Requests" description="Pricing, finance and refund decisions. Requesters cannot decide their own requests." />
    {error && <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error instanceof Error ? error.message : "Approvals could not be loaded."}</p>}
    <DataTable columns={columns} data={data?.items ?? []} rowKey={(row) => row.id} searchPlaceholder="Search approvals..." searchKeys={["requestType", "reason", "status"]} emptyTitle={isLoading ? "Loading approvals..." : "No approval requests"} />
    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={`${decision === "approved" ? "Approve" : "Reject"} request`} subtitle="A decision comment is mandatory." footer={<><Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button><Button disabled={comment.trim().length < 3 || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? "Saving..." : "Confirm decision"}</Button></>}>
      <FormField label="Decision comment" required><Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Explain this decision..." /></FormField>
      {mutation.error && <p className="mt-3 text-sm text-rose-700">{mutation.error.message}</p>}
    </Modal>
  </>;
}
