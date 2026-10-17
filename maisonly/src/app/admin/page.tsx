import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { agencies, paymentSubmissions, subscriptions, users } from "@/db/schema";
import AdminConsole, { AdminLogin, type AdminPayment } from "@/components/admin-console";
import { isAdmin, isAdminConfigured, isAdminUsingDefaultCode } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return <AdminLogin configured={isAdminConfigured()} usingFallback={isAdminUsingDefaultCode()} />;
  }

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
      createdAt: paymentSubmissions.createdAt,
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
    .orderBy(desc(paymentSubmissions.createdAt), desc(paymentSubmissions.id))
    .limit(100);

  const [totals] = await db
    .select({
      pending: sql<number>`count(*) filter (where ${paymentSubmissions.status} = 'pending')::int`,
      approved: sql<number>`count(*) filter (where ${paymentSubmissions.status} = 'approved')::int`,
      revenue: sql<number>`coalesce(sum(${paymentSubmissions.amountFcfa}) filter (where ${paymentSubmissions.status} = 'approved'), 0)::int`,
    })
    .from(paymentSubmissions);

  const payments: AdminPayment[] = rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    currentPeriodEnd: row.currentPeriodEnd ? row.currentPeriodEnd.toISOString() : null,
  }));

  return (
    <AdminConsole
      payments={payments}
      totals={totals ?? { pending: 0, approved: 0, revenue: 0 }}
    />
  );
}
