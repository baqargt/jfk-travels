export type Role = "Administrator" | "Manager" | "Agent" | "Accounts" | "Sub Agent";

export type AccountStatus = "Active" | "Inactive" | "Suspended";

export interface AuthUser {
  name: string;
  email: string;
  role: Role;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  subCompany: string;
  status: AccountStatus;
  lastLogin: string;
}

export interface CustomerBookingHistory {
  ref: string;
  date: string;
  service: string;
  amount: number;
  status: "Confirmed" | "Completed" | "Cancelled" | "Pending";
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  passport: string;
  passportExpiry: string;
  bookings: number;
  lifetimeValue: number;
  status: AccountStatus;
  joinedAt: string;
  history: CustomerBookingHistory[];
}

export interface SubCompany {
  id: string;
  name: string;
  type: "Branch" | "Franchise";
  location: string;
  manager: string;
  users: number;
  creditLimit: number;
  cashBalance: number;
  status: AccountStatus;
  createdAt: string;
}

export interface Transaction {
  id: string;
  customer: string;
  service: string;
  amount: number;
  status: "Completed" | "Pending" | "Refunded" | "Failed";
  date: string;
}

export type PricingType = "Markup" | "Commission";

export interface PricingRule {
  id: string;
  name: string;
  type: PricingType;
  scope: string;
  appliesTo: string;
  value: number;
  suffix: "%" | "$";
  priority: number;
  status: "Active" | "Inactive";
  updatedAt: string;
}

export interface LedgerEntry {
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface TempLimitItem {
  id: string;
  subCompany: string;
  amount: number;
  used: number;
  grantedAt: string;
  expiresAt: number;
  reason: string;
  status: "Active" | "Expired";
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: "info" | "warning" | "success";
}

export interface RefundRecord {
  id: string;
  pnr: string;
  passenger: string;
  reason: string;
  requestedOn: string;
  amount: number;
  penalty: number;
  netRefund: number;
  status: "Pending" | "Approved" | "Rejected";
  approver?: string;
}

export interface AirTicket {
  ticket: string;
  pnr: string;
  passenger: string;
  airline: string;
  flight: string;
  route: string;
  depart: string;
  cabin: string;
  fare: number;
  taxes: number;
  total: number;
  status: "Issued" | "Void" | "Exchanged" | "Refunded";
}

export interface HotelBooking {
  ref: string;
  hotel: string;
  city: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  guest: string;
  amount: number;
  voucher: "Sent" | "Pending" | "Confirmed";
  payment: "Paid" | "Due" | "Partial";
}

export interface MiscBooking {
  ref: string;
  service: "Insurance" | "Transfer" | "Sightseeing" | "Visa";
  provider: string;
  detail: string;
  pax: number;
  date: string;
  amount: number;
  status: "Confirmed" | "Pending" | "Cancelled" | "Completed";
}

export interface DsrRow {
  date: string;
  pnr: string;
  passenger: string;
  airline: string;
  route: string;
  fare: number;
  markup: number;
  commission: number;
  net: number;
  agent: string;
  status: "Ticketed" | "Void" | "Refunded" | "Hold";
}

export interface LimitOverview {
  cash: { allocated: number; used: number };
  credit: { limit: number; utilized: number; nextDue: string; dueAmount: number };
  temp: { activeCount: number; totalAmount: number };
}

export interface BookingSearchField {
  name: string;
  label: string;
  type: "text" | "select" | "date";
  placeholder?: string;
  options?: string[];
  colSpan?: 1 | 2;
}

export interface BookingResult {
  id: string;
  title: string;
  subtitle: string;
  rating?: number;
  price: number;
  unit?: string;
  badge?: string;
  meta: [string, string][];
}
