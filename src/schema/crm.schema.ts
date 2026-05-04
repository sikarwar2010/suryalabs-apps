import { z } from "zod";

export const leadStatusValues = [
  "new",
  "contacted",
  "survey_scheduled",
  "survey_done",
  "quotation_sent",
  "negotiation",
  "won",
  "lost",
] as const;

export const CreateLeadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter valid 10-digit Indian mobile number"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  city: z.string().min(2).max(100).optional(),
  state: z.string().default("Rajasthan"),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Enter valid 6-digit pincode")
    .optional()
    .or(z.literal("")),
  source: z
    .enum(["direct", "referral", "digital", "exhibition", "govt_camp", "other"])
    .default("direct"),
  roofType: z
    .enum(["flat_rcc", "sloped_metal", "sloped_asbestos", "other"])
    .optional(),
  roofArea: z.number().positive().optional(),
  systemSizeKw: z.number().min(0.5).max(500).optional(),
  monthlyBill: z.number().positive().optional(),
  notes: z.string().max(1000).optional(),
  assignedTo: z.string().uuid().optional(),
});

export const UpdateLeadSchema = CreateLeadSchema.partial().extend({
  status: z.enum(leadStatusValues).optional(),
  lostReason: z.string().max(500).optional(),
});

export const CreateSiteSurveySchema = z.object({
  leadId: z.string().uuid(),
  scheduledDate: z.string().datetime().optional(),
  conductedBy: z.string().uuid().optional(),
  roofType: z.string().optional(),
  roofArea: z.number().positive().optional(),
  roofCondition: z.enum(["excellent", "good", "fair", "poor"]).optional(),
  shadingAnalysis: z.string().max(500).optional(),
  electricalPanelCapacity: z.string().optional(),
  recommendedSystemKw: z.number().min(0.5).max(500).optional(),
  remarks: z.string().max(1000).optional(),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  relatedType: z
    .enum(["lead", "customer", "sales_order", "installation"])
    .optional(),
  relatedId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
});

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;
export type CreateSiteSurveyInput = z.infer<typeof CreateSiteSurveySchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
