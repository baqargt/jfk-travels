import type { LedgerEntry, MiscBooking, RefundRecord, TempLimitItem } from "@/types";

const DAY = 86_400_000;
const HOUR = 3_600_000;
const MINUTE = 60_000;

export const miscBookings: MiscBooking[] = [
  { ref: "INS-5521", service: "Insurance", provider: "AXA Schengen", detail: "Global Voyager · 30 days", pax: 2, date: "2026-08-21", amount: 96.0, status: "Confirmed" },
  { ref: "TRF-8842", service: "Transfer", provider: "Blacklane", detail: "JFK → Manhattan · Sedan", pax: 2, date: "2026-08-20", amount: 78.0, status: "Confirmed" },
  { ref: "SSG-3310", service: "Sightseeing", provider: "Arabian Adventures", detail: "Desert Safari Premium", pax: 4, date: "2026-08-19", amount: 260.0, status: "Completed" },
  { ref: "VSA-1195", service: "Visa", provider: "Dubai Immig.", detail: "A to A Visa Change · 30d", pax: 1, date: "2026-08-19", amount: 210.0, status: "Cancelled" },
  { ref: "INS-5520", service: "Insurance", provider: "Allianz", detail: "Trip Guard Plus · 14 days", pax: 3, date: "2026-08-18", amount: 147.0, status: "Confirmed" },
  { ref: "TRF-8841", service: "Transfer", provider: "Careem Business", detail: "DXB → Marina · SUV", pax: 4, date: "2026-08-18", amount: 145.0, status: "Completed" },
  { ref: "SSG-3309", service: "Sightseeing", provider: "City Wonders", detail: "Louvre Skip-the-line", pax: 2, date: "2026-08-17", amount: 170.0, status: "Confirmed" },
  { ref: "VSA-1194", service: "Visa", provider: "Malaysia eNtry", detail: "A to A Run KUL · 30d", pax: 2, date: "2026-08-16", amount: 420.0, status: "Pending" },
  { ref: "INS-5519", service: "Insurance", provider: "Zurich", detail: "AeroCare Std · 7 days", pax: 1, date: "2026-08-15", amount: 24.0, status: "Completed" },
  { ref: "TRF-8840", service: "Transfer", provider: "Welcome Pickups", detail: "LHR → Paddington · Van", pax: 6, date: "2026-08-15", amount: 210.0, status: "Pending" },
  { ref: "SSG-3308", service: "Sightseeing", provider: "Niagara Falls Tours", detail: "Day Trip from NYC", pax: 2, date: "2026-08-14", amount: 398.0, status: "Completed" },
  { ref: "VSA-1193", service: "Visa", provider: "Thailand Pass", detail: "Visa Change BKK · 15d", pax: 1, date: "2026-08-13", amount: 180.0, status: "Confirmed" },
];

export const refunds: RefundRecord[] = [
  { id: "REF-2041", pnr: "BM77QP", passenger: "David Chen", reason: "Flight cancelled by airline", requestedOn: "2026-08-20", amount: 1038.23, penalty: 425.83, netRefund: 612.4, status: "Approved", approver: "Nadia Iqbal" },
  { id: "REF-2040", pnr: "WF64PL", passenger: "Michael Ross", reason: "Duplicate booking", requestedOn: "2026-08-19", amount: 850.2, penalty: 75.0, netRefund: 775.2, status: "Approved", approver: "Nadia Iqbal" },
  { id: "REF-2039", pnr: "TN33XA", passenger: "Ahmed Hassan", reason: "Date change not possible", requestedOn: "2026-08-19", amount: 893.8, penalty: 310.0, netRefund: 583.8, status: "Rejected", approver: "Hira Sheikh" },
  { id: "REF-2038", pnr: "HTL-88112", passenger: "Michael Ross", reason: "Hotel overbooked by supplier", requestedOn: "2026-08-18", amount: 1344.0, penalty: 0, netRefund: 1344.0, status: "Approved", approver: "Iqra Shahid" },
  { id: "REF-2037", pnr: "GL52VB", passenger: "Ayesha Khan", reason: "Wrong passenger name", requestedOn: "2026-08-17", amount: 392.38, penalty: 120.0, netRefund: 272.38, status: "Pending" },
  { id: "REF-2036", pnr: "MV41HX", passenger: "James Wilson", reason: "Itinerary change", requestedOn: "2026-08-16", amount: 525.68, penalty: 200.0, netRefund: 325.68, status: "Pending" },
  { id: "REF-2035", pnr: "JK83TD", passenger: "Priya Sharma", reason: "Visa rejected", requestedOn: "2026-08-15", amount: 1015.88, penalty: 350.0, netRefund: 665.88, status: "Pending" },
  { id: "REF-2034", pnr: "QT29RN", passenger: "Omar Farooq", reason: "Schedule inconvenience", requestedOn: "2026-08-13", amount: 228.9, penalty: 90.0, netRefund: 138.9, status: "Rejected", approver: "Saad Qureshi" },
  { id: "REF-2033", pnr: "HD18ZC", passenger: "Zainab Ali", reason: "Medical emergency", requestedOn: "2026-08-11", amount: 773.9, penalty: 0, netRefund: 773.9, status: "Approved", approver: "Kamran Ahmed" },
];

