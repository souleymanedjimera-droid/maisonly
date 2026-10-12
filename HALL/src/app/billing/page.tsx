import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { paymentSubmissions } from "@/db/schema";
import BillingPage from "@/components/billing-page";
import { getCurrentAuth } from "@/lib/auth";
import { paymentNumbers, type PaymentOperatorId } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function AgencyBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ declared?: string }>;
}) {
  const auth = await getCurrentAuth();
  if (!auth) redirect("/login");

  const params = await searchParams;
  const rows = await db
    .select({
      id: paymentSubmissions.id,
      operator: paymentSubmissions.operator,
      reference: paymentSubmissions.reference,
      payerPhone: paymentSubmissions.payerPhone,
      amountFcfa: paymentSubmissions.amountFcfa,
      months: paymentSubmissions.months,
      status: paymentSubmissions.status,
      reviewerNote: paymentSubmissions.reviewerNote,
      createdAt: paymentSubmissions.createdAt,
      reviewedAt: paymentSubmissions.reviewedAt,
    })
    .from(paymentSubmissions)
    .where(eq(paymentSubmissions.agencyId, auth.agencyId))
    .orderBy(desc(paymentSubmissions.createdAt), desc(paymentSubmissions.id))
    .limit(20);

  const effectiveStatus =
    auth.subscription.status === "active" && !auth.hasAccess ? "expired" : auth.subscription.status;

  return (
    <BillingPage
      agencyName={auth.agencyName}
      userName={auth.userName}
      email={auth.userEmail}
      status={effectiveStatus}
      priceFcfa={auth.subscription.priceFcfa}
      currentPeriodEnd={auth.subscription.currentPeriodEnd?.toISOString() ?? null}
      hasAccess={auth.hasAccess}
      paymentNumbers={paymentNumbers() as Record<PaymentOperatorId, string>}
      submissions={rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
        reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
      }))}
      justSubmitted={params.declared === "1"}
    />
  );
}
