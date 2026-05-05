"use server";

import { and, count, desc, eq, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import db from "@/db";
import { subsidyClaims } from "@/db/schema/index";
import { requirePermission } from "@/lib/auth/rbac";
import {
  calculatePMSuryaGharSubsidy,
  generateSubsidyCode,
} from "@/lib/utlis/helpers";

const subsidyStatuses = [
  "not_applied",
  "eligibility_check",
  "docs_uploaded",
  "discom_submitted",
  "discom_approved",
  "claim_submitted",
  "subsidy_received",
  "rejected",
] as const;

type SubsidyStatus = (typeof subsidyStatuses)[number];

const CreateSubsidyClaimSchema = z.object({
  salesOrderId: z.string().uuid(),
  customerId: z.string().uuid(),
  installationId: z.string().uuid().optional(),
  systemSizeKw: z.number().min(0.5),
  subsidyCategory: z.enum(["residential", "commercial"]).default("residential"),
});

const UpdateSubsidyStatusSchema = z.object({
  status: z.enum(subsidyStatuses),
  discomApplicationNumber: z.string().optional(),
  discomRemarks: z.string().optional(),
  subsidyReceivedAmount: z.number().nonnegative().optional(),
  remarks: z.string().optional(),
});

function toDbNumeric(value: number): string;
function toDbNumeric(value: undefined): undefined;
function toDbNumeric(value: number | undefined): string | undefined;
function toDbNumeric(value: number | undefined) {
  return value === undefined ? undefined : value.toString();
}

export async function createSubsidyClaim(input: unknown) {
  const session = await requirePermission("subsidy:write");
  const data = CreateSubsidyClaimSchema.parse(input);

  const { eligibleSubsidy } = calculatePMSuryaGharSubsidy(
    data.systemSizeKw,
    data.subsidyCategory,
  );

  const [claim] = await db
    .insert(subsidyClaims)
    .values({
      code: generateSubsidyCode(),
      salesOrderId: data.salesOrderId,
      customerId: data.customerId,
      installationId: data.installationId ?? null,
      systemSizeKw: toDbNumeric(data.systemSizeKw),
      subsidyCategory: data.subsidyCategory,
      eligibleSubsidyAmount: toDbNumeric(eligibleSubsidy),
      status: "eligibility_check",
      updatedBy: session.user.id,
    })
    .returning();

  revalidatePath("/dashboard/subsidy");
  return { success: true, claim, eligibleSubsidy };
}

export async function updateSubsidyStatus(id: string, input: unknown) {
  const session = await requirePermission("subsidy:write");
  const data = UpdateSubsidyStatusSchema.parse(input);

  const now = new Date();
  const statusUpdates: {
    discomSubmittedAt?: Date;
    discomApprovedAt?: Date;
    discomRejectedAt?: Date;
    claimSubmittedAt?: Date;
    subsidyReceivedAt?: Date;
    subsidyCreditedToBank?: boolean;
  } = {};

  if (data.status === "discom_submitted") statusUpdates.discomSubmittedAt = now;
  if (data.status === "discom_approved") statusUpdates.discomApprovedAt = now;
  if (data.status === "claim_submitted") statusUpdates.claimSubmittedAt = now;
  if (data.status === "subsidy_received") {
    statusUpdates.subsidyReceivedAt = now;
    statusUpdates.subsidyCreditedToBank = true;
  }
  if (data.status === "rejected") statusUpdates.discomRejectedAt = now;

  const [updated] = await db
    .update(subsidyClaims)
    .set({
      status: data.status,
      ...statusUpdates,
      discomApplicationNumber: data.discomApplicationNumber ?? undefined,
      discomRemarks: data.discomRemarks ?? undefined,
      subsidyReceivedAmount: toDbNumeric(data.subsidyReceivedAmount),
      remarks: data.remarks ?? undefined,
      updatedBy: session.user.id,
      updatedAt: now,
    })
    .where(eq(subsidyClaims.id, id))
    .returning();

  revalidatePath("/dashboard/subsidy");
  return { success: true, claim: updated };
}

export async function uploadSubsidyDocument(
  claimId: string,
  docType:
    | "applicationFormUrl"
    | "aadhaarUrl"
    | "electricityBillUrl"
    | "installationPhotoUrl"
    | "netMeterPhotoUrl",
  url: string,
) {
  await requirePermission("subsidy:write");

  const [updated] = await db
    .update(subsidyClaims)
    .set({ [docType]: url, updatedAt: new Date() })
    .where(eq(subsidyClaims.id, claimId))
    .returning();

  // Check if all required docs uploaded -> auto-advance
  if (
    updated.applicationFormUrl &&
    updated.aadhaarUrl &&
    updated.electricityBillUrl &&
    updated.installationPhotoUrl &&
    updated.status === "eligibility_check"
  ) {
    await db
      .update(subsidyClaims)
      .set({ status: "docs_uploaded", updatedAt: new Date() })
      .where(eq(subsidyClaims.id, claimId));
  }

  revalidatePath("/dashboard/subsidy");
  return { success: true };
}

export async function getSubsidyClaims(opts?: {
  status?: string;
  customerId?: string;
  page?: number;
  pageSize?: number;
}) {
  await requirePermission("subsidy:read");

  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [];
  if (opts?.status) {
    if (!subsidyStatuses.includes(opts.status as SubsidyStatus)) {
      throw new Error(`Invalid subsidy status: ${opts.status}`);
    }
    conditions.push(eq(subsidyClaims.status, opts.status as SubsidyStatus));
  }
  if (opts?.customerId) {
    conditions.push(eq(subsidyClaims.customerId, opts.customerId));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalCount] = await Promise.all([
    db
      .select()
      .from(subsidyClaims)
      .where(where)
      .orderBy(desc(subsidyClaims.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(subsidyClaims).where(where),
  ]);

  const total = totalCount[0]?.count ?? 0;

  return {
    claims: rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getSubsidyStats() {
  await requirePermission("subsidy:read");

  const summary = await db
    .select({ status: subsidyClaims.status, count: count() })
    .from(subsidyClaims)
    .groupBy(subsidyClaims.status);

  return summary;
}
