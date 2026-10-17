import { asc, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  leases,
  maintenanceRequests,
  payments,
  properties,
  tenantPassports,
  tenants,
} from "@/db/schema";
import { getCurrentAuth } from "@/lib/auth";
import Dashboard from "@/components/dashboard";
import LandingPage from "@/components/landing-page";
import { ensureSchema } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureSchema();
  const auth = await getCurrentAuth();
  if (!auth) return <LandingPage />;
  if (!auth.hasAccess) redirect("/billing");

  const [propertyRows, tenantRows, leaseRows, paymentRows, maintenanceRows, passportRows] =
    await Promise.all([
      db
        .select({
          id: properties.id,
          name: properties.name,
          type: properties.type,
          address: properties.address,
          city: properties.city,
          postalCode: properties.postalCode,
          surface: properties.surface,
          rooms: properties.rooms,
          monthlyRent: properties.monthlyRent,
          status: properties.status,
        })
        .from(properties)
        .where(eq(properties.agencyId, auth.agencyId))
        .orderBy(asc(properties.id)),
      db
        .select({
          id: tenants.id,
          fullName: tenants.fullName,
          email: tenants.email,
          phone: tenants.phone,
          profession: tenants.profession,
          idNumber: tenants.idNumber,
        })
        .from(tenants)
        .where(eq(tenants.agencyId, auth.agencyId))
        .orderBy(asc(tenants.fullName)),
      db
        .select({
          id: leases.id,
          propertyId: leases.propertyId,
          tenantId: leases.tenantId,
          monthlyRent: leases.monthlyRent,
          charges: leases.charges,
          caution: leases.caution,
          cautionPaid: leases.cautionPaid,
          paymentDay: leases.paymentDay,
          startDate: leases.startDate,
          endDate: leases.endDate,
          status: leases.status,
        })
        .from(leases)
        .where(eq(leases.agencyId, auth.agencyId))
        .orderBy(asc(leases.id)),
      db
        .select({
          id: payments.id,
          leaseId: payments.leaseId,
          period: payments.period,
          amount: payments.amount,
          dueDate: payments.dueDate,
          status: payments.status,
          paidAt: payments.paidAt,
          receiptCode: payments.receiptCode,
        })
        .from(payments)
        .where(eq(payments.agencyId, auth.agencyId))
        .orderBy(desc(payments.period), desc(payments.id)),
      db
        .select({
          id: maintenanceRequests.id,
          propertyId: maintenanceRequests.propertyId,
          title: maintenanceRequests.title,
          detail: maintenanceRequests.detail,
          priority: maintenanceRequests.priority,
          status: maintenanceRequests.status,
          reportedAt: maintenanceRequests.reportedAt,
        })
        .from(maintenanceRequests)
        .where(eq(maintenanceRequests.agencyId, auth.agencyId))
        .orderBy(desc(maintenanceRequests.reportedAt), desc(maintenanceRequests.id)),
      db
        .select({
          tenantId: tenantPassports.tenantId,
          code: tenantPassports.code,
          status: tenantPassports.status,
          checkCount: tenantPassports.checkCount,
        })
        .from(tenantPassports)
        .where(eq(tenantPassports.agencyId, auth.agencyId)),
    ]);

  return (
    <Dashboard
      agencyName={auth.agencyName}
      userName={auth.userName}
      initialData={{
        properties: propertyRows,
        tenants: tenantRows,
        leases: leaseRows,
        payments: paymentRows,
        maintenance: maintenanceRows,
      }}
      passports={passportRows}
    />
  );
}
