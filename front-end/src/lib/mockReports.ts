import type {
  AirTicket,
  DsrRow,
  HotelBooking,
  LedgerEntry,
  MiscBooking,
  PricingRule,
  RefundRecord,
} from "@/types";

export const pricingRules: PricingRule[] = [
  { id: "PRM-01", name: "Emirates Std Markup", type: "Markup", scope: "Airline", appliesTo: "Emirates (EK)", value: 4.5, suffix: "%", priority: 1, status: "Active", updatedAt: "2026-08-12" },
  { id: "PRM-02", name: "US-GCC Routes Boost", type: "Markup", scope: "Route", appliesTo: "JFK-DXB / RUH", value: 6.0, suffix: "%", priority: 2, status: "Active", updatedAt: "2026-08-10" },
  { id: "PRM-03", name: "Corporate Flat Fee", type: "Markup", scope: "Global", appliesTo: "All bookings", value: 25, suffix: "$", priority: 8, status: "Inactive", updatedAt: "2026-06-30" },
  { id: "PRM-04", name: "Hotel Commission Std", type: "Commission", scope: "Global", appliesTo: "All hotels", value: 10, suffix: "%", priority: 5, status: "Active", updatedAt: "2026-07-22" },
  { id: "PRM-05", name: "Insurance Flat Margin", type: "Markup", scope: "Global", appliesTo: "All insurance", value: 3.0, suffix: "$", priority: 6, status: "Active", updatedAt: "2026-05-19" },
  { id: "PRM-06", name: "Franchise Preferred Rate", type: "Commission", scope: "Sub Company", appliesTo: "Blue Line Travels", value: 7.5, suffix: "%", priority: 3, status: "Active", updatedAt: "2026-08-01" },
  { id: "PRM-07", name: "Economy Cabin Uplift", type: "Markup", scope: "Cabin Class", appliesTo: "Economy only", value: 2.25, suffix: "%", priority: 4, status: "Active", updatedAt: "2026-07-05" },
  { id: "PRM-08", name: "Legacy Rule 2025", type: "Markup", scope: "Airline", appliesTo: "PIA (PK)", value: 5.0, suffix: "%", priority: 9, status: "Inactive", updatedAt: "2025-12-15" },
];

export const dsrRows: DsrRow[] = [
  { date: "2026-08-22", pnr: "QX8T2L", passenger: "Sarah Connor", airline: "Emirates", route: "JFK-DXB", fare: 1180.0, markup: 53.1, commission: 35.4, net: 1268.5, agent: "Usman Tariq", status: "Ticketed" },
  { date: "2026-08-22", pnr: "KP4MNR", passenger: "Bilal Raza", airline: "Qatar Airways", route: "LHE-DOH-JFK", fare: 940.0, markup: 56.4, commission: 28.2, net: 1024.6, agent: "Talha Butt", status: "Ticketed" },
  { date: "2026-08-21", pnr: "ZR91KD", passenger: "Emma Watson", airline: "British Airways", route: "JFK-LHR", fare: 685.0, markup: 30.8, commission: 20.55, net: 736.35, agent: "Maryam Javed", status: "Ticketed" },
  { date: "2026-08-21", pnr: "TN33XA", passenger: "Ahmed Hassan", airline: "Turkish Airlines", route: "ISB-IST-JFK", fare: 820.0, markup: 49.2, commission: 24.6, net: 893.8, agent: "Hira Sheikh", status: "Hold" },
  { date: "2026-08-20", pnr: "BM77QP", passenger: "David Chen", airline: "Qatar Airways", route: "SFO-DOH-JFK", fare: 952.5, markup: 57.15, commission: 28.58, net: 1038.23, agent: "Fahad Mehmood", status: "Refunded" },
  { date: "2026-08-20", pnr: "GL52VB", passenger: "Ayesha Khan", airline: "Emirates", route: "DXB-ISB", fare: 365.0, markup: 16.43, commission: 10.95, net: 392.38, agent: "Iqra Shahid", status: "Ticketed" },
  { date: "2026-08-19", pnr: "HD18ZC", passenger: "Zainab Ali", airline: "Turkish Airlines", route: "KHI-IST-LHR", fare: 710.0, markup: 42.6, commission: 21.3, net: 773.9, agent: "Maryam Javed", status: "Ticketed" },
  { date: "2026-08-19", pnr: "WF64PL", passenger: "Michael Ross", airline: "Lufthansa", route: "JFK-FRA", fare: 780.0, markup: 46.8, commission: 23.4, net: 850.2, agent: "Usman Tariq", status: "Void" },
  { date: "2026-08-18", pnr: "QT29RN", passenger: "Omar Farooq", airline: "Saudia", route: "RUH-JED", fare: 210.0, markup: 12.6, commission: 6.3, net: 228.9, agent: "Saad Qureshi", status: "Ticketed" },
  { date: "2026-08-18", pnr: "JK83TD", passenger: "Priya Sharma", airline: "Air India", route: "BOM-JFK", fare: 945.0, markup: 42.53, commission: 28.35, net: 1015.88, agent: "Nadia Iqbal", status: "Ticketed" },
  { date: "2026-08-17", pnr: "MV41HX", passenger: "James Wilson", airline: "United", route: "EWR-SFO", fare: 489.0, markup: 22.01, commission: 14.67, net: 525.68, agent: "Hira Sheikh", status: "Ticketed" },
  { date: "2026-08-17", pnr: "CX70WJ", passenger: "Fatima Noor", airline: "Etihad", route: "AUH-LHE", fare: 402.0, markup: 24.12, commission: 12.06, net: 438.18, agent: "Talha Butt", status: "Ticketed" },
];

