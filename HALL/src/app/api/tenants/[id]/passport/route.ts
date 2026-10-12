import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tenantPassports, tenants } from "@/db/schema";
import { getCurrentAuth } from "@/lib/auth";
import { generateVerificationCode } from "@/lib/verification";

export const dynamic = "force-dynamic";

/** Issue, rotate or revoke the verifiable tenant passport. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getCurrentAuth();
  if (!auth) return Response.json({ error: "Connexion requise." }, { status: 401 });
  if (!auth.hasAccess) return Response.json({ error: "Abonnement actif requis." }, { status: 402 });

  const { id: rawId } = await context.params;
  const tenantId = Number(rawId);
  if (!Number.isInteger(tenantId) || tenantId < 1) {
    return Response.json({ error: "Locataire introuvable." }, { status: 404 });
  }

  const body: unknown = await request.json().catch(() => null);
  const action =
    body && typeof body === "object" ? (body as { action?: unknown }).action : undefined;

  if (action !== "issue" && action !== "revoke") {
    return Response.json({ error: "Action invalide." }, { status: 400 });
  }

  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(and(eq(tenants.id, tenantId), eq(tenants.agencyId, auth.agencyId)))
    .limit(1);

  if (!tenant) {
    return Response.json({ error: "Locataire introuvable dans votre agence." }, { status: 404 });
  }

  const [existing] = await db
    .select({ id: tenantPassports.id, code: tenantPassports.code, status: tenantPassports.status })
    .from(tenantPassports)
    .where(eq(tenantPassports.tenantId, tenantId))
    .limit(1);

  if (action === "revoke") {
    if (!existing) return Response.json({ error: "Aucun passeport à révoquer." }, { status: 404 });
    const [revoked] = await db
      .update(tenantPassports)
      .set({ status: "revoked" })
      .where(eq(tenantPassports.id, existing.id))
      .returning({ id: tenantPassports.id, status: tenantPassports.status });
    return Response.json(revoked);
  }

  if (existing) {
    // Rotate: a new code invalidates any previously shared link.
    const code = generateVerificationCode("MP");
    const [rotated] = await db
      .update(tenantPassports)
      .set({ code, status: "active", createdAt: new Date() })
      .where(eq(tenantPassports.id, existing.id))
      .returning({ id: tenantPassports.id, code: tenantPassports.code, status: tenantPassports.status });
    return Response.json(rotated);
  }

  const [issued] = await db
    .insert(tenantPassports)
    .values({
      agencyId: auth.agencyId,
      tenantId,
      code: generateVerificationCode("MP"),
    })
    .returning({ id: tenantPassports.id, code: tenantPassports.code, status: tenantPassports.status });

  return Response.json(issued, { status: 201 });
}
