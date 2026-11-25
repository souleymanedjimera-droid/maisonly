'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const f = n => Number(n || 0).toLocaleString('fr-FR') + ' FCFA';
const mois = () => new Date().toISOString().slice(0, 7);

function Ajout({ champs, onSave, label }) {
  async function submit(ev) {
    ev.preventDefault();
    const form = ev.target;
    await onSave(Object.fromEntries(new FormData(form)));
    form.reset();
  }
  return (
    <form className="card" onSubmit={submit}>
      {champs.map(c => c.options
        ? <select key={c.k} name={c.k} required>{c.options.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}</select>
        : <input key={c.k} name={c.k} type={c.t || 'text'} placeholder={c.l} required={!c.opt} accept={c.t === 'file' ? 'image/*' : undefined} />)}
      <button>{label}</button>
    </form>
  );
}

export default function Dashboard() {
  const [ag, setAg] = useState(null), [biens, setB] = useState([]), [locs, setL] = useState([]), [pays, setP] = useState([]), [anns, setA] = useState([]);
  const [tab, setTab] = useState('loy'), [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { location.href = '/'; return; }
    let { data: a } = await supabase.from('agences').select('*').maybeSingle();
    if (!a) {
      const r = await supabase.from('agences').insert({ owner: session.user.id, nom: session.user.user_metadata?.agence || 'Mon agence' }).select().single();
      a = r.data;
    }
    setAg(a);
    const [b, l, p, an] = await Promise.all([
      supabase.from('biens').select('*').order('nom'),
      supabase.from('locataires').select('*').order('nom'),
      supabase.from('paiements').select('*').eq('mois', mois()),
      supabase.from('annonces').select('*').eq('agence_id', a.id).order('created_at', { ascending: false }),
    ]);
    setB(b.data || []); setL(l.data || []); setP(p.data || []); setA(an.data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const actif = ag && new Date(ag.abonnement_fin) > new Date();
  const jours = ag ? Math.max(0, Math.ceil((new Date(ag.abonnement_fin) - new Date()) / 864e5)) : 0;
  useEffect(() => { // après retour de PayDunya, on attend la confirmation du webhook
    if (ag && !actif && location.search.includes('paiement')) {
      setMsg('Paiement en cours de confirmation…');
      const t = setInterval(load, 3000); return () => clearInterval(t);
    }
  }, [ag, actif, load]);

  const bien = id => biens.find(b => b.id === id);
  const ins = (table, row) => supabase.from(table).insert({ ...row, agence_id: ag.id }).then(({ error }) => { if (error) setMsg(error.message); load(); });
  const del = (table, id) => confirm('Supprimer ?') && supabase.from(table).delete().eq('id', id).then(load);

  async function payer() {
    const { data: { session } } = await supabase.auth.getSession();
    const r = await fetch('/api/pay', { method: 'POST', headers: { Authorization: 'Bearer ' + session.access_token } });
    const j = await r.json();
    if (j.url) location.href = j.url; else setMsg(j.error || 'Erreur de paiement');
  }

  const CATS = [{ id: 'appartement', nom: 'Appartement' }, { id: 'chambre', nom: 'Chambre' }, { id: 'maison', nom: 'Maison' }, { id: 'studio', nom: 'Studio' }];
  async function publier(d) {
    let photo_url = null;
    if (d.photo && d.photo.size) {
      const ext = (d.photo.name.split('.').pop() || '').toLowerCase();
      if (!/^(jpe?g|png|webp)$/.test(ext)) return setMsg('Photo : formats JPG, PNG ou WEBP.');
      if (d.photo.size > 3e6) return setMsg('Photo trop lourde (3 Mo maximum).');
      const path = `${ag.id}/${Date.now()}.${ext}`;
      const up = await supabase.storage.from('annonces').upload(path, d.photo);
      if (up.error) return setMsg(up.error.message);
      photo_url = supabase.storage.from('annonces').getPublicUrl(path).data.publicUrl;
    }
    const { photo, prix, ...reste } = d;
    await ins('annonces', { ...reste, prix: +prix, photo_url, agence_nom: ag.nom });
  }

  if (!ag) return <main className="w">Chargement…</main>;
  const vue = actif ? tab : 'abo';
  const tabs = [['loy', 'Loyers'], ['biens', 'Biens'], ['ann', 'Annonces'], ['loc', 'Locataires'], ['abo', 'Abonnement']];
  const encaisse = pays.reduce((s, p) => s + p.montant, 0);
  const attendu = locs.reduce((s, l) => s + (bien(l.bien_id)?.loyer || 0), 0);

  return (
    <main className="w">
      <div className="row"><span className="logo"><i>M</i>{ag.nom}</span><button className="g" onClick={() => supabase.auth.signOut().then(() => location.href = '/')}>Déconnexion</button></div>
      <div className="tabs">
        {tabs.map(([k, l]) => <button key={k} className={vue === k ? 'on' : ''} disabled={!actif && k !== 'abo'} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {actif && jours <= 10 && <div className="card" style={{ background: 'var(--ac)', color: '#0f1b2d', border: 0 }}><b>Il vous reste {jours} jour{jours > 1 ? 's' : ''} d'accès.</b> Passez à l'abonnement pour continuer sans interruption. <button className="g" style={{ color: '#0f1b2d', borderColor: '#0f1b2d', marginLeft: 8 }} onClick={() => setTab('abo')}>Voir l'abonnement</button></div>}
      {msg && <p className="err">{msg}</p>}

      {vue === 'loy' && <div className="card">
        <h3 style={{ marginBottom: 12 }}>Loyers de {mois()}</h3>
        <div className="kpi"><div><b>{f(attendu)}</b><span>Attendu</span></div><div><b>{f(encaisse)}</b><span>Encaissé</span></div><div><b style={{ color: 'var(--rd)' }}>{f(Math.max(0, attendu - encaisse))}</b><span>Impayés</span></div></div>
        {locs.map(l => {
          const b = bien(l.bien_id), p = pays.find(x => x.locataire_id === l.id);
          const txt = encodeURIComponent(`Bonjour ${l.nom}, le loyer de ${mois()} (${f(b?.loyer)}) n'a pas encore été réglé. Vous pouvez payer par Wave ou Orange Money. Merci. – ${ag.nom}`);
          return <div className="it" key={l.id}>
            <div><b>{l.nom}</b> <span className={'st' + (p ? '' : ' r')}>{p ? 'Payé' : 'Impayé'}</span><br /><span className="mu">{b?.nom} · {f(b?.loyer)}</span></div>
            {!p && <div className="row">
              <button onClick={() => ins('paiements', { locataire_id: l.id, bien_id: l.bien_id, mois: mois(), montant: b?.loyer || 0 })}>Encaisser</button>
              <a href={`https://wa.me/${(l.tel || '').replace(/\D/g, '')}?text=${txt}`} target="_blank" rel="noreferrer"><button className="wa">Relancer</button></a>
            </div>}
          </div>;
        })}
        {!locs.length && <p className="mu">Ajoutez des biens puis des locataires.</p>}
      </div>}

      {vue === 'biens' && <>
        <Ajout label="Ajouter le bien" champs={[{ k: 'nom', l: 'Nom du bien' }, { k: 'adresse', l: 'Adresse', opt: 1 }, { k: 'loyer', l: 'Loyer (FCFA)', t: 'number' }, { k: 'proprio', l: 'Propriétaire' }]}
          onSave={d => ins('biens', { ...d, loyer: +d.loyer })} />
        <div className="card">{biens.map(b => <div className="it" key={b.id}><span><b>{b.nom}</b> · {f(b.loyer)}<br /><span className="mu">{b.proprio}</span></span><button className="g" onClick={() => del('biens', b.id)}>Supprimer</button></div>)}</div>
      </>}

      {vue === 'loc' && <>
        {biens.length ? <Ajout label="Ajouter le locataire" champs={[{ k: 'nom', l: 'Nom complet' }, { k: 'tel', l: 'Téléphone (ex. 221770000000)' }, { k: 'bien_id', options: biens }]} onSave={d => ins('locataires', d)} /> : <p className="mu">Ajoutez d'abord un bien.</p>}
        <div className="card">{locs.map(l => <div className="it" key={l.id}><span><b>{l.nom}</b><br /><span className="mu">{l.tel} · {bien(l.bien_id)?.nom}</span></span><button className="g" onClick={() => del('locataires', l.id)}>Supprimer</button></div>)}</div>
      </>}

      {vue === 'ann' && <>
        <Ajout label="Publier l'annonce" champs={[{ k: 'titre', l: 'Titre (ex. Appartement 3 pièces à Mermoz)' }, { k: 'categorie', options: CATS }, { k: 'quartier', l: 'Quartier / ville' }, { k: 'prix', l: 'Loyer mensuel (FCFA)', t: 'number' }, { k: 'telephone', l: 'Téléphone affiché au public', t: 'tel' }, { k: 'description', l: 'Description (facultatif)', opt: 1 }, { k: 'photo', l: 'Photo', t: 'file', opt: 1 }]} onSave={publier} />
        <p className="mu">Le numéro saisi est visible par tous les visiteurs. Les annonces disparaissent de l'accueil si l'abonnement expire.</p>
        <div className="card">{anns.map(a => <div className="it" key={a.id}>
          <span><b>{a.titre}</b> {a.publie ? '🟢 En ligne' : '⚪ Masquée'}<br /><span className="mu">{a.categorie} · {a.quartier} · {f(a.prix)} · {a.telephone}</span></span>
          <span className="row"><button className="g" onClick={() => supabase.from('annonces').update({ publie: !a.publie }).eq('id', a.id).then(load)}>{a.publie ? 'Masquer' : 'Publier'}</button><button className="g" onClick={() => del('annonces', a.id)}>Supprimer</button></span>
        </div>)}{!anns.length && <p className="mu">Aucune annonce publiée.</p>}</div>
      </>}

      {vue === 'abo' && <div className="card">
        <h3>Abonnement Maisonly</h3>
        <p>{actif ? `Actif jusqu'au ${new Date(ag.abonnement_fin).toLocaleDateString('fr-FR')} (${jours} jour${jours > 1 ? 's' : ''} restant${jours > 1 ? 's' : ''})` : 'Votre accès est terminé : payez pour réactiver votre agence. Vos données sont conservées.'}</p>
        <p className="mu">25 000 FCFA par mois, par Wave ou Orange Money.</p>
        <button onClick={payer}>{actif ? 'Renouveler' : 'Payer'} 25 000 FCFA</button>
      </div>}
    </main>
  );
}
