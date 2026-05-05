import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";

export type Role = "admin" | "sales" | "manager" | "accountant" | "installations";

export const PERMISSIONS = {
  // CRM
  "crm:read": ["admin", "sales", "manager"],
  "crm:write": ["admin", "sales", "manager"],
  "crm:delete": ["admin", "manager"],

  // Sales
  "sales:read": ["admin", "sales", "manager"],
  "sales:write": ["admin", "sales", "manager"],
  "sales:approve_discount": ["admin", "manager"],

  // Purchase
  "purchase:read": ["admin", "manager"],
  "purchase:write": ["admin", "manager"],
  "purchase:approve": ["admin", "manager"],

  // Inventory
  "inventory:read": ["admin", "sales", "manager"],
  "inventory:write": ["admin", "manager"],

  // Accounts
  "accounts:read": ["admin", "manager"],
  "accounts:write": ["admin", "manager"],

  // Subsidy
  "subsidy:read": ["admin", "sales", "manager"],
  "subsidy:write": ["admin", "sales", "manager"],

  // HR
  "hr:read": ["admin", "manager"],
  "hr:write": ["admin", "manager"],

  // Admin
  "admin:all": ["admin"],
} as const satisfies Record<string, Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function requireAuth() {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");
  return session;
}

export async function requirePermission(permission: Permission) {
  const session = await requireAuth();
  const role = (session.user as { role?: Role }).role ?? "sales";

  if (!hasPermission(role, permission)) {
    throw new Error(`Insufficient permissions for ${permission}`);
  }
  return session;
}

export async function requireRole(roles: Role[]) {
  const session = await requireAuth();
  const userRole = (session.user as { role?: Role }).role ?? "sales";
  if (!roles.includes(userRole)) {
    throw new Error(`Role ${userRole} not allowed`);
  }
  return session;
}
