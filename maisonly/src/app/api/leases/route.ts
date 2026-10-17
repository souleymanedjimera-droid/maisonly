import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { leases, payments, properties, tenants } from "@/db/schema";
import { getCurrentAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getCurrentAuth();
  if (!auth) return Response.json({ error: "Connexion requise." }, { status: 401 });
  if (!auth.hasAccess) return Response.json({ error: "Abonnement actif requis." }, { status: 402 });

  const rows = await db
    .select()
    .from(leases)
    .where(eq(leases.agencyId, auth.agencyId))
    .orderBy(asc(leases.id));
  return Response.json(rows);
}

function periodOf(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function POST(request: Request) {
  const auth = await getCurrentAuth();
  if (!auth) return Response.json({ error: "Connexion requise." }, { status: 401 });
  if (!auth.hasAccess) return Response.json({ error: "Abonnement actif requis." }, { status: 402 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Vérifiez les informations du bail." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const propertyId = Number(input.propertyId);
  const tenantId = Number(input.tenantId);
  const monthlyRent = Number(input.monthlyRent);
  const charges = Number(input.charges ?? 0);
  const caution = Number(input.caution ?? 0);
  const paymentDay = Number(input.paymentDay ?? 5);
  const startDate = typeof input.startDate === "string" ? input.startDate : "";
  const endDate = typeof input.endDate === "string" ? input.endDate : "";
  const cautionPaid = input.cautionPaid === true;

  const isoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (
    !Number.isInteger(propertyId) ||
    !Number.isInteger(tenantId) ||
    !Number.isInteger(monthlyRent) ||
    monthlyRent <= 0 ||
    !Number.isInteger(charges) ||
    charges < 0 ||
    !Number.isInteger(caution) ||
    caution < 0 ||
    !Number.isInteger(paymentDay) ||
    paymentDay < 1 ||
    paymentDay > 28 ||
    !isoDate(startDate) ||
    !isoDate(endDate) ||
    endDate <= startDate
  ) {
    return Response.json(
      { error: "Vérifiez le bien, le locataire, le loyer et les dates du bail." },
      { status: 400 },
    );
  }

  const [property] = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, propertyId), eq(properties.agencyId, auth.agencyId)))
    .limit(1);
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(and(eq(tenants.id, tenantId), eq(tenants.agencyId, auth.agencyId)))
    .limit(1);

  if (!property || !tenant) {
    return Response.json({ error: "Bien ou locataire introuvable dans votre agence." }, { status: 404 });
  }

  const created = await db.transaction(async (tx) => {
    const [lease] = await tx
      .insert(leases)
      .values({
        agencyId: auth.agencyId,
        propertyId,
        tenantId,
        monthlyRent,
        charges,
        caution,
        cautionPaid,
        paymentDay,
        startDate,
        endDate,
        status: "active",
      })
      .returning();

    // Generate the first rent schedule entry so the lease is payable immediately.
    const start = new Date(`${startDate}T12:00:00`);
    const dueDate = `${periodOf(start)}-${String(paymentDay).padStart(2, "0")}`;
    await tx.insert(payments).values({
      agencyId: auth.agencyId,
      leaseId: lease.id,
      period: periodOf(start),
      amount: monthlyRent,
      dueDate,
      status: "pending",
    });

    await tx
      .update(properties)
      .set({ status: "occupied" })
      .where(and(eq(properties.id, propertyId), eq(properties.agencyId, auth.agencyId)));

    return {
      id: lease.id,
      propertyId: lease.propertyId,
      tenantId: lease.tenantId,
      monthlyRent: lease.monthlyRent,
      charges: lease.charges,
      caution: lease.caution,
      cautionPaid: lease.cautionPaid,
      paymentDay: lease.paymentDay,
      startDate: lease.startDate,
      endDate: lease.endDate,
      status: lease.status,
    };
  });

  return Response.json(created, { status: 201 });
}
