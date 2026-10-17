"use client";

import { useState } from "react";
import { OPERATOR_LABELS, formatFcfa, type PaymentOperatorId } from "@/lib/pricing";

export type AdminPayment = {
  id: number;
  operator: PaymentOperatorId;
  reference: string;
  payerPhone: string;
  amountFcfa: number;
  months: number;
  note: string;
  status: "pending" | "approved" | "rejected";
  reviewerNote: string;
  createdAt: string;
  agencyName: string;
  agencyCity: string;
  ownerName: string;
  ownerEmail: string;
  currentPeriodEnd: string | null;
};

export function AdminLogin({ configured, usingFallback }: { configured: boolean; usingFallback: boolean }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Connexion impossible.");
      window.location.reload();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Une erreur est survenue.");
      setBusy(false);
    }
  }

  return (
    <main className="admin-shell">
      <section className="admin-login">
        <span className="admin-lockup"><span className="brand-mark"><i /><i /><i /><i /></span>maisonly</span>
        <h1>Console de validation</h1>
        <p>Validez les paiements Wave, Orange Money et Free Money reçus des agences.</p>
        {configured ? (
          <>
            {usingFallback && <p className="mm-error">Code d’accès par défaut actif. Définissez <b>ADMIN_ACCESS_CODE</b> pour protéger votre console.</p>}
            <label className="mm-field"><span>Code d’accès exploitant</span><input type="password" value={code} onChange={(event) => setCode(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} placeholder="••••••••" autoFocus /></label>
            {error && <p className="mm-error" role="alert">{error}</p>}
            <button className="billing-primary" type="button" onClick={submit} disabled={busy || !code}>{busy ? <><i className="auth-spinner" /> Vérification…</> : <>Ouvrir la console <span>↗</span></>}</button>
          </>
        ) : (
          <p className="mm-error">Définissez la variable d’environnement <b>ADMIN_ACCESS_CODE</b> pour activer la console en production.</p>
        )}
      </section>
    </main>
  );
}

export default function AdminConsole({
  payments,
  totals,
}: {
  payments: AdminPayment[];
  totals: { pending: number; approved: number; revenue: number };
}) {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [error, setError] = useState("");

  const visible = payments.filter((payment) => (filter === "all" ? true : payment.status === filter));

  async function decide(payment: AdminPayment, action: "approve" | "reject") {
    setBusyId(payment.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/payments/${payment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: notes[payment.id] ?? "" }),
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "Décision impossible.");
      }
      window.location.reload();
    } catch (decideError) {
      setError(decideError instanceof Error ? decideError.message : "Une erreur est survenue.");
      setBusyId(null);
    }
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    window.location.replace("/admin");
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <span className="admin-lockup"><span className="brand-mark"><i /><i /><i /><i /></span>maisonly <em>· console</em></span>
        <div className="admin-header-actions">
          <a href="/">Voir le site</a>
          <button type="button" onClick={logout}>Fermer la session</button>
        </div>
      </header>

      <section className="admin-stats">
        <div><span>À valider</span><strong>{totals.pending}</strong></div>
        <div><span>Paiements validés</span><strong>{totals.approved}</strong></div>
        <div><span>Recettes validées</span><strong>{formatFcfa(totals.revenue)}</strong></div>
      </section>

      <div className="admin-toolbar" role="group" aria-label="Filtrer les paiements">
        {(["pending", "approved", "rejected", "all"] as const).map((option) => (
          <button key={option} type="button" className={`filter-pill ${filter === option ? "filter-pill--active" : ""}`} onClick={() => setFilter(option)}>
            {option === "pending" ? "En attente" : option === "approved" ? "Validés" : option === "rejected" ? "Refusés" : "Tous"}
          </button>
        ))}
      </div>

      {error && <p className="mm-error" role="alert">{error}</p>}

      <div className="admin-list">
        {visible.length === 0 && <p className="admin-empty">Aucun paiement dans cette catégorie.</p>}
        {visible.map((payment) => (
          <article key={payment.id} className={`admin-card admin-card--${payment.status}`}>
            <div className="admin-card-main">
              <header>
                <strong>{payment.agencyName}</strong>
                <span className={`mm-chip mm-chip--${payment.status}`}>{payment.status === "pending" ? "En attente" : payment.status === "approved" ? "Validé" : "Refusé"}</span>
              </header>
              <p className="admin-card-contact">{payment.ownerName} · {payment.ownerEmail} · {payment.agencyCity}</p>
              <dl className="admin-card-facts">
                <div><dt>Opérateur</dt><dd>{OPERATOR_LABELS[payment.operator]}</dd></div>
                <div><dt>Référence</dt><dd>{payment.reference}</dd></div>
                <div><dt>Numéro payeur</dt><dd>{payment.payerPhone}</dd></div>
                <div><dt>Montant</dt><dd>{formatFcfa(payment.amountFcfa)}</dd></div>
                <div><dt>Durée</dt><dd>{payment.months} mois</dd></div>
                <div><dt>Abonnement actuel</dt><dd>{payment.currentPeriodEnd ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(payment.currentPeriodEnd)) : "—"}</dd></div>
              </dl>
              {payment.note && <p className="admin-card-note">« {payment.note} »</p>}
              {payment.reviewerNote && <p className="admin-card-note admin-card-note--review">Votre note : {payment.reviewerNote}</p>}
            </div>
            {payment.status === "pending" && (
              <div className="admin-card-actions">
                <input value={notes[payment.id] ?? ""} onChange={(event) => setNotes((previous) => ({ ...previous, [payment.id]: event.target.value }))} placeholder="Note interne (facultatif)" maxLength={500} />
                <div>
                  <button className="admin-approve" type="button" disabled={busyId === payment.id} onClick={() => decide(payment, "approve")}>{busyId === payment.id ? "…" : `Valider ${payment.months} mois`}</button>
                  <button className="admin-reject" type="button" disabled={busyId === payment.id} onClick={() => decide(payment, "reject")}>Refuser</button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
