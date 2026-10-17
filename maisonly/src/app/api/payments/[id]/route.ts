import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { getCurrentAuth } from "@/lib/auth";
import { generateVerificationCode } from "@/lib/verification";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getCurrentAuth();
  if (!auth) return Response.json({ error: "Connexion requise." }, { status: 401 });
  if (!auth.hasAccess) return Response.json({ error: "Abonnement actif requis." }, { status: 402 });

  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) {
    return Response.json({ error: "Loyer introuvable." }, { status: 404 });
  }

  const [existing] = await db
    .select({ receiptCode: payments.receiptCode })
    .from(payments)
    .where(and(eq(payments.id, id), eq(payments.agencyId, auth.agencyId)))
    .limit(1);

  if (!existing) {
    return Response.json({ error: "Loyer introuvable." }, { status: 404 });
  }

  const [updated] = await db
    .update(payments)
    .set({
      status: "paid",
      paidAt: new Date(),
      receiptCode: existing.receiptCode || generateVerificationCode("QT"),
    })
    .where(and(eq(payments.id, id), eq(payments.agencyId, auth.agencyId)))
    .returning({
      id: payments.id,
      status: payments.status,
      paidAt: payments.paidAt,
      receiptCode: payments.receiptCode,
    });

  return Response.json(updated);
}
