import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function checkCode(formData: FormData) {
  "use server";
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  redirect(`/verifier/${encodeURIComponent(code)}`);
}

export default function VerifyPortalPage() {
  return (
    <main className="vf-shell">
      <header className="vf-header">
        <Link className="vf-brand" href="/"><span className="brand-mark"><i /><i /><i /><i /></span><b>maisonly</b></Link>
        <span className="vf-code">Sénégal</span>
      </header>
      <section className="vf-card vf-card--center">
        <p className="vf-eyebrow">SERVICE PUBLIC DE VÉRIFICATION</p>
        <h1 className="vf-name">Vérifier un code</h1>
        <p className="vf-sub">
          Confirmez l’authenticité d’une quittance de loyer ou d’un passeport locataire, sans compte et gratuitement.
        </p>
        <form className="vf-form" action={checkCode}>
          <input name="code" placeholder="Ex. QT-4K7P2M ou MP-9XR3TB" maxLength={20} required autoFocus />
          <button type="submit">Vérifier</button>
        </form>
        <div className="vf-why">
          <p><b>Vous êtes propriétaire ?</b> Demandez le code de quittance à votre agence pour confirmer que votre loyer a bien été encaissé.</p>
          <p><b>Vous êtes une agence ?</b> Vérifiez l’historique locataire d’un candidat avant de signer, sans dépendre d’une référence papier.</p>
        </div>
      </section>
      <footer className="vf-footer"><span>© {new Date().getFullYear()} maisonly</span><Link href="/">Le produit</Link></footer>
    </main>
  );
}
