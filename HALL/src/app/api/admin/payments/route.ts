import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { agencies, paymentSubmissions, subscriptions, users } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { PAYMENT_OPERATORS } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const operators = PAYMENT_OPERATORS.map((operator) => operator.id);

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Accès réservé à l’exploitant." }, { status: 401 });
  }

  const statusParam = new URL(request.url).searchParams.get("status");
  const filter =
    statusParam && operators.includes(statusParam as (typeof operators)[number])
      ? null
      : statusParam && ["pending", "approved", "rejected"].includes(statusParam)
        ? (statusParam as "pending" | "approved" | "rejected")
        : null;

  const rows = await db
    .select({
      id: paymentSubmissions.id,
      operator: paymentSubmissions.operator,
      reference: paymentSubmissions.reference,
      payerPhone: paymentSubmissions.payerPhone,
      amountFcfa: paymentSubmissions.amountFcfa,
      months: paymentSubmissions.months,
      note: paymentSubmissions.note,
      status: paymentSubmissions.status,
      reviewerNote: paymentSubmissions.reviewerNote,
      reviewedAt: paymentSubmissions.reviewedAt,
      createdAt: paymentSubmissions.createdAt,
      agencyId: agencies.id,
      agencyName: agencies.name,
      agencyCity: agencies.city,
      ownerName: users.name,
      ownerEmail: users.email,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
    })
    .from(paymentSubmissions)
    .innerJoin(agencies, eq(paymentSubmissions.agencyId, agencies.id))
    .innerJoin(users, eq(users.agencyId, agencies.id))
    .leftJoin(subscriptions, eq(subscriptions.agencyId, agencies.id))
    .where(filter ? and(eq(paymentSubmissions.status, filter)) : undefined)
    .orderBy(desc(paymentSubmissions.createdAt), desc(paymentSubmissions.id))
    .limit(100);

  const [totals] = await db
    .select({
      pending: sql<number>`count(*) filter (where ${paymentSubmissions.status} = 'pending')`,
      approved: sql<number>`count(*) filter (where ${paymentSubmissions.status} = 'approved')`,
      revenue: sql<number>`coalesce(sum(${paymentSubmissions.amountFcfa}) filter (where ${paymentSubmissions.status} = 'approved'), 0)`,
    })
    .from(paymentSubmissions);

  return Response.json({ payments: rows, totals });
}
