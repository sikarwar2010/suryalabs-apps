"use server";

import { and, count, desc, eq, type SQL, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import db from "@/db";
import { itemStock, items, stockLedger } from "@/db/schema/index";
import { requirePermission } from "@/lib/auth/rbac";
import { generateItemCode } from "@/lib/utlis/helpers";

const CreateItemSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  unit: z.string().default("pcs"),
  hsnCode: z.string().optional(),
  gstRate: z.number().min(0).max(28).default(12),
  sellingPrice: z.number().nonnegative().optional(),
  purchasePrice: z.number().nonnegative().optional(),
  minStockLevel: z.number().nonnegative().default(0),
  isSerialized: z.boolean().default(false),
  isBatch: z.boolean().default(false),
  specifications: z.record(z.string(), z.unknown()).optional(),
});

const AdjustStockSchema = z.object({
  itemId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.number(),
  movementType: z.enum([
    "purchase_receipt",
    "sales_dispatch",
    "transfer",
    "adjustment",
    "return_to_vendor",
    "return_from_customer",
  ]),
  referenceType: z.string().optional(),
  referenceId: z.string().uuid().optional(),
  batchNumber: z.string().optional(),
  serialNumbers: z.array(z.string()).optional(),
  unitCost: z.number().nonnegative().optional(),
  remarks: z.string().optional(),
});

function toDbNumeric(value: number): string;
function toDbNumeric(value: undefined): undefined;
function toDbNumeric(value: number | undefined): string | undefined;
function toDbNumeric(value: number | undefined) {
  return value === undefined ? undefined : value.toString();
}

export async function createItem(input: unknown) {
  await requirePermission("inventory:write");
  const data = CreateItemSchema.parse(input);

  const [item] = await db
    .insert(items)
    .values({
      ...data,
      code: generateItemCode(),
      specifications: data.specifications ?? null,
      sellingPrice: toDbNumeric(data.sellingPrice),
      purchasePrice: toDbNumeric(data.purchasePrice),
      gstRate: toDbNumeric(data.gstRate),
      minStockLevel: toDbNumeric(data.minStockLevel),
    })
    .returning();

  revalidatePath("/dashboard/inventory");
  return { success: true, item };
}

export async function updateItem(id: string, input: unknown) {
  await requirePermission("inventory:write");
  const data = CreateItemSchema.partial().parse(input);
  const { sellingPrice, purchasePrice, gstRate, minStockLevel, ...itemData } =
    data;

  const [item] = await db
    .update(items)
    .set({
      ...itemData,
      specifications: data.specifications ?? undefined,
      sellingPrice: toDbNumeric(sellingPrice),
      purchasePrice: toDbNumeric(purchasePrice),
      gstRate: toDbNumeric(gstRate),
      minStockLevel: toDbNumeric(minStockLevel),
      updatedAt: new Date(),
    })
    .where(eq(items.id, id))
    .returning();

  revalidatePath("/dashboard/inventory");
  return { success: true, item };
}

export async function adjustStock(input: unknown) {
  const session = await requirePermission("inventory:write");
  const data = AdjustStockSchema.parse(input);

  return await db.transaction(async (tx) => {
    // Get current balance
    const [existing] = await tx
      .select()
      .from(itemStock)
      .where(
        and(
          eq(itemStock.itemId, data.itemId),
          eq(itemStock.warehouseId, data.warehouseId),
        ),
      );

    const currentBalance = parseFloat(existing?.onHandQty ?? "0");
    const newBalance = currentBalance + data.quantity;

    if (newBalance < 0) {
      throw new Error(
        `Insufficient stock. Available: ${currentBalance}, Requested: ${Math.abs(data.quantity)}`,
      );
    }

    // Upsert item_stock
    if (existing) {
      await tx
        .update(itemStock)
        .set({ onHandQty: newBalance.toString(), updatedAt: new Date() })
        .where(
          and(
            eq(itemStock.itemId, data.itemId),
            eq(itemStock.warehouseId, data.warehouseId),
          ),
        );
    } else {
      await tx.insert(itemStock).values({
        itemId: data.itemId,
        warehouseId: data.warehouseId,
        onHandQty: newBalance.toString(),
      });
    }

    // Record ledger entry
    const [ledgerEntry] = await tx
      .insert(stockLedger)
      .values({
        itemId: data.itemId,
        warehouseId: data.warehouseId,
        movementType: data.movementType,
        quantity: data.quantity.toString(),
        balanceQty: newBalance.toString(),
        referenceType: data.referenceType ?? null,
        referenceId: data.referenceId ?? null,
        batchNumber: data.batchNumber ?? null,
        serialNumbers: data.serialNumbers ?? null,
        unitCost: data.unitCost?.toString() ?? null,
        remarks: data.remarks ?? null,
        createdBy: session.user.id,
      })
      .returning();

    revalidatePath("/dashboard/inventory");
    return { success: true, ledgerEntry, newBalance };
  });
}

export async function getItems(opts?: {
  categoryId?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}) {
  await requirePermission("inventory:read");

  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 50;
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [];
  if (opts?.categoryId) conditions.push(eq(items.categoryId, opts.categoryId));
  if (opts?.isActive !== undefined)
    conditions.push(eq(items.isActive, opts.isActive));
  if (opts?.search) {
    conditions.push(sql`${items.name} ilike ${`%${opts.search}%`}`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalCount] = await Promise.all([
    db
      .select()
      .from(items)
      .where(where)
      .orderBy(items.name)
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(items).where(where),
  ]);

  return {
    items: rows,
    total: totalCount[0]?.count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((totalCount[0]?.count ?? 0) / pageSize),
  };
}

export async function getStockSummary(warehouseId?: string) {
  await requirePermission("inventory:read");

  const query = db
    .select({
      item: items,
      onHandQty: itemStock.onHandQty,
      reservedQty: itemStock.reservedQty,
      warehouseId: itemStock.warehouseId,
    })
    .from(itemStock)
    .leftJoin(items, eq(items.id, itemStock.itemId));

  const rows = warehouseId
    ? await query.where(eq(itemStock.warehouseId, warehouseId))
    : await query;

  return rows;
}

export async function getLowStockAlerts() {
  await requirePermission("inventory:read");

  const alerts = await db
    .select({
      item: items,
      onHandQty: itemStock.onHandQty,
      minStockLevel: items.minStockLevel,
      warehouseId: itemStock.warehouseId,
    })
    .from(itemStock)
    .leftJoin(items, eq(items.id, itemStock.itemId))
    .where(
      sql`${itemStock.onHandQty}::numeric < ${items.minStockLevel}::numeric`,
    );

  return alerts;
}

export async function getStockMovements(itemId?: string, limit = 50) {
  await requirePermission("inventory:read");

  const conditions: SQL[] = itemId ? [eq(stockLedger.itemId, itemId)] : [];

  return db
    .select()
    .from(stockLedger)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(stockLedger.createdAt))
    .limit(limit);
}
