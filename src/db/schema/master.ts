import {
	boolean,
	date,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

// ─── Enums ─────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["admin", "sales", "manager", "hr"]);

export const leadStatusEnum = pgEnum("lead_status", [
	"new",
	"contacted",
	"survey_scheduled",
	"survey_done",
	"quotation_sent",
	"negotiation",
	"won",
	"lost",
]);

export const orderStatusEnum = pgEnum("order_status", [
	"draft",
	"confirmed",
	"in_production",
	"ready_dispatch",
	"dispatched",
	"installed",
	"invoiced",
	"closed",
]);

export const poStatusEnum = pgEnum("po_status", [
	"draft",
	"sent",
	"acknowledged",
	"partial_received",
	"fully_received",
	"cancelled",
]);

export const paymentStatusEnum = pgEnum("payment_status", ["pending", "partial", "paid", "overdue"]);

export const subsidyStatusEnum = pgEnum("subsidy_status", [
	"not_applied",
	"eligibility_check",
	"docs_uploaded",
	"discom_submitted",
	"discom_approved",
	"claim_submitted",
	"subsidy_received",
	"rejected",
]);

export const installationStatusEnum = pgEnum("installation_status", [
	"not_started",
	"in_progress",
	"completed",
	"net_meter_pending",
	"net_meter_done",
]);

export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
	"purchase_receipt",
	"sales_dispatch",
	"transfer",
	"adjustment",
	"return_to_vendor",
	"return_from_customer",
]);

export const gstTypeEnum = pgEnum("gst_type", ["igst", "cgst_sgst"]);

export const voucherTypeEnum = pgEnum("voucher_type", ["payment", "receipt", "journal", "contra"]);