export const cashLedger: LedgerEntry[] = [
  { date: "2026-08-22", reference: "ALLOC-118", description: "Cash allocation from Head Office", debit: 0, credit: 25_000, balance: 62_570 },
  { date: "2026-08-21", reference: "TXN-98451", description: "Ticket sale EK202 · Sarah Connor", debit: 1268.5, credit: 0, balance: 37_570 },
  { date: "2026-08-20", reference: "RFD-2041", description: "Refund payout · David Chen", debit: 612.4, credit: 0, balance: 38_838.5 },
  { date: "2026-08-19", reference: "TXN-98445", description: "Desert Safari · Ayesha Khan", debit: 65.0, credit: 0, balance: 39_450.9 },
  { date: "2026-08-18", reference: "DEP-9042", description: "Bank deposit to operating account", debit: 0, credit: 40_000, balance: 39_515.9 },
  { date: "2026-08-16", reference: "TXN-98440", description: "Group deposit · Umrah Dec batch", debit: 12_500, credit: 0, balance: 79_515.9 },
  { date: "2026-08-15", reference: "COM-3381", description: "Airline commission received EK", debit: 0, credit: 8_420.35, balance: 92_015.9 },
  { date: "2026-08-14", reference: "WTH-2210", description: "Petty cash withdrawal · Airport counter", debit: 2_000, credit: 0, balance: 100_436.25 },
  { date: "2026-08-12", reference: "TXN-98431", description: "Ticket sale TK1988 · Zainab Ali", debit: 773.9, credit: 0, balance: 102_436.25 },
  { date: "2026-08-10", reference: "ALLOC-117", description: "Cash allocation from Head Office", debit: 0, credit: 50_000, balance: 103_210.15 },
];

export const creditLedger: LedgerEntry[] = [
  { date: "2026-08-22", reference: "INV-7741", description: "Weekly settlement invoice", debit: 42_300, credit: 0, balance: 341_200 },
  { date: "2026-08-20", reference: "PAY-5509", description: "Payment received · wire transfer", debit: 0, credit: 60_000, balance: 383_500 },
  { date: "2026-08-18", reference: "INV-7738", description: "Weekly settlement invoice", debit: 38_150, credit: 0, balance: 443_500 },
  { date: "2026-08-15", reference: "ADJ-091", description: "Credit limit increase approved", debit: 0, credit: 0, balance: 481_650 },
  { date: "2026-08-13", reference: "PAY-5502", description: "Payment received · cheque", debit: 0, credit: 45_000, balance: 481_650 },
  { date: "2026-08-11", reference: "INV-7733", description: "Weekly settlement invoice", debit: 51_240.5, credit: 0, balance: 526_650 },
  { date: "2026-08-06", reference: "PAY-5496", description: "Payment received · wire transfer", debit: 0, credit: 72_800, balance: 577_890.5 },
  { date: "2026-08-04", reference: "INV-7729", description: "Weekly settlement invoice", debit: 44_980.25, credit: 0, balance: 650_690.5 },
  { date: "2026-07-30", reference: "PAY-5490", description: "Payment received · bank draft", debit: 0, credit: 85_000, balance: 695_670.75 },
  { date: "2026-07-28", reference: "INV-7724", description: "Weekly settlement invoice", debit: 47_320.4, credit: 0, balance: 780_670.75 },
];

const now = Date.now();

export const tempLimits: TempLimitItem[] = [
  {
    id: "TMP-301",
    subCompany: "Gulberg Franchise",
    amount: 25_000,
    used: 18_400,
    grantedAt: "2026-08-18",
    expiresAt: now + 9 * HOUR + 22 * MINUTE,
    reason: "Umrah season group handling",
    status: "Active",
  },
  {
    id: "TMP-302",
    subCompany: "Downtown Branch",
    amount: 40_000,
    used: 11_250,
    grantedAt: "2026-08-19",
    expiresAt: now + 2 * DAY + 14 * HOUR + 3 * MINUTE,
    reason: "Corporate account overflow",
    status: "Active",
  },
  {
    id: "TMP-303",
    subCompany: "Blue Line Travels",
    amount: 20_000,
    used: 6_800,
    grantedAt: "2026-08-20",
    expiresAt: now + 5 * DAY + 3 * HOUR,
    reason: "Festive season peak sales",
    status: "Active",
  },
];
