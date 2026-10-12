import Link from "next/link";
import { MONTHLY_PRICE_FCFA, formatFcfa } from "@/lib/pricing";

const features = [
  {
    number: "01",
    title: "Votre parc, enfin lisible",
    description: "Villas, appartements, studios et locaux de Dakar à Saint-Louis réunis dans un seul espace.",
  },
  {
    number: "02",
    title: "Les loyers bien suivis",
    description: "Visualisez ce qui est encaissé, ce qui arrive et les échéances à ne pas laisser filer.",
  },
  {
    number: "03",
    title: "Chaque demande à sa place",
    description: "Centralisez les interventions de vos logements, leur priorité et leur avancement.",
  },
];

function Brand() {
  return (
    <span className="marketing-brand">
      <span className="brand-mark"><i /><i /><i /><i /></span>
      <span>maisonly</span>
    </span>
  );
}

export default function LandingPage() {
  return (
    <main className="marketing-page">
      <header className="marketing-header">
        <Link className="brand-link" href="/" aria-label="maisonly, accueil"><Brand /></Link>
        <nav className="marketing-nav" aria-label="Navigation principale">
          <a href="#produit">Le produit</a>
          <a href="#tarif">Tarif</a>
          <Link className="marketing-login" href="/login">Connexion</Link>
          <Link className="marketing-signup" href="/register">Créer mon compte <span>↗</span></Link>
        </nav>
      </header>

      <section className="marketing-hero">
        <div className="hero-copy">
          <div className="hero-proof"><span /><span>POUR LES AGENCES IMMOBILIÈRES DU SÉNÉGAL</span></div>
          <h1>Votre agence.<br />Votre parc.<br /><em>Un esprit plus léger.</em></h1>
          <p>La gestion locative retrouve sa simplicité. Suivez vos biens, vos loyers et vos demandes dans un espace privé, réservé à votre agence.</p>
          <div className="hero-actions">
            <Link className="marketing-cta" href="/register">Créer mon espace agence <span>↗</span></Link>
            <span className="hero-note">Abonnement mensuel · Sans engagement</span>
          </div>
          <div className="hero-trust"><div className="trust-faces"><span>ML</span><span>AD</span><span>SB</span></div><span>Paiement par Wave, Orange Money<br />et Free Money, validé par notre équipe.</span></div>
        </div>
        <div className="hero-art" aria-label="Aperçu du tableau de bord maisonly">
          <div className="hero-orbit hero-orbit--one" /><div className="hero-orbit hero-orbit--two" />
          <div className="floating-leaf leaf-one" /><div className="floating-leaf leaf-two" />
          <div className="mock-window">
            <div className="mock-top"><div className="mock-brand"><span className="mock-logo"><i /><i /><i /><i /></span> maisonly</div><span className="mock-user"><i /> Agence Teranga</span></div>
            <div className="mock-content">
              <div className="mock-greeting"><div><span>JEUDI 12 JUIN</span><strong>Bonjour Awa <i>✳</i></strong><small>Votre patrimoine se porte bien.</small></div><span className="mock-add">＋ Ajouter un bien</span></div>
              <div className="mock-stats"><div><span>BIENS EN GESTION</span><strong>24</strong><i>↑ 2 ce mois</i></div><div><span>TAUX D’OCCUPATION</span><strong>96<span>%</span></strong><i>Très bon niveau</i></div><div><span>LOYERS / MOIS</span><strong>12,4 M</strong><i>21 baux actifs</i></div></div>
              <div className="mock-lower"><div className="mock-chart"><div className="mock-panel-head"><strong>Revenus locatifs</strong><span>6 derniers mois⌄</span></div><div className="mock-chart-body"><span>15M</span><span>10M</span><span>5M</span><span>0</span><div className="mock-bars"><i /><i /><i /><i /><i /><i /><i /></div></div><div className="mock-months"><span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Juin</span></div></div><div className="mock-reminder"><div className="mock-panel-head"><strong>À suivre</strong><b>2</b></div><div className="mock-alert"><span>LOYER À SUIVRE</span><strong>Moussa Diop</strong><small>Appartement Sacré-Cœur</small><footer>450 000 F <i>Échéance 05/06</i></footer></div><div className="mock-mini-task"><span>◉</span> 1 intervention en cours</div></div></div>
            </div>
          </div>
          <div className="hero-float-card float-card--top"><span className="float-icon">⌂</span><span><b>Votre agence,</b><small>vos données uniquement.</small></span><i>✓</i></div>
          <div className="hero-float-card float-card--bottom"><span className="float-icon float-icon--coin">F</span><span><b>Wave &amp; Orange Money</b><small>Paiement local, validé par nous.</small></span></div>
        </div>
      </section>

      <div className="marketing-proofline"><span>BIENS &amp; BAUX</span><i /><span>LOYERS</span><i /><span>INTERVENTIONS</span><i /><span>WAVE · ORANGE MONEY · FREE MONEY</span></div>

      <section className="marketing-features" id="produit">
        <div className="marketing-section-heading"><div><p>UNE GESTION PLUS HUMAINE</p><h2>Tout ce qui compte.<br /><em>Rien qui encombre.</em></h2></div><span>Moins d’allers-retours, plus de visibilité<br />et du temps pour vos clients.</span></div>
        <div className="feature-grid">{features.map((feature) => <article className="feature-card" key={feature.number}><span>{feature.number}</span><div><h3>{feature.title}</h3><p>{feature.description}</p></div><i>↗</i></article>)}</div>
      </section>

      <section className="marketing-pricing" id="tarif"><div className="pricing-copy"><p>UNE FORMULE, TOUT L’ESSENTIEL</p><h2>La bonne gestion<br />à prix <em>juste.</em></h2><span>Pour toute votre agence, sans frais cachés ni engagement annuel.</span><span className="pricing-operators"><b>Wave</b><b>Orange Money</b><b>Free Money</b></span></div><div className="price-card"><div className="price-card-top"><span>MAISONLY ESSENTIELLE</span><span className="price-tag">Validation rapide</span></div><div className="price-number"><strong>{formatFcfa(MONTHLY_PRICE_FCFA)}</strong><span>par mois<br />par agence</span></div><div className="price-divider" /><ul><li><i>✓</i> Biens, baux et locataires en illimité</li><li><i>✓</i> Suivi des loyers et des retards</li><li><i>✓</i> Demandes d’intervention centralisées</li><li><i>✓</i> Un espace sécurisé, propre à votre agence</li><li><i>✓</i> Paiement Wave, Orange Money ou Free Money</li></ul><Link className="pricing-button" href="/register">Créer mon compte <span>↗</span></Link><small>Payez par mobile money, l’accès s’ouvre après validation</small></div></section>

      <footer className="marketing-footer"><Link className="brand-link" href="/" aria-label="maisonly, accueil"><Brand /></Link><span>Dakar · Sénégal</span><span>© {new Date().getFullYear()} maisonly</span></footer>
    </main>
  );
}
