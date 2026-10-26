import { customerSeeds } from "@/features/customers/customerData";
import type { Customer } from "@/types";

const STORAGE_KEY = "jfk.customers.v1";

function isCustomer(value: unknown): value is Customer {
  if (!value || typeof value !== "object") return false;
  const customer = value as Partial<Customer>;
  return typeof customer.id === "string" && typeof customer.agentCode === "string" &&
    typeof customer.accountCode === "string" && typeof customer.name === "string" &&
    typeof customer.admin?.email === "string";
}

export function getCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return customerSeeds;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every(isCustomer) ? parsed : customerSeeds;
  } catch {
    return customerSeeds;
  }
}

function nextNumber(customers: Customer[], key: "id" | "agentCode"): number {
  return customers.reduce((max, customer) => {
    const numeric = Number(customer[key].match(/\d+$/)?.[0] ?? 0);
    return Math.max(max, numeric);
  }, 0) + 1;
}

export function customerConflicts(accountCode: string, adminEmail: string): { accountCode: boolean; adminEmail: boolean } {
  const customers = getCustomers();
  const normalizedCode = accountCode.trim().toLowerCase();
  const normalizedEmail = adminEmail.trim().toLowerCase();
  return {
    accountCode: customers.some((customer) => customer.accountCode.trim().toLowerCase() === normalizedCode),
    adminEmail: customers.some((customer) => customer.admin.email.trim().toLowerCase() === normalizedEmail),
  };
}

export function createCustomer(input: Omit<Customer, "id" | "agentCode" | "status" | "createdAt">): Customer {
  const customers = getCustomers();
  const conflicts = customerConflicts(input.accountCode, input.admin.email);
  if (conflicts.accountCode) throw new Error("That account code is already in use.");
  if (conflicts.adminEmail) throw new Error("That customer admin email is already in use.");

  const customer: Customer = {
    ...input,
    id: `CUS-${String(nextNumber(customers, "id")).padStart(4, "0")}`,
    agentCode: `AGT-${String(nextNumber(customers, "agentCode")).padStart(6, "0")}`,
    status: "Active",
    createdAt: new Date().toISOString().slice(0, 10),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...customers, customer]));
  return customer;
}
