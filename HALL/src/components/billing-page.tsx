"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AVAILABLE_MONTHS,
  MONTHLY_PRICE_FCFA,
  OPERATOR_LABELS,
  formatFcfa,
  type PaymentOperatorId,
} from "@/lib/pricing";

type Submission = {
  id: number;
  operator: PaymentOperatorId;
  reference: string;
  payerPhone: string;
  amountFcfa: number;
  months: number;
  status: "pending" | "approved" | "rejected";
  reviewerNote: string;
  createdAt: string;
  reviewedAt: string | null;
};

type BillingPageProps = {
  agencyName: string;
  userName: string;
  email: string;
  status: string;
  priceFcfa: number;
  currentPeriodEnd: string | null;
  hasAccess: boolean;
  paymentNumbers: Record<PaymentOperatorId, string>;
  submissions: Submission[];
  justSubmitted: boolean;
};

const statusCopy: Record<string, { label: string; detail: string }> = {
  active: { label: "Abonnement actif", detail: "Votre agence a accès à tout l’espace de gestion." },
  pending: {
    label: "Validation en cours",
    detail: "Nous vérifions votre paiement mobile money. L’accès est ouvert dès validation.",
  },
  expired: {
    label: "Abonnement expiré",
    detail: "Envoyez un nouveau paiement pour continuer votre gestion immobilière.",
  },
};

