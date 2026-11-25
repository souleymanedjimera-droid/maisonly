'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function Connexion() {
  const [up, setUp] = useState(false);
  const [err, setErr] = useState('');
  async function go(ev) {
    ev.preventDefault();
    const d = Object.fromEntries(new FormData(ev.target));
    setErr('');
    const r = up
      ? await supabase.auth.signUp({ email: d.email, password: d.pw, options: { data: { agence: d.nom } } })
      : await supabase.auth.signInWithPassword({ email: d.email, password: d.pw });
    if (r.error) return setErr(r.error.message);
    if (!r.data.session) return setErr('Compte créé. Confirmez votre e-mail puis connectez-vous.');
    location.href = '/dashboard';
  }
  return (
    <main className="auth">
      <form className="card" onSubmit={go}>
        <Link href="/" className="logo" style={{ marginBottom: 18 }}><i>M</i>Maisonly</Link>
        <h2 style={{ fontSize: '1.5rem', marginBottom: 4 }}>{up ? 'Créez le compte de votre agence' : 'Bon retour'}</h2>
        <p className="mu" style={{ margin: '0 0 16px' }}>{up ? '10 jours d\'essai gratuit, sans paiement. Loyers, locataires, annonces : tout au même endroit.' : 'Connectez-vous à votre espace agence.'}</p>
        {up && <input name="nom" placeholder="Nom de l'agence" required />}
        <input name="email" type="email" placeholder="E-mail" required />
        <input name="pw" type="password" placeholder="Mot de passe (6 caractères min.)" minLength={6} required />
        {err && <p className="err">{err}</p>}
        <button style={{ width: '100%' }}>{up ? 'Créer mon compte' : 'Se connecter'}</button>
        <button type="button" className="g" style={{ width: '100%', marginTop: 8 }} onClick={() => setUp(!up)}>{up ? "J'ai déjà un compte" : 'Créer un compte agence'}</button>
      </form>
    </main>
  );
}
