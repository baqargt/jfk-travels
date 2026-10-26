import DataTable, { type Column } from "@/components/DataTable/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import ReportFilters from "@/features/reports/components/ReportFilters";
import { hotelBookings } from "@/lib/mockReports";
import { fmtDate, fmtMoney } from "@/lib/utils";
import type { HotelBooking } from "@/types";

export default function HotelReportsPage() {
  const columns: Column<HotelBooking>[] = [
    { key: "ref", header: "Booking Ref", className: "font-mono text-xs font-semibold" },
    { key: "hotel", header: "Hotel", render: (h) => <span className="font-medium text-slate-900">{h.hotel}</span> },
    { key: "city", header: "City" },
    {
      key: "checkIn",
      header: "Stay",
      sortValue: (h) => h.checkIn,
      render: (h) => (
        <span className="text-xs whitespace-nowrap">
          {fmtDate(h.checkIn)} → {fmtDate(h.checkOut)}
        </span>
      ),
    },
    { key: "rooms", header: "Rooms", sortValue: (h) => h.rooms, className: "!text-center tabular-nums" },
    { key: "guest", header: "Guest" },
    { key: "amount", header: "Amount", sortValue: (h) => h.amount, className: "!text-right font-semibold tabular-nums", render: (h) => fmtMoney(h.amount) },
    {
      key: "voucher",
      header: "Voucher",
      render: (h) => (
        <StatusBadge status={h.voucher === "Sent" ? "Issued" : h.voucher === "Confirmed" ? "Confirmed" : "Pending"} />
      ),
    },
    { key: "payment", header: "Payment", render: (h) => <StatusBadge status={h.payment} /> },
  ];

  return (
    <>
      <PageHeader
        title="Hotel Reports"
        description="Booking status and voucher delivery tracking for all hotel suppliers."
      />
      <ReportFilters statusOptions={["All vouchers", "Confirmed", "Sent", "Pending"]} />

      <DataTable
        columns={columns}
        data={hotelBookings}
        rowKey={(h) => h.ref}
        searchPlaceholder="Search hotel, city or guest..."
        searchKeys={["hotel", "city", "guest", "ref"]}
      />
    </>
  );
}