export default function BillingPage({
  agencyName,
  userName,
  email,
  status,
  priceFcfa,
  currentPeriodEnd,
  hasAccess,
  paymentNumbers,
  submissions,
  justSubmitted,
}: BillingPageProps) {
  const [operator, setOperator] = useState<PaymentOperatorId>("wave");
  const [months, setMonths] = useState<number>(1);
  const [reference, setReference] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(justSubmitted ? "Votre paiement a bien été déclaré." : "");

  const expectedAmount = MONTHLY_PRICE_FCFA * months;
  const activeOperatorNumber = paymentNumbers[operator];
  const badge = statusCopy[status] ?? statusCopy.pending;

  const history = useMemo(
    () =>
      submissions.map((submission) => ({
        ...submission,
        submittedLabel: new Intl.DateTimeFormat("fr-FR", {
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(submission.createdAt)),
      })),
    [submissions],
  );

  async function submitPayment() {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/billing/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operator,
          months,
          amountFcfa: expectedAmount,
          reference,
          payerPhone,
          note,
        }),
      });
      const result = (await response.json()) as { error?: string; status?: string };
      if (!response.ok) throw new Error(result.error ?? "L’envoi a échoué.");
      setSuccess("Paiement reçu. Nous le validons dès maintenant, vous serez notifié ici.");
      setReference("");
      setNote("");
      window.location.reload();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Une erreur est survenue.");
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/");
  }

  return (
    <main className="billing-shell">
      <header className="billing-header">
        <Link href="/" className="billing-brand"><span className="brand-mark"><i /><i /><i /><i /></span><b>maisonly</b></Link>
        <div className="billing-header-account"><span className="billing-account-avatar">{userName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}</span><span><b>{agencyName}</b><small>{email}</small></span><button type="button" onClick={logout}>Déconnexion</button></div>
      </header>
      <div className="billing-main">
        <Link className="billing-back" href={hasAccess ? "/" : "/billing"}><span>←</span> {hasAccess ? "Retour à mon espace" : "Mon espace abonnement"}</Link>
        <div className="billing-heading">
          <div className="billing-lockup"><span>ESPACE AGENCE · SÉNÉGAL</span><span className={`billing-status billing-status--${hasAccess ? "active" : "pending"}`}><i />{badge.label}</span></div>
          <h1>Payer par <em>Wave</em> ou Orange&nbsp;Money</h1>
          <p>{badge.detail}</p>
        </div>
        <div className="billing-grid">
          <section className="billing-plan-card">
            <div className="billing-plan-top"><div><span>MAISONLY ESSENTIELLE</span><h2>Abonnement mensuel</h2></div><span className="billing-plan-icon">⌂</span></div>
            <div className="billing-price"><strong>{formatFcfa(priceFcfa)}</strong><span>par mois<br />par agence</span></div>
            {hasAccess && currentPeriodEnd && <p className="billing-plan-note">Accès garanti jusqu’au {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(currentPeriodEnd))}.</p>}
            <div className="billing-rule" />
            <p className="billing-includes-title">COMMENT PAYER</p>
            <ol className="mm-steps">
              <li><i>1</i><span>Choisissez votre opérateur et envoyez le montant au numéro maisonly.</span></li>
              <li><i>2</i><span>Copiez l’identifiant de transaction reçu par SMS.</span></li>
              <li><i>3</i><span>Déclarez-le ci-dessous : nous validons et votre espace s’ouvre.</span></li>
            </ol>
            <div className="mm-operators" role="group" aria-label="Opérateur de paiement">
              {AVAILABLE_MONTHS.length > 0 && (Object.keys(paymentNumbers) as PaymentOperatorId[]).map((id) => (
                <button key={id} type="button" className={`mm-operator ${operator === id ? "mm-operator--selected" : ""}`} onClick={() => setOperator(id)} aria-pressed={operator === id}>
                  <span>{OPERATOR_LABELS[id]}</span>
                  <small>{paymentNumbers[id] || "Numéro à confirmer"}</small>
                </button>
              ))}
            </div>
            <p className="mm-amount"><span>Durée</span><b>{months} mois</b><span>À envoyer</span><strong>{formatFcfa(expectedAmount)}</strong></p>
            <label className="mm-field"><span>Durée de l’abonnement</span>
              <select value={months} onChange={(event) => setMonths(Number(event.target.value))}>
                {AVAILABLE_MONTHS.map((option) => <option key={option} value={option}>{option} mois · {formatFcfa(MONTHLY_PRICE_FCFA * option)}</option>)}
              </select>
            </label>
            <label className="mm-field"><span>Identifiant de transaction</span><input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Ex. TXN4482913" maxLength={80} /></label>
            <label className="mm-field"><span>Numéro utilisé pour le paiement</span><input value={payerPhone} onChange={(event) => setPayerPhone(event.target.value)} placeholder="77 123 45 67" inputMode="tel" maxLength={30} /></label>
            <label className="mm-field"><span>Note pour l’exploitant (facultatif)</span><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={500} placeholder="Ex. Payé depuis le compte de l’agence" /></label>
            {success && <p className="mm-success" role="status">{success}</p>}
            {error && <p className="mm-error" role="alert">{error}</p>}
            <button className="billing-primary" type="button" onClick={submitPayment} disabled={busy || !activeOperatorNumber}>
              {busy ? <><i className="auth-spinner" /> Envoi en cours…</> : <>Déclarer mon paiement <span>↗</span></>}
            </button>
            {!activeOperatorNumber && <p className="billing-secure">Le numéro {OPERATOR_LABELS[operator]} sera affiché dès sa configuration.</p>}
            <p className="billing-secure"><span>⌑</span> Validation manuelle par l’équipe maisonly · Aucun débit automatique</p>
          </section>

          <aside className="billing-aside">
            <div className="billing-aside-illustration"><span className="billing-sun" /><span className="billing-hill billing-hill--one" /><span className="billing-hill billing-hill--two" /><span className="billing-house"><i /><i /><i /><b /></span><span className="billing-star">✳</span></div>
            <div className="billing-aside-copy"><span>VOS DÉCLARATIONS</span><h2>Suivi de vos <em>paiements</em></h2><p>Chaque référence déclarée apparaît ici avec son statut de validation.</p></div>
            <div className="mm-history">
              {history.length === 0 && <p className="mm-history-empty">Aucun paiement déclaré pour l’instant.</p>}
              {history.map((submission) => (
                <article key={submission.id} className={`mm-item mm-item--${submission.status}`}>
                  <header><strong>{OPERATOR_LABELS[submission.operator]}</strong><span className={`mm-chip mm-chip--${submission.status}`}>{submission.status === "pending" ? "En attente" : submission.status === "approved" ? "Validé" : "Refusé"}</span></header>
                  <p><b>{formatFcfa(submission.amountFcfa)}</b> · {submission.months} mois · réf. {submission.reference}</p>
                  <small>Déclaré le {submission.submittedLabel}</small>
                  {submission.reviewerNote && <em>{submission.reviewerNote}</em>}
                </article>
              ))}
            </div>
            <div className="billing-aside-footer"><span><i />Données isolées par agence</span><span><i />Paiement mobile money local</span><span><i />Sans engagement</span></div>
          </aside>
        </div>
        <footer className="billing-footer"><span>© {new Date().getFullYear()} maisonly</span><span>Une question ? <a href="mailto:bonjour@maisonly.sn">Écrivez-nous</a></span></footer>
      </div>
    </main>
  );
}
