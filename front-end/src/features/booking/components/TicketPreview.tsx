import { useRef, useState } from "react";
import { Download, Printer } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { ApiBooking } from "@/api/types";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { fmtDate } from "@/lib/utils";

interface TicketPreviewProps {
  booking: ApiBooking | null;
  open: boolean;
  onClose: () => void;
}

function titleCase(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function bookingTitle(booking: ApiBooking) {
  const offer = asRecord(booking.details.offer);
  return asString(offer?.title, titleCase(booking.serviceType));
}

function bookingSubtitle(booking: ApiBooking) {
  const offer = asRecord(booking.details.offer);
  return asString(offer?.subtitle);
}

function ticketNumber(booking: ApiBooking) {
  const ticket = booking.details.ticket;
  if (typeof ticket === "string" && ticket.trim()) return ticket;
  const ticketRecord = asRecord(ticket);
  return asString(ticketRecord?.ticket ?? ticketRecord?.ticketNumber, booking.reference);
}

function formatAmount(booking: ApiBooking) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: booking.currency,
    minimumFractionDigits: 2,
  }).format(Number(booking.totalAmount));
}

function passengerName(snapshot: Record<string, unknown>) {
  const title = asString(snapshot.title);
  const firstName = asString(snapshot.firstName);
  const lastName = asString(snapshot.lastName);
  return [title, firstName, lastName].filter(Boolean).join(" ") || "Passenger";
}

export default function TicketPreview({ booking, open, onClose }: TicketPreviewProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  if (!booking) return null;

  const cancelled = booking.status === "cancelled" || booking.status === "voided";
  const passengers = booking.passengers ?? [];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!ticketRef.current) return;
    setDownloading(true);
    setError("");
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const image = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "pt",
        format: "a4",
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
      const width = canvas.width * ratio;
      const height = canvas.height * ratio;
      pdf.addImage(image, "PNG", (pageWidth - width) / 2, margin, width, height);
      pdf.save(`ticket-${booking.reference}.pdf`);
    } catch {
      setError("PDF could not be generated. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="E-Ticket"
      subtitle={`${booking.reference} · Ready to print or download`}
      size="lg"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button onClick={() => void handleDownloadPdf()} disabled={downloading}>
            <Download className="h-4 w-4" />
            {downloading ? "Preparing PDF..." : "Download PDF"}
          </Button>
        </>
      )}
    >
      {error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="ticket-print-root">
        <div
          ref={ticketRef}
          className="ticket-document relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 text-slate-900"
        >
          {cancelled && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <span className="rotate-[-18deg] text-5xl font-black uppercase tracking-[0.2em] text-rose-500/25">
                {titleCase(booking.status)}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">E-Ticket / Itinerary</p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">{bookingTitle(booking)}</h3>
              {bookingSubtitle(booking) && (
                <p className="mt-1 text-sm text-slate-600">{bookingSubtitle(booking)}</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-bold text-slate-900">{booking.reference}</p>
              <p className="mt-1 text-xs text-slate-500">Booked {fmtDate(booking.createdAt)}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {titleCase(booking.status)}
              </p>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Supplier PNR</dt>
              <dd className="mt-0.5 font-mono text-sm font-semibold text-slate-800">{booking.supplierReference}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Ticket No.</dt>
              <dd className="mt-0.5 font-mono text-sm font-semibold text-slate-800">{ticketNumber(booking)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Service</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800">{titleCase(booking.serviceType)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total</dt>
              <dd className="mt-0.5 text-sm font-bold tabular-nums text-slate-900">{formatAmount(booking)}</dd>
            </div>
          </dl>

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Passengers</p>
            {passengers.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No passenger details recorded.</p>
            ) : (
              <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Name</th>
                      <th className="px-3 py-2 font-semibold">Type</th>
                      <th className="px-3 py-2 font-semibold">Passport</th>
                      <th className="px-3 py-2 font-semibold">Nationality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passengers.map((passenger) => {
                      const snapshot = passenger.snapshot ?? {};
                      return (
                        <tr key={passenger.id} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-medium text-slate-900">{passengerName(snapshot)}</td>
                          <td className="px-3 py-2 text-slate-600">{titleCase(passenger.passengerType)}</td>
                          <td className="px-3 py-2 font-mono text-xs text-slate-700">
                            {asString(snapshot.passportNumber, "—")}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{asString(snapshot.nationality, "—")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="mt-5 text-[11px] leading-relaxed text-slate-400">
            This document is an agency e-ticket / itinerary receipt. Present it with a valid passport at check-in.
            You may print or download this ticket any number of times.
          </p>
        </div>
      </div>
    </Modal>
  );
}
