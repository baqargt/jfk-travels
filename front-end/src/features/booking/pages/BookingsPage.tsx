import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CalendarCheck2, CircleCheckBig, Plus, Ticket, XCircle } from "lucide-react";
import { apiRequest } from "@/api/client";
import type { ApiBooking, ApiPage } from "@/api/types";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { FormField, Select, Textarea } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { useAuth } from "@/context/AuthContext";
import TicketPreview from "@/features/booking/components/TicketPreview";
import { fmtDate } from "@/lib/utils";
import { PATHS } from "@/routes/paths";

type StatusFilter = "all" | "active" | "cancelled";

const cancellableStatuses = new Set(["confirmed", "ticketed"]);
const cancellationRoles = new Set(["Administrator", "Manager", "Agent"]);

function titleCase(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function bookingTitle(booking: ApiBooking) {
  const offer = booking.details.offer;
  if (offer && typeof offer === "object" && "title" in offer && typeof offer.title === "string") {
    return offer.title;
  }
  return titleCase(booking.serviceType);
}

function formatAmount(booking: ApiBooking) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: booking.currency,
    minimumFractionDigits: 2,
  }).format(Number(booking.totalAmount));
}

async function getAllBookings(): Promise<ApiBooking[]> {
  const first = await apiRequest<ApiPage<ApiBooking>>("/bookings?page_size=100");
  const pageCount = Math.ceil(first.total / 100);
  if (pageCount <= 1) return first.items;
  const remaining = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      apiRequest<ApiPage<ApiBooking>>(`/bookings?page=${index + 2}&page_size=100`),
    ),
  );
  return [first, ...remaining].flatMap((page) => page.items);
}

export default function BookingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [toCancel, setToCancel] = useState<ApiBooking | null>(null);
  const [ticketBooking, setTicketBooking] = useState<ApiBooking | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [notice, setNotice] = useState("");

  const { data: bookings = [], isLoading, error } = useQuery({
    queryKey: ["bookings"],
    queryFn: getAllBookings,
  });

  const cancelBooking = useMutation({
    mutationFn: ({ booking, cancellationReason }: { booking: ApiBooking; cancellationReason: string }) => {
      const params = new URLSearchParams({ reason: cancellationReason });
      return apiRequest<ApiBooking>(`/bookings/${booking.id}/cancel?${params.toString()}`, { method: "POST" });
    },
    onSuccess: (booking) => {
      setNotice(`Booking ${booking.reference} was cancelled successfully.`);
      setToCancel(null);
      setReason("");
      setReasonError("");
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  const canCancel = user?.roles.some((role) => cancellationRoles.has(role)) ?? false;
  const activeCount = bookings.filter((booking) => cancellableStatuses.has(booking.status)).length;
  const cancelledCount = bookings.filter((booking) => booking.status === "cancelled").length;
  const filtered = useMemo(() => bookings.filter((booking) => {
    if (filter === "active") return cancellableStatuses.has(booking.status);
    if (filter === "cancelled") return booking.status === "cancelled";
    return true;
  }), [bookings, filter]);

  const openCancellation = (booking: ApiBooking) => {
    setToCancel(booking);
    setReason("");
    setReasonError("");
    setNotice("");
    cancelBooking.reset();
  };

  const confirmCancellation = () => {
    const cancellationReason = reason.trim();
    if (cancellationReason.length < 3) {
      setReasonError("Please enter a cancellation reason (at least 3 characters).");
      return;
    }
    if (toCancel) cancelBooking.mutate({ booking: toCancel, cancellationReason });
  };

  const columns: Column<ApiBooking>[] = [
    {
      key: "reference",
      header: "Booking",
      render: (booking) => (
        <div>
          <p className="font-mono text-xs font-bold text-slate-900">{booking.reference}</p>
          <p className="mt-0.5 font-mono text-[10px] text-slate-400">{booking.supplierReference}</p>
        </div>
      ),
    },
    {
      key: "serviceType",
      header: "Service",
      render: (booking) => (
        <div>
          <p className="font-medium text-slate-900">{bookingTitle(booking)}</p>
          <p className="text-xs text-slate-400">{titleCase(booking.serviceType)}</p>
        </div>
      ),
    },
    {
      key: "totalAmount",
      header: "Amount",
      sortValue: (booking) => Number(booking.totalAmount),
      render: (booking) => <span className="font-semibold tabular-nums text-slate-900">{formatAmount(booking)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (booking) => <StatusBadge status={titleCase(booking.status)} />,
    },
    {
      key: "createdAt",
      header: "Booked On",
      sortValue: (booking) => booking.createdAt,
      render: (booking) => fmtDate(booking.createdAt),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "!text-right",
      className: "!text-right",
      render: (booking) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setTicketBooking(booking)}>
            <Ticket className="h-3.5 w-3.5" />
            Ticket
          </Button>
          {cancellableStatuses.has(booking.status) && canCancel ? (
            <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => openCancellation(booking)}>
              <Ban className="h-3.5 w-3.5" />
              Cancel
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Completed Bookings"
        description="View confirmed bookings and cancel eligible bookings when required."
        actions={(
          <Link to={PATHS.booking.flights}>
            <Button><Plus className="h-4 w-4" />New Booking</Button>
          </Link>
        )}
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="All Bookings" value={String(bookings.length)} icon={CalendarCheck2} note="Saved bookings" />
        <StatCard label="Active" value={String(activeCount)} icon={CircleCheckBig} tone="emerald" note="Confirmed or ticketed" />
        <StatCard label="Cancelled" value={String(cancelledCount)} icon={XCircle} tone="rose" note="Supplier cancellation completed" />
      </div>

      {notice && <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</p>}
      {error && <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error instanceof Error ? error.message : "Bookings could not be loaded."}</p>}

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(booking) => booking.id}
        searchPlaceholder="Search reference, supplier or service..."
        searchKeys={["reference", "supplierReference", "serviceType", "status"]}
        emptyTitle={isLoading ? "Loading bookings..." : "No completed bookings"}
        emptyMessage={isLoading ? "Please wait while bookings are loaded." : "Complete a booking and it will appear here."}
        toolbarActions={(
          <Select value={filter} onChange={(event) => setFilter(event.target.value as StatusFilter)} className="!w-auto min-w-36 !py-1.5 text-xs">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        )}
      />

      <TicketPreview
        booking={ticketBooking}
        open={Boolean(ticketBooking)}
        onClose={() => setTicketBooking(null)}
      />

      <Modal
        open={Boolean(toCancel)}
        onClose={() => { if (!cancelBooking.isPending) setToCancel(null); }}
        title="Cancel booking?"
        subtitle={toCancel ? `${toCancel.reference} · ${bookingTitle(toCancel)}` : undefined}
        size="sm"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setToCancel(null)} disabled={cancelBooking.isPending}>Keep Booking</Button>
            <Button variant="danger" onClick={confirmCancellation} disabled={cancelBooking.isPending}>
              {cancelBooking.isPending ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            This sends the cancellation to the supplier and marks the booking as cancelled. Any refund must be processed separately.
          </div>
          <FormField label="Cancellation reason" required error={reasonError}>
            <Textarea
              value={reason}
              onChange={(event) => { setReason(event.target.value); setReasonError(""); cancelBooking.reset(); }}
              placeholder="Why is this booking being cancelled?"
              rows={4}
              maxLength={500}
              disabled={cancelBooking.isPending}
            />
          </FormField>
          {cancelBooking.error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {cancelBooking.error instanceof Error ? cancelBooking.error.message : "Booking could not be cancelled."}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
