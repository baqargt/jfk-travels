import type {
  Customer,
  LimitOverview,
  NotificationItem,
  SubCompany,
  Transaction,
} from "@/types";
import { users } from "@/lib/mockUsers";

export const limitsOverview: LimitOverview = {
  cash: { allocated: 250_000, used: 187_430 },
  credit: { limit: 500_000, utilized: 341_200, nextDue: "2026-08-30", dueAmount: 42_300 },
  temp: { activeCount: 3, totalAmount: 85_000 },
};

export const notifications: NotificationItem[] = [
  {
    id: "n-1",
    title: "Credit threshold reached",
    message: "Downtown Branch has used 82% of its credit limit.",
    time: "12 min ago",
    unread: true,
    type: "warning",
  },
  {
    id: "n-2",
    title: "Refund approved",
    message: "REF-2041 for Sarah Connor ($612.40) was approved by Finance.",
    time: "48 min ago",
    unread: true,
    type: "success",
  },
  {
    id: "n-3",
    title: "Temp limit expiring",
    message: "Gulberg Franchise temp limit of $25,000 expires in 9 hours.",
    time: "2 hrs ago",
    unread: true,
    type: "warning",
  },
  {
    id: "n-4",
    title: "PNR hold released",
    message: "PNR QX8T2L auto-released by airline — no ticketing action taken.",
    time: "5 hrs ago",
    unread: false,
    type: "info",
  },
  {
    id: "n-5",
    title: "New sub company onboarded",
    message: "Blue Line Travels (Franchise) is now live on the platform.",
    time: "Yesterday",
    unread: false,
    type: "success",
  },
];

export const transactions: Transaction[] = [
  { id: "TXN-98451", customer: "Sarah Connor", service: "Flight · EK202", amount: 1240.0, status: "Completed", date: "2026-08-22" },
  { id: "TXN-98450", customer: "Bilal Raza", service: "Hotel · Marriott Marquis", amount: 866.0, status: "Pending", date: "2026-08-22" },
  { id: "TXN-98449", customer: "Emma Watson", service: "Insurance · Global Voyager", amount: 96.0, status: "Completed", date: "2026-08-21" },
  { id: "TXN-98448", customer: "Ahmed Hassan", service: "Umrah Package · 14N", amount: 2890.0, status: "Completed", date: "2026-08-21" },
  { id: "TXN-98447", customer: "Fatima Noor", service: "Transfer · Private Sedan", amount: 78.0, status: "Completed", date: "2026-08-20" },
  { id: "TXN-98446", customer: "David Chen", service: "Flight · QR701", amount: 985.5, status: "Refunded", date: "2026-08-20" },
  { id: "TXN-98445", customer: "Ayesha Khan", service: "Sightseeing · Desert Safari", amount: 65.0, status: "Completed", date: "2026-08-19" },
  { id: "TXN-98444", customer: "Michael Ross", service: "A to A · Dubai Visa Run", amount: 210.0, status: "Failed", date: "2026-08-19" },
  { id: "TXN-98443", customer: "Zainab Ali", service: "Flight · TK1988", amount: 742.75, status: "Completed", date: "2026-08-18" },
  { id: "TXN-98442", customer: "Omar Farooq", service: "Holiday · Maldives Escape", amount: 3450.0, status: "Pending", date: "2026-08-18" },
];

export const subCompanies: SubCompany[] = [
  { id: "SUB-01", name: "Downtown Branch", type: "Branch", location: "New York, USA", manager: "Usman Tariq", users: 12, creditLimit: 120_000, cashBalance: 34_500, status: "Active", createdAt: "2022-03-14" },
  { id: "SUB-02", name: "Airport Counter", type: "Branch", location: "JFK T4, New York", manager: "Rabia Anwar", users: 6, creditLimit: 50_000, cashBalance: 8_200, status: "Active", createdAt: "2022-09-01" },
  { id: "SUB-03", name: "Blue Line Travels", type: "Franchise", location: "Chicago, USA", manager: "Fahad Mehmood", users: 9, creditLimit: 80_000, cashBalance: 21_750, status: "Active", createdAt: "2023-06-21" },
  { id: "SUB-04", name: "Sky Wings Franchise", type: "Franchise", location: "Houston, USA", manager: "Saad Qureshi", users: 7, creditLimit: 60_000, cashBalance: 15_400, status: "Active", createdAt: "2024-01-09" },
  { id: "SUB-05", name: "Gulberg Franchise", type: "Franchise", location: "Lahore, Pakistan", manager: "Iqra Shahid", users: 11, creditLimit: 100_000, cashBalance: 27_900, status: "Active", createdAt: "2024-11-27" },
  { id: "SUB-06", name: "Clifton Branch", type: "Branch", location: "Karachi, Pakistan", manager: "Unassigned", users: 0, creditLimit: 40_000, cashBalance: 0, status: "Inactive", createdAt: "2025-04-18" },
];

