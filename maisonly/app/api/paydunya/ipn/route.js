import crypto from 'crypto';
import { admin, PRIX, PD_BASE, pdHeaders } from '../../../../lib/admin';

const ok = (t = 'ok') => new Response(t, { status: 200 });

export async function POST(req) {
  // PayDunya envoie un POST (form-urlencoded) avec la clé "data".
  const raw = await req.text();
  let hash, token;
  if (raw.trim().startsWith('{')) {
    const d = JSON.parse(raw).data || {};
    hash = d.hash; token = d.invoice?.token;
  } else {
    const p = new URLSearchParams(raw);
    hash = p.get('data[hash]'); token = p.get('data[invoice][token]');
  }

  // 1) Le hash doit être le SHA-512 de notre clé principale.
  const attendu = crypto.createHash('sha512').update(process.env.PAYDUNYA_MASTER_KEY || '').digest('hex');
  if (!token || hash !== attendu) return new Response('forbidden', { status: 403 });

  // 2) On ne fait pas confiance au corps reçu : on redemande le statut à PayDunya.
  const c = await (await fetch(`${PD_BASE}/checkout-invoice/confirm/${token}`, { headers: pdHeaders() })).json();
  const statut = c.status || c.data?.status;
  const montant = Number(c.invoice?.total_amount ?? c.data?.invoice?.total_amount);
  if (statut !== 'completed') return ok('ignored');

  const { data: ab } = await admin.from('abonnements').select('*').eq('token', token).single();
  if (!ab || montant !== PRIX || ab.montant !== PRIX) return new Response('invalid', { status: 400 });

  // 3) Idempotence : on ne traite un paiement qu'une seule fois.
  const { data: maj } = await admin.from('abonnements')
    .update({ statut: 'paye' }).eq('id', ab.id).eq('statut', 'en_attente').select();
  if (!maj?.length) return ok('deja traite');

  // 4) On prolonge l'abonnement de 30 jours (cumulatif si déjà actif).
  const { data: ag } = await admin.from('agences').select('abonnement_fin').eq('id', ab.agence_id).single();
  const debut = Math.max(Date.now(), new Date(ag.abonnement_fin).getTime());
  await admin.from('agences').update({ abonnement_fin: new Date(debut + 30 * 864e5).toISOString() }).eq('id', ab.agence_id);
  return ok();
}
