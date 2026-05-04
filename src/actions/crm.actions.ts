"use server";

import { and, count, desc, eq, type SQL, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import db from "@/db/index";
import { customers, leads, siteSurveys, tasks } from "@/db/schema/index";
import { requireAuth, requirePermission } from "@/lib/auth/rbac";
import { generateCustomerCode, generateLeadCode } from "@/lib/utlis/helpers";
import {
  type CreateLeadInput,
  CreateLeadSchema,
  CreateSiteSurveySchema,
  CreateTaskSchema,
  type leadStatusValues,
  type UpdateLeadInput,
  UpdateLeadSchema,
} from "@/schema/crm.schema";

type LeadStatus = (typeof leadStatusValues)[number];

function toDbNumeric(value: number | undefined) {
  return value === undefined ? undefined : value.toString();
}

// ─── Lead Actions ─────────────────────────────────────────────────────────────

export async function createLead(input: CreateLeadInput) {
  const session = await requirePermission("crm:write");
  const data = CreateLeadSchema.parse(input);
  const { roofArea, systemSizeKw, monthlyBill, ...leadData } = data;

  const [lead] = await db
    .insert(leads)
    .values({
      ...leadData,
      roofArea: toDbNumeric(roofArea),
      systemSizeKw: toDbNumeric(systemSizeKw),
      monthlyBill: toDbNumeric(monthlyBill),
      code: generateLeadCode(),
      createdBy: session.user.id,
    })
    .returning();

  revalidatePath("/dashboard/crm");
  return { success: true, lead };
}

export async function updateLead(id: string, input: UpdateLeadInput) {
  await requirePermission("crm:write");
  const data = UpdateLeadSchema.parse(input);
  const { roofArea, systemSizeKw, monthlyBill, ...leadData } = data;

  const [updated] = await db
    .update(leads)
    .set({
      ...leadData,
      roofArea: toDbNumeric(roofArea),
      systemSizeKw: toDbNumeric(systemSizeKw),
      monthlyBill: toDbNumeric(monthlyBill),
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id))
    .returning();

  // If status is "won", auto-create customer
  if (data.status === "won") {
    const lead = updated;
    if (lead && !lead.customerId) {
      const [customer] = await db
        .insert(customers)
        .values({
          code: generateCustomerCode(),
          name: lead.name,
          phone: lead.phone ?? undefined,
          email: lead.email ?? undefined,
          city: lead.city ?? undefined,
          state: lead.state ?? undefined,
          pincode: lead.pincode ?? undefined,
        })
        .returning();

      await db
        .update(leads)
        .set({ customerId: customer.id, convertedAt: new Date() })
        .where(eq(leads.id, id));
    }
  }

  revalidatePath("/dashboard/crm");
  revalidatePath(`/dashboard/crm/${id}`);
  return { success: true, lead: updated };
}

export async function deleteLead(id: string) {
  await requirePermission("crm:delete");
  await db.delete(leads).where(eq(leads.id, id));
  revalidatePath("/dashboard/crm");
  return { success: true };
}

export async function getLeads(opts?: {
  status?: LeadStatus;
  assignedTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  await requirePermission("crm:read");

  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [];
  if (opts?.status) conditions.push(eq(leads.status, opts.status));
  if (opts?.assignedTo) conditions.push(eq(leads.assignedTo, opts.assignedTo));
  if (opts?.search) {
    conditions.push(
      sql`(${leads.name} ilike ${`%${opts.search}%`} OR ${leads.phone} ilike ${`%${opts.search}%`})`,
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalCount] = await Promise.all([
    db
      .select()
      .from(leads)
      .where(where)
      .orderBy(desc(leads.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(leads).where(where),
  ]);

  return {
    leads: rows,
    total: totalCount[0]?.count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((totalCount[0]?.count ?? 0) / pageSize),
  };
}

export async function getLeadById(id: string) {
  await requirePermission("crm:read");
  const [lead] = await db.select().from(leads).where(eq(leads.id, id));
  return lead ?? null;
}

export async function getPipelineSummary() {
  await requirePermission("crm:read");

  const summary = await db
    .select({
      status: leads.status,
      count: count(),
    })
    .from(leads)
    .groupBy(leads.status);

  return summary;
}

// ─── Site Survey Actions ──────────────────────────────────────────────────────

export async function createSiteSurvey(input: unknown) {
  await requirePermission("crm:write");
  const data = CreateSiteSurveySchema.parse(input);
  const { scheduledDate, roofArea, recommendedSystemKw, ...surveyData } = data;

  const [survey] = await db
    .insert(siteSurveys)
    .values({
      ...surveyData,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      roofArea: toDbNumeric(roofArea),
      recommendedSystemKw: toDbNumeric(recommendedSystemKw),
    })
    .returning();

  // Move lead to survey_scheduled
  await db
    .update(leads)
    .set({ status: "survey_scheduled", updatedAt: new Date() })
    .where(eq(leads.id, data.leadId));

  revalidatePath("/dashboard/crm");
  return { success: true, survey };
}

export async function completeSiteSurvey(
  surveyId: string,
  data: {
    conductedDate?: string;
    roofCondition?: string;
    recommendedSystemKw?: number;
    remarks?: string;
    photos?: string[];
  },
) {
  await requirePermission("crm:write");
  const { conductedDate, recommendedSystemKw, ...surveyData } = data;

  const [survey] = await db
    .update(siteSurveys)
    .set({
      ...surveyData,
      recommendedSystemKw: toDbNumeric(recommendedSystemKw),
      conductedDate: conductedDate ? new Date(conductedDate) : new Date(),
      isCompleted: true,
    })
    .where(eq(siteSurveys.id, surveyId))
    .returning();

  if (survey) {
    await db
      .update(leads)
      .set({ status: "survey_done", updatedAt: new Date() })
      .where(eq(leads.id, survey.leadId));
  }

  revalidatePath("/dashboard/crm");
  return { success: true, survey };
}

// ─── Task Actions ─────────────────────────────────────────────────────────────

export async function createTask(input: unknown) {
  const session = await requirePermission("crm:write");
  const data = CreateTaskSchema.parse(input);

  const [task] = await db
    .insert(tasks)
    .values({
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      createdBy: session.user.id,
    })
    .returning();

  revalidatePath("/dashboard/crm");
  return { success: true, task };
}

export async function completeTask(taskId: string) {
  await requirePermission("crm:write");

  const [task] = await db
    .update(tasks)
    .set({ isCompleted: true, completedAt: new Date() })
    .where(eq(tasks.id, taskId))
    .returning();

  revalidatePath("/dashboard/crm");
  return { success: true, task };
}

export async function getMyTasks() {
  const session = await requireAuth();

  return db
    .select()
    .from(tasks)
    .where(
      and(eq(tasks.assignedTo, session.user.id), eq(tasks.isCompleted, false)),
    )
    .orderBy(tasks.dueDate);
}
