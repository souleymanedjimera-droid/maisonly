import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createUserSession, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Adresse e-mail ou mot de passe incorrect." }, { status: 401 });
  }

  const input = body as Record<string, unknown>;
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";

  if (!email || email.length > 254 || !password || password.length > 128) {
    return Response.json({ error: "Adresse e-mail ou mot de passe incorrect." }, { status: 401 });
  }

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return Response.json({ error: "Adresse e-mail ou mot de passe incorrect." }, { status: 401 });
  }

  await createUserSession(user.id);
  return Response.json({ ok: true, next: "/" });
}
