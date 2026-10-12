import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { paymentSubmissions, subscriptions } from "@/db/schema";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Accès réservé à l’exploitant." }, { status: 401 });
  }

  const { id: rawId } = await context.params;
  const id = Number(rawId);
  const body: unknown = await request.json().catch(() => null);
  const action =
    body && typeof body === "object" ? (body as { action?: unknown }).action : undefined;
  const reviewerNote =
    body && typeof body === "object" && typeof (body as { note?: unknown }).note === "string"
      ? ((body as { note: string }).note ?? "").slice(0, 500)
      : "";

  if (!Number.isInteger(id) || id < 1 || (action !== "approve" && action !== "reject")) {
    return Response.json({ error: "Décision invalide." }, { status: 400 });
  }

  const [submission] = await db
    .select()
    .from(paymentSubmissions)
    .where(eq(paymentSubmissions.id, id))
    .limit(1);

  if (!submission) {
    return Response.json({ error: "Paiement introuvable." }, { status: 404 });
  }
  if (submission.status !== "pending") {
    return Response.json({ error: "Ce paiement a déjà été traité." }, { status: 409 });
  }

  if (action === "reject") {
    const [rejected] = await db
      .update(paymentSubmissions)
      .set({
        status: "rejected",
        reviewerNote,
        reviewedAt: new Date(),
        reviewedBy: "maisonly",
      })
      .where(eq(paymentSubmissions.id, id))
      .returning({ id: paymentSubmissions.id, status: paymentSubmissions.status });
    return Response.json(rejected);
  }

  const [subscription] = await db
    .select({
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      approvedPaymentCount: subscriptions.approvedPaymentCount,
    })
    .from(subscriptions)
    .where(eq(subscriptions.agencyId, submission.agencyId))
    .limit(1);

  if (!subscription) {
    return Response.json({ error: "Abonnement d’agence introuvable." }, { status: 404 });
  }

  const now = new Date();
  const base =
    subscription.currentPeriodEnd && subscription.currentPeriodEnd.getTime() > now.getTime()
      ? subscription.currentPeriodEnd
      : now;
  const newPeriodEnd = new Date(base);
  newPeriodEnd.setMonth(newPeriodEnd.getMonth() + submission.months);

  const [approved] = await db.transaction(async (tx) => {
    const [updatedPayment] = await tx
      .update(paymentSubmissions)
      .set({
        status: "approved",
        reviewerNote,
        reviewedAt: now,
        reviewedBy: "maisonly",
      })
      .where(eq(paymentSubmissions.id, id))
      .returning({ id: paymentSubmissions.id, status: paymentSubmissions.status });

    await tx
      .update(subscriptions)
      .set({
        status: "active",
        currentPeriodEnd: newPeriodEnd,
        approvedPaymentCount: sql`${subscriptions.approvedPaymentCount} + 1`,
        updatedAt: now,
      })
      .where(eq(subscriptions.agencyId, submission.agencyId));

    return [updatedPayment];
  });

  return Response.json({ ...approved, currentPeriodEnd: newPeriodEnd });
}
