import { admin, PRIX, PD_BASE, pdHeaders } from '../../../lib/admin';

export async function POST(req) {
  const jwt = (req.headers.get('authorization') || '').replace('Bearer ', '');
  const { data: { user } } = await admin.auth.getUser(jwt);
  if (!user) return Response.json({ error: 'Non connecté' }, { status: 401 });

  const { data: ag } = await admin.from('agences').select('id').eq('owner', user.id).single();
  if (!ag) return Response.json({ error: 'Agence introuvable' }, { status: 404 });

  const site = process.env.NEXT_PUBLIC_SITE_URL;
  const r = await fetch(`${PD_BASE}/checkout-invoice/create`, {
    method: 'POST',
    headers: pdHeaders(),
    body: JSON.stringify({
      invoice: { total_amount: PRIX, description: 'Abonnement Maisonly (30 jours)' },
      store: { name: 'Maisonly' },
      actions: {
        callback_url: `${site}/api/paydunya/ipn`,
        return_url: `${site}/dashboard?paiement=retour`,
        cancel_url: `${site}/dashboard`,
      },
      custom_data: { agence_id: ag.id },
    }),
  });
  const j = await r.json();
  if (j.response_code !== '00') return Response.json({ error: j.response_text || 'Paiement indisponible' }, { status: 502 });

  await admin.from('abonnements').insert({ agence_id: ag.id, token: j.token, montant: PRIX });
  return Response.json({ url: j.response_text });
}
