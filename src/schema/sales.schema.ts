import { z } from "zod";

export const QuotationLineItemSchema = z.object({
  itemId: z.string().uuid().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().default("pcs"),
  unitPrice: z.number().nonnegative(),
  gstRate: z.number().min(0).max(28).default(12),
  hsnCode: z.string().optional(),
  amount: z.number().nonnegative(),
  gstAmount: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

export const CreateQuotationSchema = z.object({
  leadId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  systemSizeKw: z.number().min(0.5).max(500),
  panelWatts: z.number().int().positive().default(440),
  panelQuantity: z.number().int().positive(),
  inverterKw: z.number().positive(),
  batteryKwh: z.number().nonnegative().optional(),
  lineItems: z.array(QuotationLineItemSchema).min(1),
  subtotal: z.number().nonnegative(),
  gstAmount: z.number().nonnegative(),
  totalAmount: z.number().nonnegative(),
  subsidyAmount: z.number().nonnegative().default(0),
  netAmount: z.number().nonnegative(),
  validUntil: z.string().date().optional(),
  terms: z.string().max(2000).optional(),
  notes: z.string().max(1000).optional(),
});

export const CreateSalesOrderSchema = z.object({
  quotationId: z.string().uuid().optional(),
  customerId: z.string().uuid(),
  systemSizeKw: z.number().min(0.5).max(500),
  lineItems: z.array(QuotationLineItemSchema).min(1),
  subtotal: z.number().nonnegative(),
  gstAmount: z.number().nonnegative(),
  totalAmount: z.number().nonnegative(),
  subsidyAmount: z.number().nonnegative().default(0),
  netAmount: z.number().nonnegative(),
  advancePaid: z.number().nonnegative().default(0),
  expectedDelivery: z.string().date().optional(),
  terms: z.string().max(2000).optional(),
});

export type CreateQuotationInput = z.infer<typeof CreateQuotationSchema>;
export type CreateSalesOrderInput = z.infer<typeof CreateSalesOrderSchema>;
export type QuotationLineItem = z.infer<typeof QuotationLineItemSchema>;