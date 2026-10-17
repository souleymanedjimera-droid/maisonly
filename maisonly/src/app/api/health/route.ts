import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

function isLocalDatabase(url: string | undefined) {
  return !!url && /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url);
}

export async function GET() {
  const configuredUrl = process.env.DATABASE_URL;
  const localDatabase =
    process.env.NODE_ENV === "production" && isLocalDatabase(configuredUrl);

  try {
    await ensureSchema();
    await db.execute(sql`select 1`);
    return Response.json({
      ok: true,
      ...(localDatabase
        ? {
            hint: "Base de développement détectée. Sur Vercel, reliez une base (Storage → Create Database → Postgres) pour que les données soient conservées.",
          }
        : {}),
    });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
