# Maisonly — Next.js + Supabase + PayDunya

## 1. Supabase
1. Créez un projet sur supabase.com.
2. SQL Editor : collez et exécutez `supabase/schema.sql`, puis dans une nouvelle requête `supabase/annonces.sql` (annonces publiques et photos).
3. Project Settings > API : copiez l'URL, la clé `anon` et la clé `service_role`.
4. (Facultatif au début) Authentication > Providers > Email : désactivez « Confirm email » pour tester vite.

## 2. PayDunya (Wave + Orange Money Sénégal)
1. Créez un compte Business sur paydunya.com.
2. Menu « Intégration API » > « Configurer une nouvelle application » : récupérez Master Key, Private Key et Token (mode test d'abord).
3. Dans les paramètres du compte, activez les moyens de paiement Wave et Orange Money Sénégal.
4. Aucune URL de webhook à saisir : l'app l'envoie à chaque facture (`/api/paydunya/ipn`).

## 3. Vercel
1. Poussez ce dossier sur GitHub, puis « Add New Project » dans Vercel et importez le dépôt.
2. Ajoutez les variables de `.env.example` (Settings > Environment Variables).
   `NEXT_PUBLIC_SITE_URL` = l'URL finale (ex. https://maisonly.vercel.app).
3. Déployez. Testez avec `PAYDUNYA_MODE=test`.

## 4. Passage en production
Remplacez les clés par celles du mode « live », mettez `PAYDUNYA_MODE=live`, redéployez.

## Sécurité du paiement
- `abonnement_fin` n'est modifiable que par le serveur (droits SQL + clé service_role).
- Le webhook vérifie le hash SHA-512 de la clé principale, puis redemande le statut à PayDunya, contrôle le montant et ne traite chaque paiement qu'une fois.
- Sans abonnement actif, la base refuse toute écriture (RLS), pas seulement l'interface.

## À porter ensuite depuis la démo `index.html`
Dépenses/travaux, reversements propriétaires avec commission, quittances imprimables, graphiques.

## Annonces publiques
La page d'accueil (`/`) affiche les annonces avec recherche par catégorie et quartier. Les agences se connectent sur `/connexion`, onglet « Annonces ».
