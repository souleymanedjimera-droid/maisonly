import "server-only";

import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Idempotent schema creation. This lets the application provision its own
 * database on first run, so publishing never requires a manual CLI step.
 * Safe to call repeatedly: every statement uses IF NOT EXISTS.
 */
async function runMigration() {
  const enums = [
    ["property_status", ["occupied", "vacant", "maintenance"]],
    ["property_type", ["apartment", "house", "studio", "commercial"]],
    ["lease_status", ["active", "ending", "ended"]],
    ["payment_status", ["paid", "pending", "late"]],
    ["maintenance_status", ["open", "in_progress", "resolved"]],
    ["maintenance_priority", ["low", "normal", "high"]],
    ["payment_operator", ["wave", "orange_money", "free_money"]],
    ["payment_review_status", ["pending", "approved", "rejected"]],
    ["verification_status", ["active", "revoked"]],
  ] as const;

  for (const [name, values] of enums) {
    const labels = values.map((value) => `'${value}'`).join(", ");
    await db.execute(
      sql.raw(
        `DO $$ BEGIN
           IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${name}') THEN
             CREATE TYPE ${name} AS ENUM (${labels});
           END IF;
         END $$;`,
      ),
    );
  }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS agencies (
      id serial PRIMARY KEY,
      name varchar(180) NOT NULL,
      city varchar(120) NOT NULL DEFAULT 'Dakar',
      contact_phone varchar(30) NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id serial PRIMARY KEY,
      agency_id integer NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
      name varchar(160) NOT NULL,
      email varchar(254) NOT NULL UNIQUE,
      password_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id serial PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash varchar(64) NOT NULL UNIQUE,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS subscriptions (
      agency_id integer PRIMARY KEY REFERENCES agencies(id) ON DELETE CASCADE,
      status varchar(24) NOT NULL DEFAULT 'pending',
      price_fcfa integer NOT NULL DEFAULT 25000,
      current_period_end timestamptz,
      approved_payment_count integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS payment_submissions (
      id serial PRIMARY KEY,
      agency_id integer NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
      operator payment_operator NOT NULL,
      reference varchar(80) NOT NULL,
      payer_phone varchar(30) NOT NULL,
      amount_fcfa integer NOT NULL,
      months integer NOT NULL DEFAULT 1,
      note text NOT NULL DEFAULT '',
      status payment_review_status NOT NULL DEFAULT 'pending',
      reviewer_note text NOT NULL DEFAULT '',
      reviewed_at timestamptz,
      reviewed_by varchar(80),
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS payment_submission_operator_reference
      ON payment_submissions (operator, reference)
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS properties (
      id serial PRIMARY KEY,
      agency_id integer NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
      name varchar(160) NOT NULL,
      type property_type NOT NULL DEFAULT 'apartment',
      address varchar(240) NOT NULL,
      city varchar(120) NOT NULL,
      postal_code varchar(12) NOT NULL DEFAULT '',
      surface integer NOT NULL,
      rooms integer NOT NULL,
      monthly_rent integer NOT NULL DEFAULT 0,
      status property_status NOT NULL DEFAULT 'vacant',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS tenants (
      id serial PRIMARY KEY,
      agency_id integer NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
      full_name varchar(160) NOT NULL,
      email varchar(180) NOT NULL,
      phone varchar(30) NOT NULL,
      profession varchar(120) NOT NULL DEFAULT '',
      id_number varchar(60) NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS leases (
      id serial PRIMARY KEY,
      agency_id integer NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
      property_id integer NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      tenant_id integer NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      monthly_rent integer NOT NULL,
      charges integer NOT NULL DEFAULT 0,
      caution integer NOT NULL DEFAULT 0,
      caution_paid boolean NOT NULL DEFAULT false,
      payment_day integer NOT NULL DEFAULT 5,
      start_date date NOT NULL,
      end_date date NOT NULL,
      status lease_status NOT NULL DEFAULT 'active'
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS payments (
      id serial PRIMARY KEY,
      agency_id integer NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
      lease_id integer NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
      period varchar(7) NOT NULL,
      amount integer NOT NULL,
      due_date date NOT NULL,
      status payment_status NOT NULL DEFAULT 'pending',
      paid_at timestamptz,
      receipt_code varchar(20) NOT NULL DEFAULT ''
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS maintenance_requests (
      id serial PRIMARY KEY,
      agency_id integer NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
      property_id integer NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      title varchar(180) NOT NULL,
      detail text NOT NULL DEFAULT '',
      priority maintenance_priority NOT NULL DEFAULT 'normal',
      status maintenance_status NOT NULL DEFAULT 'open',
      reported_at date NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS tenant_passports (
      id serial PRIMARY KEY,
      agency_id integer NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
      tenant_id integer NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      code varchar(20) NOT NULL UNIQUE,
      status verification_status NOT NULL DEFAULT 'active',
      check_count integer NOT NULL DEFAULT 0,
      last_checked_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

const globalForSchema = globalThis as typeof globalThis & {
  __maisonlySchemaReady?: Promise<void>;
};

/** Run the self-migration once per server process, then reuse the result. */
export function ensureSchema() {
  globalForSchema.__maisonlySchemaReady ??= runMigration().catch((error) => {
    globalForSchema.__maisonlySchemaReady = undefined;
    throw error;
  });
  return globalForSchema.__maisonlySchemaReady;
}
