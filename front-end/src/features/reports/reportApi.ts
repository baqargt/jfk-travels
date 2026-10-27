import { apiRequest } from "@/api/client";
import type { ApiPage } from "@/api/types";
import type { AirTicket, DsrRow, HotelBooking, MiscBooking, RefundRecord } from "@/types";

interface BookingReportRow {
  id: string;
  reference: string;
  service: string;
  amount: string;
  currency: string;
  status: string;
  date: string;
  supplierReference: string;
}

interface RefundReportRow {
  id: string;
  bookingReference: string;
  amount: string;
  penalty: string;
  netRefund: string;
  currency: string;
  reason: string;
  status: string;
  requestedOn: string;
}

const title = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

async function bookingRows(type: "dsr" | "air" | "hotel" | "misc") {
  return apiRequest<ApiPage<BookingReportRow>>(`/reports/${type}?page_size=200`);
}

export async function getAirReports(): Promise<AirTicket[]> {
  const response = await bookingRows("air");
  return response.items.map((row) => ({
    ticket: row.supplierReference || row.reference,
    pnr: row.reference,
    passenger: "—",
    airline: "Fake Supplier",
    flight: "—",
    route: "—",
    depart: row.date,
    cabin: "—",
    fare: Number(row.amount),
    taxes: 0,
    total: Number(row.amount),
    status: row.status === "refunded" ? "Refunded" : row.status === "cancelled" ? "Void" : "Issued",
  }));
}

export async function getHotelReports(): Promise<HotelBooking[]> {
  const response = await bookingRows("hotel");
  return response.items.map((row) => ({
    ref: row.reference,
    hotel: "Fake Supplier Hotel",
    city: "—",
    checkIn: row.date,
    checkOut: row.date,
    rooms: 1,
    guest: "—",
    amount: Number(row.amount),
    voucher: row.status === "confirmed" ? "Confirmed" : "Pending",
    payment: row.status === "confirmed" ? "Paid" : "Due",
  }));
}

export async function getMiscReports(): Promise<MiscBooking[]> {
  const response = await bookingRows("misc");
  return response.items.map((row) => ({
    ref: row.reference,
    service: row.service === "insurance" ? "Insurance" : row.service === "transfers" ? "Transfer" : row.service === "sightseeing" ? "Sightseeing" : "Visa",
    provider: "Fake Supplier",
    detail: row.supplierReference,
    pax: 1,
    date: row.date,
    amount: Number(row.amount),
    status: ["confirmed", "completed", "cancelled"].includes(row.status)
      ? title(row.status) as MiscBooking["status"]
      : "Pending",
  }));
}

export async function getRefundReports(): Promise<RefundRecord[]> {
  const response = await apiRequest<ApiPage<RefundReportRow>>("/reports/refunds?page_size=200");
  return response.items.map((row) => ({
    id: row.id,
    pnr: row.bookingReference,
    passenger: "—",
    reason: row.reason,
    requestedOn: row.requestedOn,
    amount: Number(row.amount),
    penalty: Number(row.penalty),
    netRefund: Number(row.netRefund),
    status: title(row.status) as RefundRecord["status"],
  }));
}

export async function getDsrReports(): Promise<DsrRow[]> {
  const response = await bookingRows("dsr");
  return response.items.map((row) => ({
    date: row.date,
    pnr: row.reference,
    passenger: "—",
    airline: "Fake Supplier",
    route: row.service,
    fare: Number(row.amount),
    markup: 0,
    commission: 0,
    net: Number(row.amount),
    agent: "—",
    status: row.status === "refunded" ? "Refunded" : row.status === "cancelled" ? "Void" : row.status === "confirmed" ? "Ticketed" : "Hold",
  }));
}
