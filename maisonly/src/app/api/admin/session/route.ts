import { createAdminSession, destroyAdminSession } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const code =
    body && typeof body === "object"
      ? (body as { code?: unknown }).code
      : undefined;

  if (typeof code !== "string" || code.length === 0 || code.length > 200) {
    return Response.json({ error: "Code d’accès requis." }, { status: 400 });
  }

  const ok = await createAdminSession(code);
  if (!ok) {
    return Response.json({ error: "Code d’accès incorrect." }, { status: 401 });
  }
  return Response.json({ ok: true });
}

export async function DELETE() {
  await destroyAdminSession();
  return Response.json({ ok: true });
}
