-- À exécuter dans Supabase > SQL Editor
create table agences (
  id uuid primary key default gen_random_uuid(),
  owner uuid unique not null references auth.users on delete cascade,
  nom text not null,
  commission int not null default 10,
  abonnement_fin timestamptz not null default now()
);
create table biens (
  id uuid primary key default gen_random_uuid(),
  agence_id uuid not null references agences on delete cascade,
  nom text not null, adresse text, loyer int not null default 0, proprio text
);
create table locataires (
  id uuid primary key default gen_random_uuid(),
  agence_id uuid not null references agences on delete cascade,
  nom text not null, tel text, bien_id uuid references biens on delete set null
);
create table paiements (
  id uuid primary key default gen_random_uuid(),
  agence_id uuid not null references agences on delete cascade,
  locataire_id uuid not null references locataires on delete cascade,
  bien_id uuid references biens on delete set null,
  mois text not null, montant int not null,
  unique (locataire_id, mois)
);
create table abonnements (
  id uuid primary key default gen_random_uuid(),
  agence_id uuid not null references agences on delete cascade,
  token text unique not null, montant int not null,
  statut text not null default 'en_attente',
  created_at timestamptz not null default now()
);

create function mine() returns setof uuid language sql stable security definer set search_path = public
as $$ select id from agences where owner = auth.uid() $$;
create function active() returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from agences where owner = auth.uid() and abonnement_fin > now()) $$;

alter table agences enable row level security;
create policy "agence_proprio" on agences for all using (owner = auth.uid()) with check (owner = auth.uid());
-- L'utilisateur ne peut JAMAIS modifier abonnement_fin : seul le webhook (service role) le peut.
revoke insert, update on agences from authenticated;
grant insert (owner, nom) on agences to authenticated;
grant update (nom, commission) on agences to authenticated;

do $$ declare t text; begin
  foreach t in array array['biens','locataires','paiements'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "acces_agence" on %I for all using (agence_id in (select mine())) with check (agence_id in (select mine()) and active())', t);
  end loop;
end $$;

alter table abonnements enable row level security;
create policy "lire_abonnements" on abonnements for select using (agence_id in (select mine()));