export const airTickets: AirTicket[] = [
  { ticket: "176-2201984451", pnr: "QX8T2L", passenger: "Sarah Connor", airline: "Emirates", flight: "EK202", route: "JFK-DXB", depart: "2026-09-02", cabin: "Economy", fare: 1180.0, taxes: 88.5, total: 1268.5, status: "Issued" },
  { ticket: "176-2201984452", pnr: "QX8T2L", passenger: "John Connor", airline: "Emirates", flight: "EK202", route: "JFK-DXB", depart: "2026-09-02", cabin: "Economy", fare: 1180.0, taxes: 88.5, total: 1268.5, status: "Issued" },
  { ticket: "605-7741200338", pnr: "KP4MNR", passenger: "Bilal Raza", airline: "Qatar Airways", flight: "QR701", route: "LHE-DOH", depart: "2026-08-30", cabin: "Business", fare: 940.0, taxes: 84.6, total: 1024.6, status: "Issued" },
  { ticket: "125-9983011227", pnr: "ZR91KD", passenger: "Emma Watson", airline: "British Airways", flight: "BA178", route: "JFK-LHR", depart: "2026-09-10", cabin: "Premium", fare: 685.0, taxes: 51.35, total: 736.35, status: "Issued" },
  { ticket: "235-4412099811", pnr: "TN33XA", passenger: "Ahmed Hassan", airline: "Turkish Airlines", flight: "TK001", route: "ISB-IST", depart: "2026-09-05", cabin: "Economy", fare: 820.0, taxes: 73.8, total: 893.8, status: "Void" },
  { ticket: "605-7741200419", pnr: "BM77QP", passenger: "David Chen", airline: "Qatar Airways", flight: "QR739", route: "SFO-DOH", depart: "2026-08-28", cabin: "Economy", fare: 952.5, taxes: 85.73, total: 1038.23, status: "Refunded" },
  { ticket: "176-2201984502", pnr: "GL52VB", passenger: "Ayesha Khan", airline: "Emirates", flight: "EK505", route: "DXB-ISB", depart: "2026-08-29", cabin: "Economy", fare: 365.0, taxes: 27.38, total: 392.38, status: "Issued" },
  { ticket: "220-3301887742", pnr: "HD18ZC", passenger: "Zainab Ali", airline: "Turkish Airlines", flight: "TK1988", route: "KHI-IST", depart: "2026-09-14", cabin: "Economy", fare: 710.0, taxes: 63.9, total: 773.9, status: "Exchanged" },
  { ticket: "220-3301887751", pnr: "WF64PL", passenger: "Michael Ross", airline: "Lufthansa", flight: "LH401", route: "JFK-FRA", depart: "2026-09-01", cabin: "Business", fare: 780.0, taxes: 70.2, total: 850.2, status: "Void" },
  { ticket: "066-1102993441", pnr: "QT29RN", passenger: "Omar Farooq", airline: "Saudia", flight: "SV754", route: "RUH-JED", depart: "2026-08-31", cabin: "Economy", fare: 210.0, taxes: 18.9, total: 228.9, status: "Issued" },
  { ticket: "098-5523100876", pnr: "JK83TD", passenger: "Priya Sharma", airline: "Air India", flight: "AI144", route: "BOM-JFK", depart: "2026-09-18", cabin: "Economy", fare: 945.0, taxes: 70.88, total: 1015.88, status: "Issued" },
  { ticket: "016-8830112299", pnr: "MV41HX", passenger: "James Wilson", airline: "United", flight: "UA902", route: "EWR-SFO", depart: "2026-09-08", cabin: "First", fare: 489.0, taxes: 36.68, total: 525.68, status: "Issued" },
];

