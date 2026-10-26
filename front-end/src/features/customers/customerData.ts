import type { Customer } from "@/types";

export const CUSTOMER_TYPES = ["All", "B2B", "B2C", "Corporate", "Walkin", "Telesales"];
export const CUSTOMER_CHANNELS = ["All", "OTA", "Agent", "Corporate", "Cash & Credit Card"];
export const PAYMENT_CHANNELS = ["All", "Top-up", "Credit", "Cash", "Credit Card", "Transfer"];
export const BUSINESS_TYPES = ["All", "FIT", "Group", "Tours Packages", "Sightseeing", "Seaman"];
export const NOTIFICATION_EMAILS = ["Company Email", "Manager", "User", "Accounts"];
export const DYNAMIC_PRICING_FIELDS = ["Air", "Hotel", "Tour", "Sightseeing", "Insurance", "Import", "SYNC"];
export const CURRENCIES = ["USD", "EUR", "GBP", "AED", "PKR", "SAR"];
export const DATE_TIME_FORMATS = [
  "DD/MM/YYYY HH:mm",
  "MM/DD/YYYY hh:mm A",
  "YYYY-MM-DD HH:mm",
];

export const customerSeeds: Customer[] = [
  {
    id: "CUS-0001",
    agentCode: "AGT-000001",
    accountCode: "123456789",
    name: "ABC Travel",
    customerTypes: ["B2B", "Corporate"],
    customerChannels: ["Agent", "Corporate"],
    branches: ["Downtown Branch"],
    paymentChannels: ["Credit", "Transfer"],
    groupCompany: "ABC Holdings",
    locationType: "Regional",
    businessTypes: ["FIT", "Group"],
    companyAddress: { address: "Sheikh Zayed Road", city: "Dubai", country: "UAE", postalCode: "00000" },
    billingAddress: { address: "Sheikh Zayed Road", city: "Dubai", country: "UAE", postalCode: "00000" },
    billingSameAsCompany: true,
    telephone: "+971 4 555 0199",
    mobile: "+971 50 555 0199",
    email: "travel@abcholdings.example",
    website: "https://abctravel.example",
    logo: null,
    tradeLicence: null,
    tradeLicenceExpiry: "",
    ownerIdentity: null,
    quotationFlow: "Yes",
    bookingOnHold: "Subject to Supplier",
    notificationEmails: ["Company Email", "Manager"],
    profileSelection: "Mandatory",
    accountManager: "Hira Sheikh",
    revenueExecutive: "Usman Tariq",
    controlDepartment: "Accounts",
    b2b2b: "Enabled",
    whiteLabel: "Yes",
    allowReissue: "Yes",
    dateTimeFormat: "DD/MM/YYYY HH:mm",
    defaultCurrency: "AED",
    multiCurrencies: ["USD", "EUR"],
    pricingModel: "Corporate Flat Fee",
    adhocMarkup: "No",
    dynamicPricingFields: ["Air", "Hotel", "Tour"],
    admin: { firstName: "Amina", lastName: "Khan", designation: "Administrator", email: "amina@abcholdings.example" },
    accountsContact: { firstName: "Omar", lastName: "Ali", designation: "Accountant", email: "accounts@abcholdings.example" },
    status: "Active",
    createdAt: "2026-08-15",
  },
  {
    id: "CUS-0002",
    agentCode: "AGT-000002",
    accountCode: "784512036",
    name: "Orbit Corporate Travel",
    customerTypes: ["Corporate"],
    customerChannels: ["Corporate"],
    branches: ["Airport Counter"],
    paymentChannels: ["Credit Card"],
    groupCompany: "",
    locationType: "Local",
    businessTypes: ["FIT"],
    companyAddress: { address: "Airport Road", city: "Karachi", country: "Pakistan", postalCode: "75200" },
    billingAddress: { address: "Airport Road", city: "Karachi", country: "Pakistan", postalCode: "75200" },
    billingSameAsCompany: true,
    telephone: "+92 21 555 0123",
    mobile: "+92 300 555 0123",
    email: "hello@orbit.example",
    website: "",
    logo: null,
    tradeLicence: null,
    tradeLicenceExpiry: "",
    ownerIdentity: null,
    quotationFlow: "No",
    bookingOnHold: "No",
    notificationEmails: ["Company Email", "Accounts"],
    profileSelection: "Non-Mandatory",
    accountManager: "Saad Qureshi",
    revenueExecutive: "Talha Butt",
    controlDepartment: "Accounts",
    b2b2b: "Disabled",
    whiteLabel: "No",
    allowReissue: "Yes",
    dateTimeFormat: "DD/MM/YYYY HH:mm",
    defaultCurrency: "PKR",
    multiCurrencies: ["USD"],
    pricingModel: "Emirates Std Markup",
    adhocMarkup: "Yes",
    dynamicPricingFields: ["Air", "Hotel"],
    admin: { firstName: "Sara", lastName: "Raza", designation: "Travel Manager", email: "sara@orbit.example" },
    accountsContact: null,
    status: "Active",
    createdAt: "2026-08-20",
  },
];

export const asOptions = (values: readonly string[]) => values.map((value) => ({ label: value, value }));

export function exclusiveAllSelection(current: string[], next: string[]): string[] {
  const added = next.find((value) => !current.includes(value));
  if (added === "All") return ["All"];
  return next.filter((value) => value !== "All");
}