export const customers: Customer[] = [
  {
    id: "CUS-2001", name: "Sarah Connor", email: "sarah.connor@gmail.com", phone: "+1 212 555 0142",
    city: "New York", country: "USA", passport: "X1234567", passportExpiry: "2029-04-11",
    bookings: 24, lifetimeValue: 31_480.5, status: "Active", joinedAt: "2022-05-03",
    history: [
      { ref: "TXN-98451", date: "2026-08-22", service: "Flight EK202 JFK→DXB", amount: 1240.0, status: "Confirmed" },
      { ref: "TXN-95120", date: "2026-06-14", service: "Hotel Atlantis Dubai 4N", amount: 1890.0, status: "Completed" },
      { ref: "TXN-93311", date: "2026-03-02", service: "Flight QR702 DXB→JFK", amount: 1105.0, status: "Completed" },
    ],
  },
  {
    id: "CUS-2002", name: "Bilal Raza", email: "bilal.raza@outlook.com", phone: "+92 300 8455120",
    city: "Lahore", country: "Pakistan", passport: "AB4451120", passportExpiry: "2031-01-20",
    bookings: 11, lifetimeValue: 12_240.0, status: "Active", joinedAt: "2023-02-18",
    history: [
      { ref: "TXN-98450", date: "2026-08-22", service: "Marriott Marquis NY 4N", amount: 866.0, status: "Pending" },
      { ref: "TXN-97204", date: "2026-07-01", service: "Umrah Package 14N", amount: 2890.0, status: "Completed" },
    ],
  },
  {
    id: "CUS-2003", name: "Emma Watson", email: "emma.w@gmail.com", phone: "+44 7700 900123",
    city: "London", country: "UK", passport: "P9988776", passportExpiry: "2028-09-30",
    bookings: 8, lifetimeValue: 6_930.25, status: "Active", joinedAt: "2023-08-11",
    history: [
      { ref: "TXN-98449", date: "2026-08-21", service: "Global Voyager Insurance", amount: 96.0, status: "Confirmed" },
      { ref: "TXN-96890", date: "2026-05-22", service: "Flight BA178 JFK→LHR", amount: 720.4, status: "Completed" },
    ],
  },
  {
    id: "CUS-2004", name: "David Chen", email: "dchen@yahoo.com", phone: "+1 415 555 0198",
    city: "San Francisco", country: "USA", passport: "C5564321", passportExpiry: "2027-12-05",
    bookings: 15, lifetimeValue: 18_115.9, status: "Active", joinedAt: "2021-11-29",
    history: [
      { ref: "TXN-98446", date: "2026-08-20", service: "Flight QR701 refund", amount: 985.5, status: "Cancelled" },
      { ref: "TXN-96011", date: "2026-04-18", service: "Flight CX879 SFO→HKG", amount: 1420.0, status: "Completed" },
    ],
  },
  {
    id: "CUS-2005", name: "Ayesha Khan", email: "ayesha.khan@gmail.com", phone: "+971 50 123 4567",
    city: "Dubai", country: "UAE", passport: "AD1109887", passportExpiry: "2030-06-14",
    bookings: 19, lifetimeValue: 14_670.0, status: "Active", joinedAt: "2022-10-07",
    history: [
      { ref: "TXN-98445", date: "2026-08-19", service: "Desert Safari Premium", amount: 65.0, status: "Confirmed" },
      { ref: "TXN-97990", date: "2026-07-28", service: "Flight EK505 DXB→ISB", amount: 388.0, status: "Completed" },
    ],
  },
  {
    id: "CUS-2006", name: "Michael Ross", email: "mross@gmail.com", phone: "+1 646 555 0101",
    city: "Brooklyn", country: "USA", passport: "Y8812340", passportExpiry: "2029-08-23",
    bookings: 5, lifetimeValue: 3_420.0, status: "Inactive", joinedAt: "2024-03-25",
    history: [{ ref: "TXN-98444", date: "2026-08-19", service: "A to A Dubai Visa Run", amount: 210.0, status: "Cancelled" }],
  },
  {
    id: "CUS-2007", name: "Zainab Ali", email: "zainab.ali@hotmail.com", phone: "+92 321 9988771",
    city: "Karachi", country: "Pakistan", passport: "EA7766554", passportExpiry: "2032-02-17",
    bookings: 13, lifetimeValue: 9_880.4, status: "Active", joinedAt: "2023-01-09",
    history: [{ ref: "TXN-98443", date: "2026-08-18", service: "Flight TK1988", amount: 742.75, status: "Confirmed" }],
  },
  {
    id: "CUS-2008", name: "Omar Farooq", email: "omar.farooq@gmail.com", phone: "+966 55 789 1234",
    city: "Riyadh", country: "Saudi Arabia", passport: "S4432187", passportExpiry: "2031-10-02",
    bookings: 7, lifetimeValue: 11_250.0, status: "Active", joinedAt: "2024-07-14",
    history: [{ ref: "TXN-98442", date: "2026-08-18", service: "Maldives Escape 6N", amount: 3450.0, status: "Pending" }],
  },
  {
    id: "CUS-2009", name: "Priya Sharma", email: "priya.s@gmail.com", phone: "+91 98100 12345",
    city: "Mumbai", country: "India", passport: "N7788123", passportExpiry: "2028-03-08",
    bookings: 9, lifetimeValue: 7_540.75, status: "Active", joinedAt: "2023-11-30",
    history: [
      { ref: "TXN-97812", date: "2026-07-19", service: "Sightseeing Louvre Tour", amount: 85.0, status: "Completed" },
      { ref: "TXN-96455", date: "2026-05-04", service: "Flight AI144 BOM→JFK", amount: 980.0, status: "Completed" },
    ],
  },
  {
    id: "CUS-2010", name: "James Wilson", email: "jwilson@company.com", phone: "+1 305 555 0177",
    city: "Miami", country: "USA", passport: "Z3321098", passportExpiry: "2030-01-25",
    bookings: 31, lifetimeValue: 47_930.2, status: "Active", joinedAt: "2021-06-12",
    history: [
      { ref: "TXN-98390", date: "2026-08-16", service: "Business Flight UA902", amount: 3890.0, status: "Completed" },
      { ref: "TXN-97654", date: "2026-07-09", service: "Swiss Alps Tour 7N", amount: 2450.0, status: "Completed" },
    ],
  },
];

export { users };
