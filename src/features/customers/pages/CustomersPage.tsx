import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Plus } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge, { StatusBadge } from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { customers as seed } from "@/lib/mockData";
import { fmtDate, fmtMoney, initials } from "@/lib/utils";
import { PATHS } from "@/routes/paths";
import type { Customer } from "@/types";

export default function CustomersPage() {
  const [selected, setSelected] = useState<Customer | null>(null);

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Customer",
      render: (c) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
            {initials(c.name)}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{c.name}</p>
            <p className="truncate text-xs text-slate-500">{c.email}</p>
          </div>
        </div>
      ),
    },
    { key: "phone", header: "Phone", className: "text-xs" },
    {
      key: "city",
      header: "Location",
      sortValue: (c) => c.country,
      render: (c) => (
        <span className="text-xs">
          {c.city}, <span className="text-slate-400">{c.country}</span>
        </span>
      ),
    },
    { key: "passport", header: "Passport", className: "font-mono text-xs" },
    {
      key: "bookings",
      header: "Bookings",
      sortValue: (c) => c.bookings,
      className: "!text-center font-semibold tabular-nums",
      render: (c) => c.bookings,
    },
    {
      key: "lifetimeValue",
      header: "Lifetime Value",
      sortValue: (c) => c.lifetimeValue,
      render: (c) => <span className="font-semibold text-emerald-700 tabular-nums">{fmtMoney(c.lifetimeValue)}</span>,
    },
    { key: "status", header: "Status", render: (c) => <StatusBadge status={c.status} /> },
    {
      key: "actions",
      header: "",
      headerClassName: "!text-right",
      className: "!text-right",
      render: (c) => (
        <Button
          variant="ghost"
          size="icon"
          className="!h-8 !w-8 text-slate-400 hover:text-brand-600"
          title="View profile"
          onClick={(e) => {
            e.stopPropagation();
            setSelected(c);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Customers"
        description="CRM view of travelers with lifetime value and booking history."
        actions={
          <Link to={PATHS.createCustomer}>
            <Button>
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={seed}
        rowKey={(c) => c.id}
        searchPlaceholder="Search by name, email, passport..."
        searchKeys={["name", "email", "passport", "city"]}
      />

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected ? `${selected.id} · Customer since ${fmtDate(selected.joinedAt)}` : ""}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Link to={PATHS.booking.flights}>
              <Button>New Booking</Button>
            </Link>
          </>
        }
      >
        {selected && (
          <div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {[
                ["Email", selected.email],
                ["Phone", selected.phone],
                ["Location", `${selected.city}, ${selected.country}`],
                ["Passport", selected.passport],
                ["Passport expiry", fmtDate(selected.passportExpiry)],
                ["Lifetime value", fmtMoney(selected.lifetimeValue)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">{k}</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>

            <h3 className="mt-6 mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              Booking History
              <Badge variant="gray">{selected.history.length}</Badge>
            </h3>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                    <th className="px-3 py-2">Ref</th>
                    <th className="px-3 py-2">Service</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {selected.history.map((h) => (
                    <tr key={h.ref}>
                      <td className="px-3 py-2 font-mono text-xs">{h.ref}</td>
                      <td className="px-3 py-2">{h.service}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">{fmtDate(h.date)}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{fmtMoney(h.amount)}</td>
                      <td className="px-3 py-2"><StatusBadge status={h.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
