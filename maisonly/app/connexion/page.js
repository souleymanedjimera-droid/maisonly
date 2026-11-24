'use client';
import { useState } from 'react';
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
    <main className="w">
      <h1 style={{ fontSize: '3rem', margin: '32px 0 8px' }}>Maisonly</h1>
      <p className="mu">Loyers, locataires et quittances de votre agence, payés par Wave ou Orange Money. 25 000 FCFA par mois.</p>
      <form className="card" onSubmit={go} style={{ maxWidth: 420 }}>
        <h2>{up ? 'Créer le compte de votre agence' : 'Connexion'}</h2>
        {up && <input name="nom" placeholder="Nom de l'agence" required />}
        <input name="email" type="email" placeholder="E-mail" required />
        <input name="pw" type="password" placeholder="Mot de passe (6 caractères min.)" minLength={6} required />
        {err && <p className="err">{err}</p>}
        <div className="row">
          <button>{up ? 'Créer mon compte' : 'Se connecter'}</button>
          <button type="button" className="g" onClick={() => setUp(!up)}>{up ? "J'ai un compte" : 'Créer un compte'}</button>
        </div>
      </form>
    </main>
  );
}
