export type Role = "Administrator" | "Manager" | "Agent" | "Accounts" | "Sub Agent";

export type AccountStatus = "Active" | "Inactive" | "Suspended";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  roles: Role[];
  permissions: string[];
  companyId: string;
  branchId: string | null;
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

export interface TravellerBookingHistory {
  ref: string;
  date: string;
  service: string;
  amount: number;
  status: "Confirmed" | "Completed" | "Cancelled" | "Pending";
}

export interface TravellerProfile {
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
  history: TravellerBookingHistory[];
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

export interface Department {
  id: string;
  name: string;
  head: string;
  users: number;
  status: AccountStatus;
  createdAt: string;
}

export interface CustomerAddress {
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

export interface CustomerContact {
  firstName: string;
  lastName: string;
  designation: string;
  email: string;
}

export interface CustomerDocument {
  fileId?: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
}

export interface Customer {
  id: string;
  agentCode: string;
  accountCode: string;
  name: string;
  customerTypes: string[];
  customerChannels: string[];
  branches: string[];
  paymentChannels: string[];
  groupCompany: string;
  locationType: "Local" | "Global" | "Regional";
  businessTypes: string[];
  companyAddress: CustomerAddress;
  billingAddress: CustomerAddress;
  billingSameAsCompany: boolean;
  telephone: string;
  mobile: string;
  email: string;
  website: string;
  logo: CustomerDocument | null;
  tradeLicence: CustomerDocument | null;
  tradeLicenceExpiry: string;
  ownerIdentity: CustomerDocument | null;
  quotationFlow: "Yes" | "No";
  bookingOnHold: "Subject to Supplier" | "No";
  notificationEmails: string[];
  profileSelection: "Mandatory" | "Non-Mandatory" | "Skip";
  accountManager: string;
  revenueExecutive: string;
  controlDepartment: string;
  b2b2b: "Enabled" | "Disabled";
  whiteLabel: "Yes" | "No";
  allowReissue: "Yes" | "No";
  dateTimeFormat: string;
  defaultCurrency: string;
  multiCurrencies: string[];
  pricingModel: string;
  adhocMarkup: "Yes" | "No";
  dynamicPricingFields: string[];
  admin: CustomerContact;
  accountsContact: CustomerContact | null;
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
  templates?: PricingTemplate[];
}

export type TemplateCategory = "Air" | "Hotel" | "Tour" | "Car" | "Transfer" | "Insurance" | "Offline MISC";

export const ALL_TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "Air", "Hotel", "Tour", "Car", "Transfer", "Insurance", "Offline MISC",
];

export interface AirTemplate {
  category: "Air";
  supplierName: string;
  travelDateFrom: string;
  travelDateTo: string;
  tripType: string;
  fromCountry: string;
  toCountry: string;
  fromAirport: string;
  toAirport: string;
  airlineCodeInclude: string[];
  airlineCodeExclude: string[];
  fareCategory: string;
  classType: string;
  passengerType: string;
  formOfPayment: string;
  markupAppliedOn: string;
  markupPercentage: string;
  markupAmount: string;
  transactionAppliedOn: string;
  transactionPercentage: string;
  transactionFeeAmount: string;
  rebateAppliedOn: string;
  rebatePercentage: string;
  rebateAmount: string;
  outboundRbd: string;
  inboundRbd: string;
  description: string;
}

export interface HotelTemplate {
  category: "Hotel";
  supplierName: string;
  hotelStarRating: string;
  country: string;
  cityName: string;
  hotelCityNameInclude: string[];
  hotelCityNameExclude: string[];
  formOfPayment: string;
  guestType: string;
  markupBasis: string;
  markupAppliedOn: string;
  markupPercentage: string;
  markupAmount: string;
  transactionBasis: string;
  transactionAppliedOn: string;
  transactionPercentage: string;
  transactionFeeAmount: string;
  rebateBasis: string;
  rebateAppliedOn: string;
  rebatePercentage: string;
  rebateAmount: string;
  description: string;
}

export interface TourTemplate {
  category: "Tour";
  ruleName: string;
  supplierName: string;
  hotelStarRating: string;
  country: string;
  cityName: string;
  toursPackageInclude: string[];
  toursPackageExclude: string[];
  formOfPayment: string;
  packageType: string;
  markupBasis: string;
  markupAppliedOn: string;
  markupPercentage: string;
  markupAmount: string;
  transactionBasis: string;
  transactionAppliedOn: string;
  transactionPercentage: string;
  transactionFeeAmount: string;
  rebateBasis: string;
  rebateAppliedOn: string;
  rebatePercentage: string;
  rebateAmount: string;
  description: string;
}

export type PricingTemplate = AirTemplate | HotelTemplate | TourTemplate;

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
  type: "text" | "select" | "date" | "file";
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
  search: Record<string, string | number | boolean>;
  legs?: BookingFlightLeg[];
}

export interface TravelerCounts {
  adults: number;
  children: number;
  infants: number;
}

export interface BookingFlightLeg {
  origin: string;
  destination: string;
  depart: string;
  cabin: string;
  airline: string;
  time: string;
}

export interface BookingSearchFilters {
  [key: string]: string;
}

export interface FlightSearchFilters {
  tab: "one-way" | "round-trip" | "multi" | "flexi" | "group-fare";
  legs: BookingFlightLeg[];
  travelers: TravelerCounts;
  stopType: string;
  stopCity: string;
  fareType: string;
  baggage: string;
  fareSource: string;
}
