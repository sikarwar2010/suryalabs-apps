"use server";

import { and, count, desc, eq, type SQL, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import db from "@/db";
import { leads, quotations, salesOrders } from "@/db/schema/index";
import { requirePermission } from "@/lib/auth/rbac";
import {
  generateQuotationCode,
  generateSalesOrderCode,
} from "@/lib/utlis/helpers";
import {
  type CreateQuotationInput,
  CreateQuotationSchema,
  type CreateSalesOrderInput,
  CreateSalesOrderSchema,
} from "@/schema/sales.schema";

const UpdateQuotationSchema = CreateQuotationSchema.partial();

const salesOrderStatuses = [
  "draft",
  "confirmed",
  "in_production",
  "ready_dispatch",
  "dispatched",
  "installed",
  "invoiced",
  "closed",
] as const;

type SalesOrderStatus = (typeof salesOrderStatuses)[number];

function toDbNumeric(value: number): string;
function toDbNumeric(value: undefined): undefined;
function toDbNumeric(value: number | undefined): string | undefined;
function toDbNumeric(value: number | undefined) {
  return value === undefined ? undefined : value.toString();
}

// Quotation Actions

export async function createQuotation(input: CreateQuotationInput) {
  const session = await requirePermission("sales:write");
  const data = CreateQuotationSchema.parse(input);
  const {
    systemSizeKw,
    inverterKw,
    batteryKwh,
    subtotal,
    gstAmount,
    totalAmount,
    subsidyAmount,
    netAmount,
    ...quotationData
  } = data;

  const [quotation] = await db
    .insert(quotations)
    .values({
      ...quotationData,
      code: generateQuotationCode(),
      systemSizeKw: toDbNumeric(systemSizeKw),
      inverterKw: toDbNumeric(inverterKw),
      batteryKwh: toDbNumeric(batteryKwh),
      subtotal: toDbNumeric(subtotal),
      gstAmount: toDbNumeric(gstAmount),
      totalAmount: toDbNumeric(totalAmount),
      subsidyAmount: toDbNumeric(subsidyAmount),
      netAmount: toDbNumeric(netAmount),
      validUntil: data.validUntil ?? undefined,
      lineItems: data.lineItems,
      createdBy: session.user.id,
    })
    .returning();

  if (data.leadId) {
    await db
      .update(leads)
      .set({ status: "quotation_sent", updatedAt: new Date() })
      .where(eq(leads.id, data.leadId));
  }

  revalidatePath("/dashboard/sales/quotations");
  return { success: true, quotation };
}

export async function updateQuotation(
  id: string,
  input: Partial<CreateQuotationInput>,
) {
  await requirePermission("sales:write");
  const data = UpdateQuotationSchema.parse(input);
  const {
    systemSizeKw,
    inverterKw,
    batteryKwh,
    subtotal,
    gstAmount,
    totalAmount,
    subsidyAmount,
    netAmount,
    lineItems,
    ...quotationData
  } = data;

  const [existing] = await db
    .select({ version: quotations.version })
    .from(quotations)
    .where(eq(quotations.id, id));

  const [updated] = await db
    .update(quotations)
    .set({
      ...quotationData,
      lineItems,
      systemSizeKw: toDbNumeric(systemSizeKw),
      inverterKw: toDbNumeric(inverterKw),
      batteryKwh: toDbNumeric(batteryKwh),
      subtotal: toDbNumeric(subtotal),
      gstAmount: toDbNumeric(gstAmount),
      totalAmount: toDbNumeric(totalAmount),
      subsidyAmount: toDbNumeric(subsidyAmount),
      netAmount: toDbNumeric(netAmount),
      version: (existing?.version ?? 1) + 1,
      updatedAt: new Date(),
    })
    .where(eq(quotations.id, id))
    .returning();

  revalidatePath("/dashboard/sales/quotations");
  revalidatePath(`/dashboard/sales/quotations/${id}`);
  return { success: true, quotation: updated };
}

export async function approveQuotation(id: string) {
  await requirePermission("sales:write");

  const [updated] = await db
    .update(quotations)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(quotations.id, id))
    .returning();

  revalidatePath("/dashboard/sales/quotations");
  return { success: true, quotation: updated };
}

