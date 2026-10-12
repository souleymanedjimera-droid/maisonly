import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const propertyStatusEnum = pgEnum("property_status", [
  "occupied",
  "vacant",
  "maintenance",
]);
export const propertyTypeEnum = pgEnum("property_type", [
  "apartment",
  "house",
  "studio",
  "commercial",
]);
export const leaseStatusEnum = pgEnum("lease_status", [
  "active",
  "ending",
  "ended",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "paid",
  "pending",
  "late",
]);
export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "open",
  "in_progress",
  "resolved",
]);
export const maintenancePriorityEnum = pgEnum("maintenance_priority", [
  "low",
  "normal",
  "high",
]);
export const paymentOperatorEnum = pgEnum("payment_operator", [
  "wave",
  "orange_money",
  "free_money",
]);
export const paymentReviewStatusEnum = pgEnum("payment_review_status", [
  "pending",
  "approved",
  "rejected",
]);

export const agencies = pgTable("agencies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  city: varchar("city", { length: 120 }).notNull().default("Dakar"),
  contactPhone: varchar("contact_phone", { length: 30 }).notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id")
    .notNull()
    .references(() => agencies.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  agencyId: integer("agency_id")
    .primaryKey()
    .references(() => agencies.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 24 }).notNull().default("pending"),
  priceFcfa: integer("price_fcfa").notNull().default(25000),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  approvedPaymentCount: integer("approved_payment_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentSubmissions = pgTable(
  "payment_submissions",
  {
    id: serial("id").primaryKey(),
    agencyId: integer("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    operator: paymentOperatorEnum("operator").notNull(),
    reference: varchar("reference", { length: 80 }).notNull(),
    payerPhone: varchar("payer_phone", { length: 30 }).notNull(),
    amountFcfa: integer("amount_fcfa").notNull(),
    months: integer("months").notNull().default(1),
    note: text("note").notNull().default(""),
    status: paymentReviewStatusEnum("status").notNull().default("pending"),
    reviewerNote: text("reviewer_note").notNull().default(""),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: varchar("reviewed_by", { length: 80 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("payment_submission_operator_reference").on(
      table.operator,
      table.reference,
    ),
  ],
);

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id")
    .notNull()
    .references(() => agencies.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  type: propertyTypeEnum("type").notNull().default("apartment"),
  address: varchar("address", { length: 240 }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  postalCode: varchar("postal_code", { length: 12 }).notNull().default(""),
  surface: integer("surface").notNull(),
  rooms: integer("rooms").notNull(),
  monthlyRent: integer("monthly_rent").notNull().default(0),
  status: propertyStatusEnum("status").notNull().default("vacant"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id")
    .notNull()
    .references(() => agencies.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 160 }).notNull(),
  email: varchar("email", { length: 180 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  profession: varchar("profession", { length: 120 }).notNull().default(""),
  idNumber: varchar("id_number", { length: 60 }).notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leases = pgTable("leases", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id")
    .notNull()
    .references(() => agencies.id, { onDelete: "cascade" }),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  monthlyRent: integer("monthly_rent").notNull(),
  charges: integer("charges").notNull().default(0),
  caution: integer("caution").notNull().default(0),
  cautionPaid: boolean("caution_paid").notNull().default(false),
  paymentDay: integer("payment_day").notNull().default(5),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: leaseStatusEnum("status").notNull().default("active"),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id")
    .notNull()
    .references(() => agencies.id, { onDelete: "cascade" }),
  leaseId: integer("lease_id")
    .notNull()
    .references(() => leases.id, { onDelete: "cascade" }),
  period: varchar("period", { length: 7 }).notNull(),
  amount: integer("amount").notNull(),
  dueDate: date("due_date").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  receiptCode: varchar("receipt_code", { length: 20 }).notNull().default(""),
});

export const verificationStatusEnum = pgEnum("verification_status", [
  "active",
  "revoked",
]);

/**
 * Tenant passport: a shareable, revocable code that lets any other agency or
 * landlord confirm a rental history without trusting a printed reference.
 */
export const tenantPassports = pgTable("tenant_passports", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id")
    .notNull()
    .references(() => agencies.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 20 }).notNull().unique(),
  status: verificationStatusEnum("status").notNull().default("active"),
  checkCount: integer("check_count").notNull().default(0),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const maintenanceRequests = pgTable("maintenance_requests", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id")
    .notNull()
    .references(() => agencies.id, { onDelete: "cascade" }),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  detail: text("detail").notNull().default(""),
  priority: maintenancePriorityEnum("priority").notNull().default("normal"),
  status: maintenanceStatusEnum("status").notNull().default("open"),
  reportedAt: date("reported_at").notNull(),
});
