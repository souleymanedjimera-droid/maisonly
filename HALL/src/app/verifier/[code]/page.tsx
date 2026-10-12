import Link from "next/link";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  agencies,
  leases,
  payments,
  properties,
  tenantPassports,
  tenants,
} from "@/db/schema";
import { passportGrade, type PassportHistoryEntry } from "@/lib/verification";

export const dynamic = "force-dynamic";

function money(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export default async function VerificationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = decodeURIComponent(rawCode).trim().toUpperCase();

  // ---- Tenant passport -------------------------------------------------------
  const [passport] = await db
    .select({
      id: tenantPassports.id,
      status: tenantPassports.status,
      createdAt: tenantPassports.createdAt,
      tenantId: tenants.id,
      tenantName: tenants.fullName,
      tenantProfession: tenants.profession,
      agencyId: agencies.id,
      agencyName: agencies.name,
      agencyCity: agencies.city,
    })
    .from(tenantPassports)
    .innerJoin(tenants, eq(tenantPassports.tenantId, tenants.id))
    .innerJoin(agencies, eq(tenantPassports.agencyId, agencies.id))
    .where(eq(tenantPassports.code, code))
    .limit(1);

  if (passport) {
    await db
      .update(tenantPassports)
      .set({ checkCount: sql`${tenantPassports.checkCount} + 1`, lastCheckedAt: new Date() })
      .where(eq(tenantPassports.id, passport.id));

    if (passport.status !== "active") {
      return (
        <Shell code={code}>
          <Revoked />
        </Shell>
      );
    }

    const leaseRows = await db
      .select({
        id: leases.id,
        monthlyRent: leases.monthlyRent,
        startDate: leases.startDate,
        endDate: leases.endDate,
        propertyName: properties.name,
        propertyCity: properties.city,
      })
      .from(leases)
      .innerJoin(properties, eq(leases.propertyId, properties.id))
      .where(and(eq(leases.tenantId, passport.tenantId), eq(leases.agencyId, passport.agencyId)))
      .orderBy(leases.startDate);

    const paymentRows = await db
      .select({ leaseId: payments.leaseId, status: payments.status, amount: payments.amount })
      .from(payments)
      .innerJoin(leases, eq(payments.leaseId, leases.id))
      .where(and(eq(leases.tenantId, passport.tenantId), eq(leases.agencyId, passport.agencyId)));

    const history: PassportHistoryEntry[] = leaseRows.map((lease) => {
      const own = paymentRows.filter((payment) => payment.leaseId === lease.id);
      return {
        property: lease.propertyName,
        city: lease.propertyCity,
        from: lease.startDate,
        to: lease.endDate,
        rent: lease.monthlyRent,
        paidMonths: own.filter((payment) => payment.status === "paid").length,
        lateMonths: own.filter((payment) => payment.status === "late").length,
      };
    });

    const totalPaid = history.reduce((total, entry) => total + entry.paidMonths * entry.rent, 0);
    const onTimePayments = history.reduce((total, entry) => total + entry.paidMonths, 0);
    const latePayments = history.reduce((total, entry) => total + entry.lateMonths, 0);
    const rate = onTimePayments + latePayments > 0
      ? Math.round((onTimePayments / (onTimePayments + latePayments)) * 100)
      : 0;
    const grade = passportGrade(rate);

    return (
      <Shell code={code}>
        <p className="vf-eyebrow">PASSEPORT LOCATAIRE VÉRIFIÉ</p>
        <h1 className="vf-name">{passport.tenantName}</h1>
        {passport.tenantProfession && <p className="vf-sub">{passport.tenantProfession}</p>}

        <div className={`vf-grade vf-grade--${grade.tone}`}>
          <span>{grade.label}</span>
          <b>{rate}% à l’heure</b>
        </div>

        <div className="vf-stats">
          <div><span>Loyers payés</span><strong>{onTimePayments}</strong></div>
          <div><span>Retards</span><strong>{latePayments}</strong></div>
          <div><span>Total réglé</span><strong>{money(totalPaid)}</strong></div>
        </div>

        {history.length > 0 && (
          <section className="vf-section">
            <h2>Historique de location</h2>
            {history.map((entry) => (
              <article className="vf-history" key={`${entry.property}-${entry.from}`}>
                <div>
                  <strong>{entry.property}</strong>
                  <small>{entry.city} · {formatDate(entry.from)} → {formatDate(entry.to)}</small>
                </div>
                <div className="vf-history-right">
                  <b>{money(entry.rent)}/mois</b>
                  <small>{entry.paidMonths} payés{entry.lateMonths > 0 ? ` · ${entry.lateMonths} retard(s)` : ""}</small>
                </div>
              </article>
            ))}
          </section>
        )}

        <footer className="vf-agency">
          <span>Attesté par</span>
          <strong>{passport.agencyName}</strong>
          <small>{passport.agencyCity} · passeport émis le {formatDate(passport.createdAt.toISOString().slice(0, 10))}</small>
        </footer>
      </Shell>
    );
  }

  // ---- Rent receipt ---------------------------------------------------------
  const [receipt] = await db
    .select({
      status: payments.status,
      period: payments.period,
      amount: payments.amount,
      dueDate: payments.dueDate,
      paidAt: payments.paidAt,
      tenantName: tenants.fullName,
      propertyName: properties.name,
      propertyAddress: properties.address,
      propertyCity: properties.city,
      agencyName: agencies.name,
      agencyCity: agencies.city,
    })
    .from(payments)
    .innerJoin(leases, eq(payments.leaseId, leases.id))
    .innerJoin(tenants, eq(leases.tenantId, tenants.id))
    .innerJoin(properties, eq(leases.propertyId, properties.id))
    .innerJoin(agencies, eq(payments.agencyId, agencies.id))
    .where(and(eq(payments.receiptCode, code)))
    .limit(1);

  if (receipt) {
    const paid = receipt.status === "paid";
    const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" })
      .format(new Date(`${receipt.period}-01T12:00:00`));

    return (
      <Shell code={code}>
        <p className="vf-eyebrow">QUITTANCE DE LOYER</p>
        <h1 className="vf-name">{paid ? "Paiement authentique" : "Paiement non réglé"}</h1>
        <p className="vf-sub">Période de {monthLabel}</p>
        <div className={`vf-grade vf-grade--${paid ? "excellent" : "risk"}`}>
          <span>{paid ? "Validé par l’agence" : "Aucun encaissement constaté"}</span>
          <b>{money(receipt.amount)}</b>
        </div>
        <dl className="vf-receipt">
          <div><dt>Locataire</dt><dd>{receipt.tenantName}</dd></div>
          <div><dt>Logement</dt><dd>{receipt.propertyName}, {receipt.propertyAddress} · {receipt.propertyCity}</dd></div>
          <div><dt>Échéance</dt><dd>{formatDate(receipt.dueDate)}</dd></div>
          {receipt.paidAt && <div><dt>Encaissé le</dt><dd>{formatDate(receipt.paidAt.toISOString().slice(0, 10))}</dd></div>}
        </dl>
        <footer className="vf-agency">
          <span>Émise par</span>
          <strong>{receipt.agencyName}</strong>
          <small>{receipt.agencyCity}</small>
        </footer>
      </Shell>
    );
  }

  return (
    <Shell code={code}>
      <div className="vf-unknown">
        <span>?</span>
        <h1>Code introuvable</h1>
        <p>Aucune quittance ni passeport locataire ne correspond au code <b>{code}</b>.</p>
        <p className="vf-hint">Vérifiez la saisie ou demandez un nouveau code à l’agence.</p>
      </div>
    </Shell>
  );
}

function Shell({ code, children }: { code: string; children: React.ReactNode }) {
  return (
    <main className="vf-shell">
      <header className="vf-header">
        <Link className="vf-brand" href="/"><span className="brand-mark"><i /><i /><i /><i /></span><b>maisonly</b></Link>
        <span className="vf-code">Code {code}</span>
      </header>
      <section className="vf-card">{children}</section>
      <footer className="vf-footer">
        <Link href="/verifier">Vérifier un autre code</Link>
        <span>© {new Date().getFullYear()} maisonly · Sénégal</span>
      </footer>
    </main>
  );
}

function Revoked() {
  return (
    <div className="vf-unknown">
      <span>⌀</span>
      <h1>Passeport révoqué</h1>
      <p>Ce passeport locataire a été retiré par l’agence émettrice. Il ne peut plus être utilisé comme référence.</p>
    </div>
  );
}
