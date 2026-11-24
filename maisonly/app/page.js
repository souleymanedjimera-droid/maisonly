'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

const CATS = [['', 'Toutes'], ['appartement', 'Appartements'], ['chambre', 'Chambres'], ['maison', 'Maisons'], ['studio', 'Studios']];
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
    <main className="w">
      <div className="row">
        <h1 style={{ margin: 0 }}>Maisonly</h1>
        <Link href="/connexion"><button className="g">Espace agence</button></Link>
      </div>
      <h2 style={{ fontSize: 'clamp(1.6rem,6vw,2.4rem)', margin: '24px 0 4px' }}>Trouvez votre logement à louer</h2>
      <p className="mu">Appartements, chambres, maisons et studios publiés par des agences. Appelez directement l'agence.</p>

      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Quartier ou ville (ex. Mermoz, Pikine, Thiès)" aria-label="Rechercher par quartier" />
      <div className="chips">
        {CATS.map(([k, l]) => <button key={k} className={cat === k ? '' : 'g'} onClick={() => setCat(k)}>{l}</button>)}
      </div>

      {liste === null && <p className="mu">Chargement…</p>}
      {liste && !liste.length && <p className="mu">Aucune annonce pour cette recherche.</p>}
      <div className="grid">
        {(liste || []).map(a => (
          <article className="card" key={a.id} style={{ padding: 0, overflow: 'hidden' }}>
            {a.photo_url
              ? <img src={a.photo_url} alt={a.titre} loading="lazy" style={{ width: '100%', height: 170, objectFit: 'cover', display: 'block' }} />
              : <div style={{ height: 170, display: 'grid', placeItems: 'center', background: 'var(--bd)' }} className="mu">Pas de photo</div>}
            <div style={{ padding: 14 }}>
              <span className="mu" style={{ textTransform: 'capitalize' }}>{a.categorie} · {a.quartier}</span>
              <h3 style={{ margin: '4px 0' }}>{a.titre}</h3>
              <b>{f(a.prix)} / mois</b>
              {a.description && <p className="mu" style={{ margin: '6px 0' }}>{a.description}</p>}
              <p className="mu" style={{ margin: '6px 0 10px' }}>Agence : {a.agence_nom}</p>
              <div className="row" style={{ justifyContent: 'flex-start' }}>
                <a href={`tel:+${intl(a.telephone)}`}><button>Appeler</button></a>
                <a href={`https://wa.me/${intl(a.telephone)}?text=${encodeURIComponent('Bonjour, je suis intéressé par : ' + a.titre + ' (vu sur Maisonly)')}`} target="_blank" rel="noreferrer"><button className="g">WhatsApp</button></a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
