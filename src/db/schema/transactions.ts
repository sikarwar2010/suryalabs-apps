import {
	boolean,
	date,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import type { QuotationLineItem } from "@/schema/sales.schema";
import {
	customers,
	employees,
	gstTypeEnum,
	installationStatusEnum,
	leadStatusEnum,
	orderStatusEnum,
	paymentStatusEnum,
	poStatusEnum,
	subsidyStatusEnum,
	users,
	vendors,
	voucherTypeEnum,
	warehouses,
} from "./master";

// ─── CRM Module ─────────────────────────────────────────────────────────────

export const leads = pgTable(
	"leads",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		code: varchar("code", { length: 20 }).notNull().unique(),
		name: text("name").notNull(),
		phone: varchar("phone", { length: 15 }).notNull(),
		email: text("email"),
		city: text("city"),
		state: text("state").default("Rajasthan"),
		pincode: varchar("pincode", { length: 10 }),
		// Lead details
		roofType: text("roof_type"),
		roofArea: numeric("roof_area", { precision: 8, scale: 2 }),
		systemSizeKw: numeric("system_size_kw", { precision: 6, scale: 2 }),
		monthlyBill: numeric("monthly_bill", { precision: 10, scale: 2 }),
		status: leadStatusEnum("status").notNull().default("new"),
		source: text("source").default("direct"),
		lostReason: text("lost_reason"),
		notes: text("notes"),
		// Assignment
		assignedTo: uuid("assigned_to").references(() => users.id),
		customerId: uuid("customer_id").references(() => customers.id),
		convertedAt: timestamp("converted_at"),
		createdBy: uuid("created_by").references(() => users.id),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(t) => [index("leads_status_idx").on(t.status), index("leads_assigned_idx").on(t.assignedTo)],
);

export const siteSurveys = pgTable("site_surveys", {
	id: uuid("id").primaryKey().defaultRandom(),
	leadId: uuid("lead_id")
		.notNull()
		.references(() => leads.id),
	scheduledDate: timestamp("scheduled_date"),
	conductedDate: timestamp("conducted_date"),
	conductedBy: uuid("conducted_by").references(() => employees.id),
	roofType: text("roof_type"),
	roofArea: numeric("roof_area", { precision: 8, scale: 2 }),
	roofCondition: text("roof_condition"),
	shadingAnalysis: text("shading_analysis"),
	electricalPanelCapacity: text("electrical_panel_capacity"),
	recommendedSystemKw: numeric("recommended_system_kw", { precision: 6, scale: 2 }),
	photos: text("photos").array(),
	remarks: text("remarks"),
	isCompleted: boolean("is_completed").notNull().default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
	id: uuid("id").primaryKey().defaultRandom(),
	title: text("title").notNull(),
	description: text("description"),
	dueDate: timestamp("due_date"),
	isCompleted: boolean("is_completed").notNull().default(false),
	priority: text("priority").default("medium"),
	relatedType: text("related_type"),
	relatedId: uuid("related_id"),
	assignedTo: uuid("assigned_to").references(() => users.id),
	createdBy: uuid("created_by").references(() => users.id),
	completedAt: timestamp("completed_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Sales Module ────────────────────────────────────────────────────────────

export const quotations = pgTable("quotations", {
	id: uuid("id").primaryKey().defaultRandom(),
	code: varchar("code", { length: 20 }).notNull().unique(),
	leadId: uuid("lead_id").references(() => leads.id),
	customerId: uuid("customer_id").references(() => customers.id),
	// System configuration
	systemSizeKw: numeric("system_size_kw", { precision: 6, scale: 2 }).notNull(),
	panelWatts: integer("panel_watts"),
	panelQuantity: integer("panel_quantity"),
	inverterKw: numeric("inverter_kw", { precision: 6, scale: 2 }),
	batteryKwh: numeric("battery_kwh", { precision: 6, scale: 2 }),
	// Pricing
	subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
	gstAmount: numeric("gst_amount", { precision: 14, scale: 2 }).notNull(),
	totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull(),
	subsidyAmount: numeric("subsidy_amount", { precision: 14, scale: 2 }).default("0"),
	netAmount: numeric("net_amount", { precision: 14, scale: 2 }).notNull(),
	// Line items stored as JSONB
	lineItems: jsonb("line_items").notNull().$type<QuotationLineItem[]>(),
	// Meta
	validUntil: date("valid_until"),
	terms: text("terms"),
	notes: text("notes"),
	status: text("status").notNull().default("draft"),
	version: integer("version").notNull().default(1),
	createdBy: uuid("created_by").references(() => users.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const salesOrders = pgTable(
	"sales_orders",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		code: varchar("code", { length: 20 }).notNull().unique(),
		quotationId: uuid("quotation_id").references(() => quotations.id),
		customerId: uuid("customer_id")
			.notNull()
			.references(() => customers.id),
		systemSizeKw: numeric("system_size_kw", { precision: 6, scale: 2 }).notNull(),
		subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
		gstAmount: numeric("gst_amount", { precision: 14, scale: 2 }).notNull(),
		totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull(),
		subsidyAmount: numeric("subsidy_amount", { precision: 14, scale: 2 }).default("0"),
		netAmount: numeric("net_amount", { precision: 14, scale: 2 }).notNull(),
		advancePaid: numeric("advance_paid", { precision: 14, scale: 2 }).default("0"),
		lineItems: jsonb("line_items").notNull(),
		status: orderStatusEnum("status").notNull().default("confirmed"),
		expectedDelivery: date("expected_delivery"),
		terms: text("terms"),
		createdBy: uuid("created_by").references(() => users.id),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(t) => [index("sales_orders_customer_idx").on(t.customerId), index("sales_orders_status_idx").on(t.status)],
);

// ─── Purchase Module ─────────────────────────────────────────────────────────

export const rfqs = pgTable("rfqs", {
	id: uuid("id").primaryKey().defaultRandom(),
	code: varchar("code", { length: 20 }).notNull().unique(),
	vendorId: uuid("vendor_id")
		.notNull()
		.references(() => vendors.id),
	lineItems: jsonb("line_items").notNull(),
	requestedDate: date("requested_date"),
	responseDate: date("response_date"),
	status: text("status").notNull().default("sent"),
	notes: text("notes"),
	createdBy: uuid("created_by").references(() => users.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const purchaseOrders = pgTable("purchase_orders", {
	id: uuid("id").primaryKey().defaultRandom(),
	code: varchar("code", { length: 20 }).notNull().unique(),
	rfqId: uuid("rfq_id").references(() => rfqs.id),
	vendorId: uuid("vendor_id")
		.notNull()
		.references(() => vendors.id),
	warehouseId: uuid("warehouse_id").references(() => warehouses.id),
	lineItems: jsonb("line_items").notNull(),
	subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
	gstAmount: numeric("gst_amount", { precision: 14, scale: 2 }).notNull(),
	totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull(),
	status: poStatusEnum("status").notNull().default("draft"),
	expectedDelivery: date("expected_delivery"),
	terms: text("terms"),
	approvedBy: uuid("approved_by").references(() => users.id),
	approvedAt: timestamp("approved_at"),
	createdBy: uuid("created_by").references(() => users.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const goodsReceiptNotes = pgTable("goods_receipt_notes", {
	id: uuid("id").primaryKey().defaultRandom(),
	code: varchar("code", { length: 20 }).notNull().unique(),
	purchaseOrderId: uuid("purchase_order_id")
		.notNull()
		.references(() => purchaseOrders.id),
	warehouseId: uuid("warehouse_id")
		.notNull()
		.references(() => warehouses.id),
	lineItems: jsonb("line_items").notNull(),
	receivedDate: timestamp("received_date").notNull().defaultNow(),
	vehicleNumber: text("vehicle_number"),
	driverName: text("driver_name"),
	qualityCheckStatus: text("quality_check_status").default("pending"),
	qualityCheckNotes: text("quality_check_notes"),
	attachmentUrls: text("attachment_urls").array(),
	createdBy: uuid("created_by").references(() => users.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vendorInvoices = pgTable("vendor_invoices", {
	id: uuid("id").primaryKey().defaultRandom(),
	code: varchar("code", { length: 20 }).notNull().unique(),
	vendorId: uuid("vendor_id")
		.notNull()
		.references(() => vendors.id),
	purchaseOrderId: uuid("purchase_order_id").references(() => purchaseOrders.id),
	grnId: uuid("grn_id").references(() => goodsReceiptNotes.id),
	vendorInvoiceNumber: text("vendor_invoice_number"),
	invoiceDate: date("invoice_date").notNull(),
	subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
	gstAmount: numeric("gst_amount", { precision: 14, scale: 2 }).notNull(),
	totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull(),
	paidAmount: numeric("paid_amount", { precision: 14, scale: 2 }).default("0"),
	paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
	dueDate: date("due_date"),
	attachmentUrl: text("attachment_url"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Delivery & Installation ─────────────────────────────────────────────────

export const deliveries = pgTable("deliveries", {
	id: uuid("id").primaryKey().defaultRandom(),
	code: varchar("code", { length: 20 }).notNull().unique(),
	salesOrderId: uuid("sales_order_id")
		.notNull()
		.references(() => salesOrders.id),
	warehouseId: uuid("warehouse_id")
		.notNull()
		.references(() => warehouses.id),
	lineItems: jsonb("line_items").notNull(),
	scheduledDate: timestamp("scheduled_date"),
	dispatchedAt: timestamp("dispatched_at"),
	vehicleNumber: text("vehicle_number"),
	driverName: text("driver_name"),
	status: text("status").notNull().default("planned"),
	createdBy: uuid("created_by").references(() => users.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const installations = pgTable("installations", {
	id: uuid("id").primaryKey().defaultRandom(),
	code: varchar("code", { length: 20 }).notNull().unique(),
	salesOrderId: uuid("sales_order_id")
		.notNull()
		.references(() => salesOrders.id),
	customerId: uuid("customer_id")
		.notNull()
		.references(() => customers.id),
	deliveryId: uuid("delivery_id").references(() => deliveries.id),
	leadTechnicianId: uuid("lead_technician_id").references(() => employees.id),
	teamMemberIds: uuid("team_member_ids").array(),
	scheduledDate: date("scheduled_date"),
	startedAt: timestamp("started_at"),
	completedAt: timestamp("completed_at"),
	status: installationStatusEnum("status").notNull().default("not_started"),
	systemSizeKw: numeric("system_size_kw", { precision: 6, scale: 2 }),
	panelsInstalled: integer("panels_installed"),
	inverterSerial: text("inverter_serial"),
	panelSerials: text("panel_serials").array(),
	commissioningReport: text("commissioning_report"),
	photos: text("photos").array(),
	// Net metering
	netMeterApplicationDate: date("net_meter_application_date"),
	netMeterApprovalDate: date("net_meter_approval_date"),
	netMeterNumber: text("net_meter_number"),
	customerSignatureUrl: text("customer_signature_url"),
	remarks: text("remarks"),
	createdBy: uuid("created_by").references(() => users.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Sales Invoices (Customer-facing) ────────────────────────────────────────

export const salesInvoices = pgTable("sales_invoices", {
	id: uuid("id").primaryKey().defaultRandom(),
	code: varchar("code", { length: 20 }).notNull().unique(),
	salesOrderId: uuid("sales_order_id")
		.notNull()
		.references(() => salesOrders.id),
	customerId: uuid("customer_id")
		.notNull()
		.references(() => customers.id),
	installationId: uuid("installation_id").references(() => installations.id),
	invoiceDate: date("invoice_date").notNull(),
	dueDate: date("due_date"),
	lineItems: jsonb("line_items").notNull(),
	subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
	gstType: gstTypeEnum("gst_type").notNull().default("cgst_sgst"),
	cgst: numeric("cgst", { precision: 14, scale: 2 }).default("0"),
	sgst: numeric("sgst", { precision: 14, scale: 2 }).default("0"),
	igst: numeric("igst", { precision: 14, scale: 2 }).default("0"),
	totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull(),
	subsidyDeducted: numeric("subsidy_deducted", { precision: 14, scale: 2 }).default("0"),
	netPayable: numeric("net_payable", { precision: 14, scale: 2 }).notNull(),
	paidAmount: numeric("paid_amount", { precision: 14, scale: 2 }).default("0"),
	paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
	terms: text("terms"),
	irn: text("irn"),
	eInvoiceUrl: text("e_invoice_url"),
	createdBy: uuid("created_by").references(() => users.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const payments = pgTable(
	"payments",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		code: varchar("code", { length: 20 }).notNull().unique(),
		amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
		paymentDate: date("payment_date").notNull(),
		mode: text("mode").notNull(),
		referenceNumber: text("reference_number"),
		bankName: text("bank_name"),
		// Reference
		partyType: text("party_type").notNull(),
		partyId: uuid("party_id").notNull(),
		invoiceId: uuid("invoice_id"),
		notes: text("notes"),
		attachmentUrl: text("attachment_url"),
		createdBy: uuid("created_by").references(() => users.id),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(t) => [index("payments_party_idx").on(t.partyType, t.partyId)],
);

export const voucherEntries = pgTable("voucher_entries", {
	id: uuid("id").primaryKey().defaultRandom(),
	code: varchar("code", { length: 20 }).notNull().unique(),
	voucherType: voucherTypeEnum("voucher_type").notNull(),
	voucherDate: date("voucher_date").notNull(),
	narration: text("narration"),
	referenceId: uuid("reference_id"),
	referenceType: text("reference_type"),
	ledgerEntries: jsonb("ledger_entries").notNull(),
	totalDebit: numeric("total_debit", { precision: 14, scale: 2 }).notNull(),
	totalCredit: numeric("total_credit", { precision: 14, scale: 2 }).notNull(),
	createdBy: uuid("created_by").references(() => users.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Subsidy Module ───────────────────────────────────────────────────────────

export const subsidyClaims = pgTable(
	"subsidy_claims",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		code: varchar("code", { length: 20 }).notNull().unique(),
		salesOrderId: uuid("sales_order_id")
			.notNull()
			.references(() => salesOrders.id),
		customerId: uuid("customer_id")
			.notNull()
			.references(() => customers.id),
		installationId: uuid("installation_id").references(() => installations.id),
		systemSizeKw: numeric("system_size_kw", { precision: 6, scale: 2 }).notNull(),
		subsidyCategory: text("subsidy_category"),
		eligibleSubsidyAmount: numeric("eligible_subsidy_amount", { precision: 14, scale: 2 }),
		status: subsidyStatusEnum("status").notNull().default("not_applied"),
		// Documents
		applicationFormUrl: text("application_form_url"),
		aadhaarUrl: text("aadhaar_url"),
		electricityBillUrl: text("electricity_bill_url"),
		installationPhotoUrl: text("installation_photo_url"),
		netMeterPhotoUrl: text("net_meter_photo_url"),
		// DISCOM tracking
		discomApplicationNumber: text("discom_application_number"),
		discomSubmittedAt: timestamp("discom_submitted_at"),
		discomApprovedAt: timestamp("discom_approved_at"),
		discomRejectedAt: timestamp("discom_rejected_at"),
		discomRemarks: text("discom_remarks"),
		// Claim
		claimSubmittedAt: timestamp("claim_submitted_at"),
		subsidyReceivedAt: timestamp("subsidy_received_at"),
		subsidyReceivedAmount: numeric("subsidy_received_amount", { precision: 14, scale: 2 }),
		subsidyCreditedToBank: boolean("subsidy_credited_to_bank").default(false),
		remarks: text("remarks"),
		updatedBy: uuid("updated_by").references(() => users.id),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(t) => [index("subsidy_status_idx").on(t.status)],
);
