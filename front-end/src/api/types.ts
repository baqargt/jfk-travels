import type { AccountStatus, Role } from "@/types";

export interface ApiPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  status: string;
  companyId: string | null;
  branchId: string | null;
  departmentId: string | null;
  jobTitleId: string | null;
  accessProfileId: string | null;
  isSuperAdmin: boolean;
  roles: Role[];
  permissions: string[];
  lastLoginAt: string | null;
}

export interface ApiCompanyUsage {
  subCompanies: number;
  users: number;
  travellers: number;
}

export interface ApiJobTitle {
  id: string;
  code: string;
  name: string;
  branchId: string | null;
  status: string;
  createdAt: string;
}

export interface ApiAccessProfile {
  id: string;
  name: string;
  description: string;
  branchId: string | null;
  status: string;
  presetKey: string | null;
  permissionKeys: string[];
  createdAt: string;
}

export interface ApiMatrix {
  branches: Array<{ id: string; name: string; branchType: string; code: string }>;
  rows: Array<{
    id: string;
    name: string;
    cells: Record<string, boolean>;
    [key: string]: unknown;
  }>;
}

export interface ApiBranch {
  id: string;
  code: string;
  name: string;
  branchType: "Branch" | "Franchise";
  location: string;
  managerName: string;
  currency: string;
  creditLimit: string;
  cashBalance: string;
  status: string;
  users: number;
  createdAt: string;
}

export interface ApiCompany {
  id: string;
  legalName: string;
  tradingName: string;
  email: string;
  phone: string;
  address: string;
  iataNumber: string;
  uicCode: string;
  businessLicense: string;
  baseCurrency: string;
  timezone: string;
  status: string;
  maxSubCompanies: number;
  maxUsers: number;
  maxTravellers: number;
  usage?: ApiCompanyUsage | null;
}

export interface SupplierConnection {
  id: string;
  providerName: string;
  services: string[];
  maskedKey: string;
  enabled: boolean;
  status: string;
}

export interface ApiDepartment {
  id: string;
  code: string;
  name: string;
  headName: string;
  branchId: string | null;
  status: string;
  users: number;
  createdAt: string;
}

export interface ApiCustomer {
  id: string;
  branchId: string | null;
  branchIds: string[];
  pricingModelId: string | null;
  supplierConnectionIds: string[];
  accountCode: string;
  agentCode: string;
  name: string;
  email: string;
  telephone: string;
  mobile: string;
  website: string;
  defaultCurrency: string;
  status: string;
  profile: Record<string, unknown>;
  createdAt: string;
}

export interface ApiTraveller {
  id: string;
  branchId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  dateOfBirth: string | null;
  passportMasked: string;
  passportExpiry: string | null;
  preferences: Record<string, unknown>;
  status: string;
  createdAt: string;
}

export interface ApiNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success";
  unread: boolean;
  createdAt: string;
}

export interface DashboardSummary {
  customers: number;
  travellers: number;
  bookings: number;
  grossSales: string;
  refundsPending: number;
  availableBalance: string;
  creditLimit: string;
  currency: string;
}

export interface FinancialAccount {
  id: string;
  branchId: string | null;
  accountType: "cash" | "credit";
  currency: string;
  limitAmount: string;
  balance: string;
  status: string;
}

export interface ApiLedgerEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
  currency: string;
}

export interface ApiTemporaryLimit {
  id: string;
  accountId: string;
  amount: string;
  used: string;
  reason: string;
  expiresAt: string;
  status: string;
  createdAt: string;
}

export interface ApiApprovalRequest {
  id: string;
  requestType: string;
  entityType: string;
  entityId: string;
  requestedBy: string;
  decidedBy: string | null;
  status: string;
  reason: string;
  decisionComment: string;
  payload: Record<string, unknown>;
  createdAt: string;
  decidedAt: string | null;
}

export interface ApiExchangeRate {
  id: string;
  baseCurrency: string;
  quoteCurrency: string;
  rate: string;
  effectiveDate: string;
}

export interface SupplierOffer {
  id: string;
  title: string;
  subtitle: string;
  currency: string;
  price: string;
  expiresAt: string;
  details: Record<string, unknown>;
}

export interface Quote {
  id: string;
  serviceType: string;
  currency: string;
  baseAmount: string;
  markupAmount: string;
  totalAmount: string;
  expiresAt: string;
  status: string;
  offer: SupplierOffer;
}

export interface ApiBookingPassenger {
  id: string;
  passengerType: string;
  snapshot: Record<string, unknown>;
}

export interface ApiBooking {
  id: string;
  reference: string;
  supplierReference: string;
  serviceType: string;
  status: string;
  currency: string;
  totalAmount: string;
  details: Record<string, unknown>;
  passengers?: ApiBookingPassenger[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiPricingModel {
  id: string;
  name: string;
  pricingType: "Markup" | "Commission";
  scope: string;
  priority: number;
  status: string;
  activeVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiPricingModelDetail extends ApiPricingModel {
  rules: Record<string, unknown>;
  latestVersion: number;
}

export const apiStatus = (status: string): AccountStatus => {
  const normalized = status.toLowerCase();
  if (normalized === "suspended") return "Suspended";
  if (normalized === "active") return "Active";
  return "Inactive";
};

