# Publier maisonly — la démarche simple

Temps nécessaire : **20 à 30 minutes**. Coût de démarrage : **0 FCFA**.
Aucune compétence en serveur requise : on utilise deux services en ligne qui font tout.

## Ce dont vous avez besoin

- Un ordinateur avec ce projet ouvert.
- Un compte **Google** ou **GitHub** (si vous n'en avez pas, GitHub se crée en 2 minutes).

Vous allez créer 3 comptes gratuits : **GitHub** (le code), **Neon** (la base de données), **Vercel** (le site en ligne).

---

## Étape 1 — Mettre le code sur GitHub

1. Allez sur [github.com](https://github.com) et créez un compte.
2. Cliquez sur **New repository**, nommez-le `maisonly`, laissez-le **Private**, puis **Create**.
3. Dans le terminal, à la racine du projet, exécutez ces lignes une par une :

```bash
git init
git add -A
git commit -m "maisonly"
git branch -M main
git remote add origin https://github.com/VOTRE-NOM/maisonly.git
git push -u origin main
```

Remplacez `VOTRE-NOM` par votre nom d'utilisateur GitHub. GitHub vous demandera de vous connecter.

> **Important** : le fichier `.env` n'est pas envoyé sur GitHub, c'est normal et souhaité. Vos secrets seront saisis directement chez Vercel à l'étape 3.

---

## Étape 2 — Créer la base de données sur Neon

1. Allez sur [neon.com](https://neon.com) et créez un compte (bouton **Sign up with GitHub**).
2. Neon crée automatiquement un projet. Sur le tableau de bord, cherchez la section **Connection string**.
3. Copiez la chaîne qui ressemble à :

```
postgresql://neondb_owner:AbCdEfGh@ep-xxxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

4. Collez-la dans un fichier texte temporaire : c'est votre `DATABASE_URL`.

> Gardez bien la partie `?sslmode=require` et le mot `-pooler` dans l'adresse : ils sont nécessaires.

---

## Étape 3 — Mettre le site en ligne sur Vercel

1. Allez sur [vercel.com](https://vercel.com) et cliquez **Sign up with GitHub**.
2. Cliquez **Add New → Project**, puis autorisez l'accès et sélectionnez votre dépôt `maisonly`.
3. Avant de cliquer sur Deploy, ouvrez **Environment Variables** et ajoutez ces 5 lignes
   (une par une : nom à gauche, valeur à droite) :

| Nom | Valeur |
|---|---|
| `DATABASE_URL` | la chaîne copiée à l'étape 2 |
| `ADMIN_ACCESS_CODE` | un code secret à vous, ex. `Teranga-2026-MonCode` |
| `WAVE_PAYMENT_NUMBER` | votre numéro Wave, ex. `77 123 45 67` |
| `ORANGE_MONEY_PAYMENT_NUMBER` | votre numéro Orange Money, ex. `78 123 45 67` |
| `FREE_MONEY_PAYMENT_NUMBER` | votre numéro Free Money, ex. `76 123 45 67` |

4. Cliquez **Deploy** et attendez environ 1 minute.

Vercel affiche une adresse du type `https://maisonly-xxxx.vercel.app` : **votre site est en ligne**.

---

## Étape 4 — Créer les tables dans la base (une seule fois)

Dans le terminal, toujours à la racine du projet :

```bash
set DATABASE_URL
```

Non — sur Mac/Linux ou Windows, collez simplement votre chaîne Neon dans une commande :

```bash
DATABASE_URL="collez-ici-votre-chaîne-neon" npx drizzle-kit push
```

Quand le message affiche `Changes applied`, vos tables sont créées. Cette étape ne se fait qu'une fois.

---

## Étape 5 — Vérifier que tout fonctionne

Ouvrez ces adresses dans votre navigateur, en remplaçant par votre URL Vercel :

| Adresse | Ce que vous devez voir |
|---|---|
| `/` | la page d'accueil maisonly |
| `/api/health` | `{"ok":true}` |
| `/register` | le formulaire d'inscription agence |
| `/admin` | la demande de votre code d'accès |

Puis testez un parcours complet :

1. Créez un compte agence sur `/register`.
2. Vous arrivez sur la page de paiement : vos numéros Wave / Orange Money / Free Money doivent s'afficher.
3. Déclarez une fausse référence : elle apparaît dans `/admin` en « En attente ».
4. Validez-la depuis `/admin` : l'accès à l'espace de gestion s'ouvre.

---

## Étape 6 (facultative) — Votre propre nom de domaine

Pour une adresse professionnelle comme `maisonly.sn` :

1. Achetez le domaine auprès de [NIC Sénégal](https://www.nic.sn) (~15 000 FCFA/an pour un `.sn`) ou chez Namecheap pour un `.com`.
2. Dans Vercel : **Settings → Domains → Add**, saisissez votre domaine.
3. Vercel affiche des enregistrements DNS : copiez-les dans la gestion DNS de votre registrar.
4. Attendez quelques heures, le certificat HTTPS est installé automatiquement.

> **Le HTTPS est indispensable** : l'application refuse les cookies de session sans connexion sécurisée. L'adresse fournie par Vercel est déjà en HTTPS, donc le site fonctionne même sans domaine personnalisé.

---

## Questions fréquentes

**Combien ça coûte ?**
0 FCFA pour démarrer. Neon et Vercel ont un niveau gratuit. Quand vous aurez beaucoup d'agences, comptez environ 12 000 FCFA/mois au total (Neon Launch ~19 $ + Vercel Pro 20 $).

**Le site peut-il tomber en panne ?**
Non, Vercel et Neon gèrent tout : sauvegardes, mises à jour de sécurité, redémarrage automatique.

**Comment mettre à jour le site plus tard ?**
Modifiez le code, puis `git push`. Vercel redéploie automatiquement en 1 minute.

**Comment créer les tables sur une nouvelle base ?**
Rejouez la commande de l'étape 4 avec la nouvelle `DATABASE_URL`.

**Où est stocké l'argent des abonnements ?**
Chez vous : les agences vous envoient le montant par Wave / Orange Money / Free Money, et vous validez dans `/admin`. Aucun intermédiaire de paiement, aucune commission.

**J'ai perdu l'accès à `/admin`.**
Changez `ADMIN_ACCESS_CODE` dans Vercel (**Settings → Environment Variables**), puis **Deploy** à nouveau.
