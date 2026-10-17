# Paiement des abonnements — Sénégal

L’abonnement maisonly est facturé **25 000 FCFA par mois et par agence**. Les agences paient par mobile money et vous validez chaque paiement manuellement depuis votre console.

## Parcours d’une agence

1. L’agence crée son compte (`/register`) avec ville et téléphone.
2. Elle est redirigée vers `/billing`, qui affiche vos numéros Wave, Orange Money et Free Money.
3. Elle envoie le montant, puis déclare l’identifiant de transaction reçu par SMS, avec le numéro payeur.
4. La déclaration apparaît dans votre console en « En attente ».
5. Vous validez : l’accès est ouvert immédiatement pour la durée payée (1, 3 ou 12 mois, cumulables).

Une référence de transaction ne peut être déclarée qu’une seule fois par opérateur.

## Votre console de validation

Ouvrez **`/admin`** et saisissez le code d’accès exploitant.

- Compteur de paiements en attente, validés et recettes validées.
- Filtres : en attente / validés / refusés / tous.
- Chaque dossier montre l’agence, le responsable, l’opérateur, la référence, le numéro payeur, le montant, la durée et la fin d’abonnement en cours.
- **Valider** ouvre l’accès pour la durée déclarée. Si l’abonnement est encore actif, la durée s’ajoute à la fin de période existante.
- **Refuser** rejette la déclaration avec une note visible par l’agence.

## Variables d’environnement

```text
ADMIN_ACCESS_CODE=...               # obligatoire en production, code de la console /admin
WAVE_PAYMENT_NUMBER=77 000 00 00
ORANGE_MONEY_PAYMENT_NUMBER=78 000 00 00
FREE_MONEY_PAYMENT_NUMBER=76 000 00 00
```

Tant qu’un numéro n’est pas configuré, l’onglet correspondant reste affiché mais le bouton de déclaration est désactivé avec un message clair. Le code d’accès a une valeur de développement (`maisonly-admin`) uniquement hors production : définissez toujours `ADMIN_ACCESS_CODE` en production.

## Accès et expiration

- L’accès à l’espace de gestion exige un abonnement `actif` avec une fin de période postérieure à la date du jour.
- À l’expiration, l’agence est redirigée vers `/billing` et toutes les routes de données répondent `402`.
- Chaque donnée (bien, locataire, bail, loyer, intervention) est liée à l’agence propriétaire : aucune fuite possible entre agences.
