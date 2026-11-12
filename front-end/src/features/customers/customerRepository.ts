import { apiRequest } from "@/api/client";
import { apiStatus, type ApiCustomer, type ApiPage } from "@/api/types";
import type { Customer } from "@/types";

function fromApi(value: ApiCustomer): Customer {
  const profile = value.profile as Partial<Customer>;
  const blankAddress = { address: "", city: "", country: "", postalCode: "" };
  return {
    id: value.id,
    agentCode: value.agentCode,
    accountCode: value.accountCode,
    name: value.name,
    customerTypes: profile.customerTypes ?? [],
    customerChannels: profile.customerChannels ?? [],
    branches: profile.branches ?? [],
    branchIds: value.branchIds ?? [],
    supplierConnectionIds: value.supplierConnectionIds ?? [],
    paymentChannels: profile.paymentChannels ?? [],
    groupCompany: profile.groupCompany ?? "",
    locationType: profile.locationType ?? "Local",
    businessTypes: profile.businessTypes ?? [],
    companyAddress: profile.companyAddress ?? blankAddress,
    billingAddress: profile.billingAddress ?? blankAddress,
    billingSameAsCompany: profile.billingSameAsCompany ?? true,
    telephone: value.telephone,
    mobile: value.mobile,
    email: value.email,
    website: value.website,
    logo: profile.logo ?? null,
    tradeLicence: profile.tradeLicence ?? null,
    tradeLicenceExpiry: profile.tradeLicenceExpiry ?? "",
    ownerIdentity: profile.ownerIdentity ?? null,
    quotationFlow: profile.quotationFlow ?? "No",
    bookingOnHold: profile.bookingOnHold ?? "No",
    notificationEmails: profile.notificationEmails ?? [],
    profileSelection: profile.profileSelection ?? "Non-Mandatory",
    accountManager: profile.accountManager ?? "",
    revenueExecutive: profile.revenueExecutive ?? "",
    controlDepartment: profile.controlDepartment ?? "",
    b2b2b: profile.b2b2b ?? "Disabled",
    whiteLabel: profile.whiteLabel ?? "No",
    allowReissue: profile.allowReissue ?? "No",
    dateTimeFormat: profile.dateTimeFormat ?? "MM/DD/YYYY",
    defaultCurrency: value.defaultCurrency,
    multiCurrencies: profile.multiCurrencies ?? [],
    pricingModel: profile.pricingModel ?? "",
    pricingModelId: value.pricingModelId ?? "",
    adhocMarkup: profile.adhocMarkup ?? "No",
    dynamicPricingFields: profile.dynamicPricingFields ?? [],
    admin: profile.admin ?? { firstName: "", lastName: "", designation: "", email: value.email },
    accountsContact: profile.accountsContact ?? null,
    status: apiStatus(value.status),
    createdAt: value.createdAt,
  };
}

export async function getCustomers(): Promise<Customer[]> {
  const response = await apiRequest<ApiPage<ApiCustomer>>("/customers?page_size=100");
  return response.items.map(fromApi);
}

export async function getCustomer(customerId: string): Promise<Customer> {
  const response = await apiRequest<ApiCustomer>(`/customers/${customerId}`);
  return fromApi(response);
}

function toPayload(input: Omit<Customer, "id" | "agentCode" | "status" | "createdAt">) {
  const {
    accountCode,
    name,
    email,
    telephone,
    mobile,
    website,
    defaultCurrency,
    pricingModelId,
    branchIds,
    supplierConnectionIds,
    ...profile
  } = input;
  return {
    accountCode,
    name,
    email: email || input.admin.email,
    telephone,
    mobile,
    website,
    defaultCurrency,
    pricingModelId,
    branchIds,
    supplierConnectionIds,
    profile: {
      ...profile,
      admin: input.admin,
      accountsContact: input.accountsContact,
      profileSelection: input.profileSelection,
    },
  };
}

export async function createCustomer(
  input: Omit<Customer, "id" | "agentCode" | "status" | "createdAt">,
): Promise<Customer> {
  const response = await apiRequest<ApiCustomer>("/customers", {
    method: "POST",
    body: toPayload(input),
  });
  return fromApi(response);
}

export async function updateCustomer(
  customerId: string,
  input: Omit<Customer, "id" | "agentCode" | "status" | "createdAt">,
): Promise<Customer> {
  const response = await apiRequest<ApiCustomer>(`/customers/${customerId}`, {
    method: "PUT",
    body: toPayload(input),
  });
  return fromApi(response);
}
