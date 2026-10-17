import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

function isLocalDatabase(url: string) {
  return /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url);
}

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL est manquante. Sur Vercel : onglet Storage → Create Database → Postgres → Connect Project, puis Redeploy.",
  );
}

/**
 * A database copied from a development machine cannot work in production.
 * Failing fast with an explicit message avoids a confusing timeout.
 */
if (process.env.NODE_ENV === "production" && isLocalDatabase(databaseUrl)) {
  console.warn(
    "⚠️  DATABASE_URL pointe vers localhost. Le site n’a pas encore de base de données de production.",
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
