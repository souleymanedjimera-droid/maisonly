# Publier maisonly — la méthode simple

**Temps : 10 minutes. Coût : 0 FCFA. Terminal : jamais.**

L'application crée ses tables **toute seule** au premier démarrage. Vous n'avez rien à installer ni aucune commande à taper.

Vous avez besoin d'un seul compte : **GitHub**. Tout le reste se fait dans le navigateur.

---

## Étape 1 — Envoyer le code sur GitHub (5 min)

1. Créez un compte sur [github.com](https://github.com) si vous n'en avez pas.
2. Cliquez sur le **+** en haut à droite → **New repository**.
3. Nom : `maisonly`. Cochez **Private**. Cliquez **Create repository**.
4. Sur la page suivante, cliquez sur le lien **uploading an existing file**.
5. Glissez tous les fichiers du projet dans la zone, puis cliquez **Commit changes**.

> ⚠️ **Ne glissez pas le fichier `.env`** (il contient vos accès locaux). Si vous ne le voyez pas dans la liste, c'est parfait.

---

## Étape 2 — Mettre le site en ligne (3 min)

1. Allez sur [vercel.com](https://vercel.com) → **Sign up with GitHub**.
2. Cliquez **Add New… → Project**.
3. Trouvez `maisonly` dans la liste → **Import**.
4. **Ne cliquez pas encore sur Deploy.** Ouvrez d'abord **Environment Variables** et ajoutez ces 4 lignes :

| Nom | Valeur | Exemple |
|---|---|---|
| `ADMIN_ACCESS_CODE` | votre code secret | `Teranga-2026-MonCode` |
| `WAVE_PAYMENT_NUMBER` | votre numéro Wave | `77 123 45 67` |
| `ORANGE_MONEY_PAYMENT_NUMBER` | votre numéro Orange Money | `78 123 45 67` |
| `FREE_MONEY_PAYMENT_NUMBER` | votre numéro Free Money | `76 123 45 67` |

5. Cliquez **Deploy** et attendez 1 minute.

🎉 Votre site est en ligne à l'adresse `https://maisonly-xxxx.vercel.app`.

---

## Étape 3 — Brancher la base de données (2 min)

Vous êtes toujours sur Vercel, c'est le même compte.

1. En haut du projet, cliquez sur l'onglet **Storage**.
2. Cliquez **Create Database** → choisissez **Postgres** → **Continue**.
3. Laissez les réglages par défaut → **Create**.
4. Dans la fenêtre qui s'ouvre, cliquez **Connect Project**, sélectionnez `maisonly`, puis **Connect**.

C'est terminé. Vercel ajoute la variable `DATABASE_URL` **automatiquement** — vous n'avez rien à copier.

Vercel relance le site tout seul. À la première visite, **l'application crée ses 11 tables et ses 9 listes de valeurs sans que vous touchiez à rien.**

---

## Étape 4 — Vérifier (30 secondes)

Ouvrez ces adresses dans votre navigateur :

| Adresse | Résultat attendu |
|---|---|
| `votre-url.vercel.app` | la page d'accueil maisonly |
| `votre-url.vercel.app/api/health` | `{"ok":true}` |
| `votre-url.vercel.app/register` | le formulaire d'inscription |
| `votre-url.vercel.app/admin` | demande de votre code d'accès |

Puis un test complet : créez une agence sur `/register` → la page de paiement affiche vos 3 numéros → déclarez une référence → validez-la dans `/admin` → l'espace de gestion s'ouvre.

**Si `/api/health` affiche `{"ok":true}`, tout est bon.**

---

## Votre vie après la publication

**Changer un numéro mobile money ou votre code admin**
Vercel → votre projet → **Settings → Environment Variables** → modifiez → **Deploy** (onglet Deployments → les 3 points → Redeploy).

**Ajouter une fonctionnalité plus tard**
Modifiez le fichier sur GitHub (bouton crayon ✏️ directement dans le navigateur). Vercel redéploie automatiquement en 1 minute. Rien d'autre à faire.

**Voir les agences inscrites et leurs paiements**
Ouvrez simplement `votre-url.vercel.app/admin` et tapez votre code.

**Votre propre nom de domaine `maisonly.sn`**
Achetez-le sur [nic.sn](https://www.nic.sn) (~15 000 FCFA/an), puis Vercel → **Settings → Domains → Add**. Vercel vous montre les enregistrements à recopier chez nic.sn. Le HTTPS est installé automatiquement.

---

## Si quelque chose ne va pas

**`/api/health` affiche `{"ok":false}`**
La base n'est pas encore connectée. Refaites l'étape 3 et vérifiez que la base est bien reliée au projet (onglet Storage → votre base → onglet **Projects** doit afficher `maisonly`).

**La page de paiement n'affiche pas mes numéros**
Une des variables `WAVE_PAYMENT_NUMBER`, `ORANGE_MONEY_PAYMENT_NUMBER` ou `FREE_MONEY_PAYMENT_NUMBER` est absente ou vide. Vérifiez l'étape 2, puis redéployez.

**J'ai oublié mon code `/admin`**
Vercel → Settings → Environment Variables → changez `ADMIN_ACCESS_CODE` → Redeploy.

**J'ai déjà fait un Deploy sans les variables**
Pas grave : ajoutez les variables, puis onglet **Deployments** → **⋯** → **Redeploy**.

---

## Combien ça coûte vraiment

| Étape | Coût |
|---|---|
| Démarrage (GitHub + Vercel Hobby + base Vercel gratuite) | **0 FCFA** |
| Quand vous avez plusieurs agences (Vercel Pro + base payante) | ~12 000 FCFA / mois |

Avec un abonnement à 25 000 FCFA par agence, **une seule agence couvre vos frais**.
