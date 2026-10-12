import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { leases, payments } from "@/db/schema";
import { getCurrentAuth } from "@/lib/auth";
import { generateVerificationCode } from "@/lib/verification";

export const dynamic = "force-dynamic";

/** Record a rent payment and issue a verifiable receipt code. */
export async function POST(request: Request) {
  const auth = await getCurrentAuth();
  if (!auth) return Response.json({ error: "Connexion requise." }, { status: 401 });
  if (!auth.hasAccess) return Response.json({ error: "Abonnement actif requis." }, { status: 402 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Vérifiez les informations du loyer." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const leaseId = Number(input.leaseId);
  const period = typeof input.period === "string" ? input.period.trim() : "";

  if (!Number.isInteger(leaseId) || !/^\d{4}-\d{2}$/.test(period)) {
    return Response.json({ error: "Bail ou période invalide." }, { status: 400 });
  }

  const [lease] = await db
    .select({
      id: leases.id,
      monthlyRent: leases.monthlyRent,
      charges: leases.charges,
      paymentDay: leases.paymentDay,
    })
    .from(leases)
    .where(and(eq(leases.id, leaseId), eq(leases.agencyId, auth.agencyId)))
    .limit(1);

  if (!lease) {
    return Response.json({ error: "Bail introuvable dans votre agence." }, { status: 404 });
  }

  const existing = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.leaseId, leaseId), eq(payments.period, period)))
    .limit(1);

  if (existing.length > 0) {
    return Response.json({ error: "Un loyer existe déjà pour cette période." }, { status: 409 });
  }

  const dueDate = `${period}-${String(lease.paymentDay).padStart(2, "0")}`;
  const [created] = await db
    .insert(payments)
    .values({
      agencyId: auth.agencyId,
      leaseId,
      period,
      amount: lease.monthlyRent,
      dueDate,
      status: "paid",
      paidAt: new Date(),
      receiptCode: generateVerificationCode("QT"),
    })
    .returning({
      id: payments.id,
      period: payments.period,
      amount: payments.amount,
      dueDate: payments.dueDate,
      status: payments.status,
      receiptCode: payments.receiptCode,
    });

  return Response.json(created, { status: 201 });
}
