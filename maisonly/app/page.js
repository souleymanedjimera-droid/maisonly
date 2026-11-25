'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

const CATS = [['', '🏘️', 'Toutes'], ['appartement', '🏢', 'Appartements'], ['chambre', '🛏️', 'Chambres'], ['maison', '🏠', 'Maisons'], ['studio', '🚪', 'Studios']];
const f = n => Number(n || 0).toLocaleString('fr-FR') + ' FCFA';
const intl = t => { const d = (t || '').replace(/\D/g, ''); return d.length === 9 ? '221' + d : d; };

export default function Accueil() {
  const [cat, setCat] = useState(''), [q, setQ] = useState(''), [liste, setListe] = useState(null);

  useEffect(() => {
    let ok = true;
    (async () => {
      let r = supabase.from('annonces').select('*').eq('publie', true).order('created_at', { ascending: false }).limit(60);
      if (cat) r = r.eq('categorie', cat);
      const mot = q.replace(/[%,]/g, '').trim();
      if (mot) r = r.ilike('quartier', `%${mot}%`);
      const { data } = await r;
      if (ok) setListe(data || []);
    })();
    return () => { ok = false; };
  }, [cat, q]);

  return (
    <>
      <header className="hero">
        <div className="in">
          <div className="row">
            <span className="logo"><i>M</i>Maisonly</span>
            <Link href="/connexion"><button className="g">Espace agence</button></Link>
          </div>
          <h1>Votre prochain <em>chez-vous</em> est ici</h1>
          <p>Appartements, chambres, maisons et studios à louer, publiés par des agences. Contactez-les directement par téléphone ou WhatsApp.</p>
        </div>
      </header>

      <div className="search">
        <div className="card">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="🔎  Quartier ou ville : Mermoz, Pikine, Thiès…" aria-label="Rechercher par quartier" />
        </div>
      </div>

      <main className="w">
        <div className="cats">
          {CATS.map(([k, ic, l]) => (
            <button key={k} className={'cat' + (cat === k ? ' on' : '')} onClick={() => setCat(k)}>
              <b>{ic}</b><span>{l}</span>
            </button>
          ))}
        </div>

        {liste === null && <p className="mu">Chargement des annonces…</p>}
        {liste && !liste.length && <div className="card"><h3>Aucune annonce pour le moment</h3><p className="mu">Essayez une autre catégorie ou un autre quartier.</p></div>}

        <div className="grid">
          {(liste || []).map(a => (
            <article className="card ann" key={a.id}>
              <div className="ph">
                {a.photo_url ? <img src={a.photo_url} alt={a.titre} loading="lazy" /> : <span>Pas de photo</span>}
                <span className="tg">{a.categorie}</span>
                <span className="pr">{f(a.prix)} / mois</span>
              </div>
              <div className="bd">
                <span className="mu">📍 {a.quartier}</span>
                <h3>{a.titre}</h3>
                {a.description && <p className="mu" style={{ margin: '0 0 6px', fontSize: '.9rem' }}>{a.description}</p>}
                <p className="mu" style={{ margin: '0 0 12px', fontSize: '.85rem' }}>Agence {a.agence_nom}</p>
                <div className="row" style={{ justifyContent: 'flex-start' }}>
                  <a href={`tel:+${intl(a.telephone)}`}><button>📞 Appeler</button></a>
                  <a href={`https://wa.me/${intl(a.telephone)}?text=${encodeURIComponent('Bonjour, je suis intéressé par : ' + a.titre + ' (vu sur Maisonly)')}`} target="_blank" rel="noreferrer"><button className="wa">WhatsApp</button></a>
                </div>
              </div>
            </article>
          ))}
        </div>

        <section className="band">
          <h2>Vous êtes une agence immobilière ?</h2>
          <p>Gérez vos loyers, locataires et reversements, et publiez vos annonces ici. Essai gratuit de 10 jours, puis 25 000 FCFA par mois, payables par Wave ou Orange Money.</p>
          <Link href="/connexion"><button style={{ background: 'var(--ac)', color: '#0f1b2d' }}>Essayer gratuitement 10 jours</button></Link>
        </section>
      </main>
      <footer className="foot">© Maisonly · Gestion et location immobilière</footer>
    </>
  );
}