// ─── Users (managed by better-auth) ────────────────────────────────────────

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	role: userRoleEnum("role").notNull().default("sales"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	token: text("token").notNull().unique(),
	expiresAt: timestamp("expires_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	idToken: text("id_token"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
	id: uuid("id").primaryKey().defaultRandom(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Master Data ────────────────────────────────────────────────────────────

export const customers = pgTable("customers", {
	id: uuid("id").primaryKey().defaultRandom(),
	code: varchar("code", { length: 20 }).notNull().unique(),
	name: text("name").notNull(),
	email: text("email"),
	phone: varchar("phone", { length: 15 }),
	alternatPhone: varchar("alternate_phone", { length: 15 }),
	addressLine1: text("address_line1"),
	addressLine2: text("address_line2"),
	city: text("city"),
	state: text("state"),
	pincode: varchar("pincode", { length: 10 }),
	// KYC fields
	aadhaarNumber: varchar("aadhaar_number", { length: 12 }),
	panNumber: varchar("pan_number", { length: 10 }),
	// Electricity data for subsidy
	electricityConsumerNumber: varchar("electricity_consumer_number", { length: 30 }),
	discom: text("discom"),
	sanctionedLoad: numeric("sanctioned_load", { precision: 8, scale: 2 }),
	averageMonthlyBill: numeric("average_monthly_bill", { precision: 10, scale: 2 }),
	// Subsidy eligibility
	categoryType: varchar("category_type", { length: 30 }),
	// Docs
	aadhaarDocUrl: text("aadhaar_doc_url"),
	panDocUrl: text("pan_doc_url"),
	electricityBillUrl: text("electricity_bill_url"),
	isActive: boolean("is_active").notNull().default(true),
	createdBy: uuid("created_by").references(() => users.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const vendors = pgTable("vendors", {
	id: uuid("id").primaryKey().defaultRandom(),
	code: varchar("code", { length: 20 }).notNull().unique(),
	name: text("name").notNull(),
	contactPerson: text("contact_person"),
	email: text("email"),
	phone: varchar("phone", { length: 15 }),
	addressLine1: text("address_line1"),
	city: text("city"),
	state: text("state"),
	pincode: varchar("pincode", { length: 10 }),
	gstin: varchar("gstin", { length: 15 }),
	panNumber: varchar("pan_number", { length: 10 }),
	bankName: text("bank_name"),
	bankAccountNumber: text("bank_account_number"),
	ifscCode: varchar("ifsc_code", { length: 11 }),
	paymentTermsDays: integer("payment_terms_days").default(30),
	isOem: boolean("is_oem").notNull().default(false),
	rating: integer("rating").default(0),
	isActive: boolean("is_active").notNull().default(true),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const itemCategories = pgTable("item_categories", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	description: text("description"),
});

export const items = pgTable("items", {
	id: uuid("id").primaryKey().defaultRandom(),
	code: varchar("code", { length: 30 }).notNull().unique(),
	name: text("name").notNull(),
	description: text("description"),
	categoryId: uuid("category_id").references(() => itemCategories.id),
	unit: varchar("unit", { length: 20 }).notNull().default("pcs"),
	hsnCode: varchar("hsn_code", { length: 10 }),
	gstRate: numeric("gst_rate", { precision: 5, scale: 2 }).notNull().default("18"),
	sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }),
	purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }),
	minStockLevel: numeric("min_stock_level", { precision: 10, scale: 2 }).default("0"),
	isSerialized: boolean("is_serialized").notNull().default(false),
	isBatch: boolean("is_batch").notNull().default(false),
	specifications: jsonb("specifications"),
	isActive: boolean("is_active").notNull().default(true),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const warehouses = pgTable("warehouses", {
	id: uuid("id").primaryKey().defaultRandom(),
	code: varchar("code", { length: 20 }).notNull().unique(),
	name: text("name").notNull(),
	addressLine1: text("address_line1"),
	city: text("city"),
	state: text("state"),
	pincode: varchar("pincode", { length: 10 }),
	isDefault: boolean("is_default").notNull().default(false),
	isActive: boolean("is_active").notNull().default(true),
});

export const employees = pgTable("employees", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id").references(() => users.id),
	code: varchar("code", { length: 20 }).notNull().unique(),
	name: text("name").notNull(),
	designation: text("designation"),
	department: text("department"),
	phone: varchar("phone", { length: 15 }),
	email: text("email"),
	aadhaarNumber: varchar("aadhaar_number", { length: 12 }),
	panNumber: varchar("pan_number", { length: 10 }),
	joiningDate: date("joining_date"),
	salary: numeric("salary", { precision: 12, scale: 2 }),
	isFieldTechnician: boolean("is_field_technician").notNull().default(false),
	isActive: boolean("is_active").notNull().default(true),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Stock ──────────────────────────────────────────────────────────────────

export const stockLedger = pgTable(
	"stock_ledger",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		itemId: uuid("item_id")
			.notNull()
			.references(() => items.id),
		warehouseId: uuid("warehouse_id")
			.notNull()
			.references(() => warehouses.id),
		movementType: stockMovementTypeEnum("movement_type").notNull(),
		quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
		balanceQty: numeric("balance_qty", { precision: 12, scale: 3 }).notNull(),
		referenceType: text("reference_type"),
		referenceId: uuid("reference_id"),
		batchNumber: text("batch_number"),
		serialNumbers: text("serial_numbers").array(),
		unitCost: numeric("unit_cost", { precision: 12, scale: 2 }),
		remarks: text("remarks"),
		createdBy: uuid("created_by").references(() => users.id),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(t) => [index("stock_ledger_item_warehouse_idx").on(t.itemId, t.warehouseId)],
);

export const itemStock = pgTable(
	"item_stock",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		itemId: uuid("item_id")
			.notNull()
			.references(() => items.id),
		warehouseId: uuid("warehouse_id")
			.notNull()
			.references(() => warehouses.id),
		onHandQty: numeric("on_hand_qty", { precision: 12, scale: 3 }).notNull().default("0"),
		reservedQty: numeric("reserved_qty", { precision: 12, scale: 3 }).notNull().default("0"),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(t) => [index("item_stock_unique_idx").on(t.itemId, t.warehouseId)],
);