export async function getQuotations(opts?: {
  customerId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  await requirePermission("sales:read");

  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [];
  if (opts?.customerId) {
    conditions.push(eq(quotations.customerId, opts.customerId));
  }
  if (opts?.status) conditions.push(eq(quotations.status, opts.status));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalCount] = await Promise.all([
    db
      .select()
      .from(quotations)
      .where(where)
      .orderBy(desc(quotations.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(quotations).where(where),
  ]);

  const total = totalCount[0]?.count ?? 0;

  return {
    quotations: rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getQuotationById(id: string) {
  await requirePermission("sales:read");
  const [q] = await db.select().from(quotations).where(eq(quotations.id, id));
  return q ?? null;
}

// Sales Order Actions

export async function createSalesOrder(input: CreateSalesOrderInput) {
  const session = await requirePermission("sales:write");
  const data = CreateSalesOrderSchema.parse(input);
  const {
    systemSizeKw,
    subtotal,
    gstAmount,
    totalAmount,
    subsidyAmount,
    netAmount,
    advancePaid,
    ...orderData
  } = data;

  const [order] = await db
    .insert(salesOrders)
    .values({
      ...orderData,
      code: generateSalesOrderCode(),
      systemSizeKw: toDbNumeric(systemSizeKw),
      subtotal: toDbNumeric(subtotal),
      gstAmount: toDbNumeric(gstAmount),
      totalAmount: toDbNumeric(totalAmount),
      subsidyAmount: toDbNumeric(subsidyAmount),
      netAmount: toDbNumeric(netAmount),
      advancePaid: toDbNumeric(advancePaid),
      lineItems: data.lineItems,
      expectedDelivery: data.expectedDelivery ?? undefined,
      createdBy: session.user.id,
    })
    .returning();

  if (data.quotationId) {
    await db
      .update(quotations)
      .set({ status: "converted", updatedAt: new Date() })
      .where(eq(quotations.id, data.quotationId));
  }

  revalidatePath("/dashboard/sales/orders");
  return { success: true, order };
}

export async function updateSalesOrderStatus(
  id: string,
  status: SalesOrderStatus,
) {
  await requirePermission("sales:write");

  const [updated] = await db
    .update(salesOrders)
    .set({ status, updatedAt: new Date() })
    .where(eq(salesOrders.id, id))
    .returning();

  revalidatePath("/dashboard/sales/orders");
  return { success: true, order: updated };
}

export async function getSalesOrders(opts?: {
  status?: string;
  customerId?: string;
  page?: number;
  pageSize?: number;
}) {
  await requirePermission("sales:read");

  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [];
  if (opts?.status) {
    if (!salesOrderStatuses.includes(opts.status as SalesOrderStatus)) {
      throw new Error(`Invalid sales order status: ${opts.status}`);
    }
    conditions.push(eq(salesOrders.status, opts.status as SalesOrderStatus));
  }
  if (opts?.customerId) {
    conditions.push(eq(salesOrders.customerId, opts.customerId));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalCount] = await Promise.all([
    db
      .select()
      .from(salesOrders)
      .where(where)
      .orderBy(desc(salesOrders.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(salesOrders).where(where),
  ]);

  const total = totalCount[0]?.count ?? 0;

  return {
    orders: rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getSalesDashboard() {
  await requirePermission("sales:read");

  const [ordersByStatus, revenueData, topMonths] = await Promise.all([
    db
      .select({ status: salesOrders.status, count: count() })
      .from(salesOrders)
      .groupBy(salesOrders.status),

    db
      .select({
        total: sql<string>`sum(${salesOrders.totalAmount})`,
        count: count(),
      })
      .from(salesOrders)
      .where(eq(salesOrders.status, "closed")),

    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${salesOrders.createdAt}), 'Mon YYYY')`,
        revenue: sql<string>`sum(${salesOrders.totalAmount})`,
        count: count(),
      })
      .from(salesOrders)
      .groupBy(sql`date_trunc('month', ${salesOrders.createdAt})`)
      .orderBy(sql`date_trunc('month', ${salesOrders.createdAt}) desc`)
      .limit(12),
  ]);

  return { ordersByStatus, revenueData: revenueData[0], topMonths };
}
