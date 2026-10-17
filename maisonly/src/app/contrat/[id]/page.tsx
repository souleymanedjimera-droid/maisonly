import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { agencies, leases, properties, tenants } from "@/db/schema";
import { getCurrentAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

function money(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
}
function longDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    .format(new Date(`${value}T12:00:00`));
}

export default async function ContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await getCurrentAuth();
  if (!auth) redirect("/login");
  if (!auth.hasAccess) redirect("/billing");

  const { id: rawId } = await params;
  const leaseId = Number(rawId);
  if (!Number.isInteger(leaseId)) redirect("/");

  const [contract] = await db
    .select({
      lease: leases,
      property: properties,
      tenant: tenants,
    })
    .from(leases)
    .innerJoin(properties, eq(leases.propertyId, properties.id))
    .innerJoin(tenants, eq(leases.tenantId, tenants.id))
    .where(and(eq(leases.id, leaseId), eq(leases.agencyId, auth.agencyId)))
    .limit(1);

  if (!contract) redirect("/");

  const totalMonthly = contract.lease.monthlyRent + contract.lease.charges;

  return (
    <main className="contract-sheet">
      <header className="contract-head">
        <div>
          <span className="contract-brand">maisonly</span>
          <strong>{auth.agencyName}</strong>
          <small>{auth.agencyCity} · Sénégal</small>
        </div>
        <div className="contract-meta">
          <span>CONTRAT DE BAIL D’HABITATION</span>
          <b>Référence {String(contract.lease.id).padStart(6, "0")}</b>
        </div>
      </header>

      <h1 className="contract-title">Contrat de location</h1>
      <p className="contract-lead">
        Le présent contrat est conclu entre les parties désignées ci-dessous, conformément à la
        loi n° 2009-11 du 20 mai 2009 régissant les baux d’habitation au Sénégal.
      </p>

      <section className="contract-party">
        <h2>Le bailleur / mandataire</h2>
        <dl>
          <div><dt>Agence</dt><dd>{auth.agencyName}</dd></div>
          <div><dt>Représenté par</dt><dd>{auth.userName}</dd></div>
          <div><dt>Ville</dt><dd>{auth.agencyCity}</dd></div>
          <div><dt>Adresse e-mail</dt><dd>{auth.userEmail}</dd></div>
        </dl>
      </section>

      <section className="contract-party">
        <h2>Le locataire</h2>
        <dl>
          <div><dt>Nom</dt><dd>{contract.tenant.fullName}</dd></div>
          <div><dt>Téléphone</dt><dd>{contract.tenant.phone}</dd></div>
          <div><dt>E-mail</dt><dd>{contract.tenant.email}</dd></div>
          {contract.tenant.profession && <div><dt>Profession</dt><dd>{contract.tenant.profession}</dd></div>}
          {contract.tenant.idNumber && <div><dt>Pièce d’identité</dt><dd>{contract.tenant.idNumber}</dd></div>}
        </dl>
      </section>

      <section className="contract-party">
        <h2>Le logement loué</h2>
        <dl>
          <div><dt>Désignation</dt><dd>{contract.property.name}</dd></div>
          <div><dt>Adresse</dt><dd>{contract.property.address}, {contract.property.city}</dd></div>
          <div><dt>Consistance</dt><dd>{contract.property.rooms} pièce(s) · {contract.property.surface} m²</dd></div>
          <div><dt>Destination</dt><dd>Habitation exclusivement</dd></div>
        </dl>
      </section>

      <section className="contract-party">
        <h2>Conditions financières</h2>
        <dl>
          <div><dt>Loyer mensuel</dt><dd>{money(contract.lease.monthlyRent)}</dd></div>
          <div><dt>Charges mensuelles</dt><dd>{contract.lease.charges ? money(contract.lease.charges) : "Néant"}</dd></div>
          <div><dt>Total mensuel</dt><dd className="contract-strong">{money(totalMonthly)}</dd></div>
          <div><dt>Caution</dt><dd>{contract.lease.caution ? money(contract.lease.caution) : "Néant"}</dd></div>
          <div><dt>Paiement</dt><dd>Au plus tard le {contract.lease.paymentDay} de chaque mois</dd></div>
        </dl>
      </section>

      <section className="contract-party">
        <h2>Durée</h2>
        <p className="contract-duration">
          Le présent bail court du <b>{longDate(contract.lease.startDate)}</b> au{" "}
          <b>{longDate(contract.lease.endDate)}</b>, soit une durée de trois (03) ans renouvelable
          par tacite reconduction, sauf dénonciation par l’une des parties avec un préavis d’un (01) mois.
        </p>
      </section>

      <ol className="contract-clauses">
        <li>Le locataire prend le logement dans l’état où il se trouve et s’engage à le restituer en bon état.</li>
        <li>Le loyer et les charges sont payables d’avance, au plus tard le {contract.lease.paymentDay} de chaque mois.</li>
        <li>Tout retard de paiement ouvre droit à des pénalités et peut entraîner la résiliation du bail.</li>
        <li>La caution reste acquise au bailleur en cas de loyers impayés, déduction faite des dégradations constatées.</li>
        <li>Le locataire ne peut sous-louer ni modifier le logement sans accord écrit du bailleur.</li>
        <li>Les réparations locatives mineures sont à la charge du locataire ; les grosses réparations restent au bailleur.</li>
      </ol>

      <div className="contract-signatures">
        <div>
          <span>Pour le bailleur</span>
          <div className="contract-sign-line" />
          <small>{auth.agencyName}</small>
        </div>
        <div>
          <span>Le locataire</span>
          <div className="contract-sign-line" />
          <small>{contract.tenant.fullName}</small>
        </div>
      </div>

      <footer className="contract-foot">
        <span>Fait à {auth.agencyCity}, le {longDate(new Date().toISOString().slice(0, 10))}, en deux exemplaires.</span>
        <span>Généré par maisonly · document à imprimer et signer</span>
      </footer>
    </main>
  );
}