export const hotelBookings: HotelBooking[] = [
  { ref: "HTL-88121", hotel: "Marriott Marquis", city: "New York", checkIn: "2026-09-01", checkOut: "2026-09-05", rooms: 1, guest: "Bilal Raza", amount: 866.0, voucher: "Pending", payment: "Due" },
  { ref: "HTL-88120", hotel: "Atlantis The Palm", city: "Dubai", checkIn: "2026-09-02", checkOut: "2026-09-06", rooms: 1, guest: "Sarah Connor", amount: 1890.0, voucher: "Confirmed", payment: "Paid" },
  { ref: "HTL-88119", hotel: "The Savoy", city: "London", checkIn: "2026-09-10", checkOut: "2026-09-13", rooms: 1, guest: "Emma Watson", amount: 1420.5, voucher: "Sent", payment: "Partial" },
  { ref: "HTL-88118", hotel: "Park Hyatt", city: "Istanbul", checkIn: "2026-09-05", checkOut: "2026-09-09", rooms: 2, guest: "Ahmed Hassan", amount: 1240.0, voucher: "Confirmed", payment: "Paid" },
  { ref: "HTL-88117", hotel: "Burj Al Arab", city: "Dubai", checkIn: "2026-10-02", checkOut: "2026-10-06", rooms: 1, guest: "James Wilson", amount: 4380.0, voucher: "Sent", payment: "Partial" },
  { ref: "HTL-88116", hotel: "Shangri-La", city: "Paris", checkIn: "2026-09-20", checkOut: "2026-09-24", rooms: 1, guest: "Priya Sharma", amount: 1580.75, voucher: "Confirmed", payment: "Paid" },
  { ref: "HTL-88115", hotel: "InterContinental", city: "Jeddah", checkIn: "2026-08-29", checkOut: "2026-09-12", rooms: 3, guest: "Omar Farooq", amount: 2760.0, voucher: "Confirmed", payment: "Paid" },
  { ref: "HTL-88114", hotel: "Pearl Continental", city: "Lahore", checkIn: "2026-08-27", checkOut: "2026-08-29", rooms: 1, guest: "Zainab Ali", amount: 218.4, voucher: "Sent", payment: "Paid" },
  { ref: "HTL-88113", hotel: "Ritz-Carlton", city: "Hong Kong", checkIn: "2026-10-11", checkOut: "2026-10-15", rooms: 2, guest: "David Chen", amount: 3120.0, voucher: "Pending", payment: "Due" },
  { ref: "HTL-88112", hotel: "Four Seasons", city: "Miami", checkIn: "2026-09-15", checkOut: "2026-09-18", rooms: 1, guest: "Michael Ross", amount: 1344.0, voucher: "Pending", payment: "Due" },
];
