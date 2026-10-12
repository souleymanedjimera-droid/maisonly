"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type AuthFormProps = { mode: "register" | "login" };

function Mark() {
  return (
    <span className="auth-brand-mark">
      <i /><i /><i /><i />
    </span>
  );
}

export default function AuthForm({ mode }: AuthFormProps) {
  const isRegister = mode === "register";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = isRegister
      ? {
          name: String(form.get("name") ?? ""),
          agencyName: String(form.get("agencyName") ?? ""),
          agencyCity: String(form.get("agencyCity") ?? ""),
          contactPhone: String(form.get("contactPhone") ?? ""),
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          acceptedTerms: form.get("acceptedTerms") === "on",
        }
      : {
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string; next?: string };
      if (!response.ok) throw new Error(result.error ?? "Une erreur est survenue.");
      window.location.assign(result.next ?? "/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-panel">
        <Link className="auth-brand" href="/" aria-label="Retour à l’accueil"><Mark /><span>maisonly</span></Link>
        <div className="auth-form-wrap">
          <div className="auth-eyebrow"><span /> VOTRE ESPACE IMMOBILIER · SÉNÉGAL</div>
          <h1>{isRegister ? <>Votre agence<br />commence ici.</> : <>Heureuse de<br />vous revoir.</>}</h1>
          <p className="auth-intro">{isRegister ? "Un espace privé pour votre équipe, vos biens et vos locataires." : "Connectez-vous à l’espace privé de votre agence."}</p>

          <form className="auth-form" onSubmit={submit}>
            {isRegister && <>
              <label className="auth-field"><span>Votre nom</span><input name="name" autoComplete="name" placeholder="Awa Ndiaye" minLength={2} maxLength={160} required /></label>
              <div className="auth-row">
                <label className="auth-field"><span>Nom de l’agence</span><input name="agencyName" autoComplete="organization" placeholder="Agence Teranga" minLength={2} maxLength={180} required /></label>
                <label className="auth-field"><span>Ville</span><input name="agencyCity" autoComplete="address-level2" placeholder="Dakar" list="senegal-cities" maxLength={120} /></label>
                <datalist id="senegal-cities">
                  <option value="Dakar" /><option value="Pikine" /><option value="Guédiawaye" /><option value="Thiès" />
                  <option value="Touba" /><option value="Saint-Louis" /><option value="Mbour" /><option value="Kaolack" />
                  <option value="Ziguinchor" /><option value="Rufisque" /><option value="Diamniadio" /><option value="Louga" />
                </datalist>
              </div>
              <label className="auth-field"><span>Téléphone de l’agence</span><input name="contactPhone" type="tel" autoComplete="tel" placeholder="77 123 45 67" inputMode="tel" maxLength={30} /></label>
            </>}
            <label className="auth-field"><span>Adresse e-mail professionnelle</span><input name="email" type="email" autoComplete="email" placeholder="vous@votreagence.sn" maxLength={254} required /></label>
            <label className="auth-field"><span>Mot de passe</span><input name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} placeholder={isRegister ? "12 caractères minimum" : "Votre mot de passe"} minLength={isRegister ? 12 : undefined} maxLength={128} required /><small>{isRegister ? "12 caractères minimum pour protéger votre espace." : <Link href="mailto:bonjour@maisonly.sn?subject=R%C3%A9initialisation%20du%20mot%20de%20passe">Mot de passe oublié ?</Link>}</small></label>
            {isRegister && <label className="auth-consent"><input name="acceptedTerms" type="checkbox" required /><span>J’accepte les conditions d’utilisation et la politique de confidentialité.</span></label>}
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit" type="submit" disabled={loading}>{loading ? <><i className="auth-spinner" /> Création en cours…</> : <>{isRegister ? "Créer mon compte agence" : "Me connecter"}<span>↗</span></>}</button>
          </form>
          <p className="auth-switch">{isRegister ? "Vous avez déjà un compte ?" : "Votre agence n’a pas encore son espace ?"} <Link href={isRegister ? "/login" : "/register"}>{isRegister ? "Se connecter" : "Créer un compte"}</Link></p>
          {isRegister && <p className="auth-payhint"><span>F</span> Paiement de l’abonnement par Wave, Orange Money ou Free Money, validé par notre équipe.</p>}
        </div>
        <footer className="auth-footer"><span>© {new Date().getFullYear()} maisonly · Dakar</span><Link href="/">Retour au site</Link></footer>
      </section>
      <aside className={`auth-aside ${isRegister ? "auth-aside--register" : "auth-aside--login"}`}>
        <Link className="auth-aside-top" href="/"><Mark /><span>maisonly</span><i>GESTION IMMOBILIÈRE SEREINE</i></Link>
        <div className="auth-aside-copy"><span>UN ESPACE. VOTRE AGENCE.</span><h2>Moins de gestion<br />dans votre tête.<br /><em>Plus de temps<br />pour vos clients.</em></h2><p>Votre équipe, vos biens, vos locataires : tout se retrouve ici, dans un espace qui vous appartient.</p></div>
        <div className="auth-aside-quote"><span>✳</span><p>« Enfin une vue claire de notre parc,<br />sans multiplier les tableaux. »</p><small>UNE AGENCE DE DAKAR QUI SOUFFLE</small></div>
        <div className="auth-aside-bottom"><span>WAVE</span><i /><span>ORANGE MONEY</span><i /><span>FREE MONEY</span></div>
      </aside>
    </main>
  );
}
