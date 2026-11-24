-- À exécuter APRÈS schema.sql (Supabase > SQL Editor > New query > Run)
create function agence_active(aid uuid) returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from agences where id = aid and abonnement_fin > now()) $$;

create table annonces (
  id uuid primary key default gen_random_uuid(),
  agence_id uuid not null references agences on delete cascade,
  agence_nom text,
  titre text not null,
  categorie text not null check (categorie in ('appartement','chambre','maison','studio')),
  quartier text not null,
  prix int not null,
  telephone text not null,
  description text,
  photo_url text,
  publie boolean not null default true,
  created_at timestamptz not null default now()
);
create index on annonces (categorie, created_at desc);

alter table annonces enable row level security;
-- Tout le monde voit les annonces publiées dont l'agence a un abonnement actif.
create policy "public_lire" on annonces for select using (publie and agence_active(agence_id));
-- Une agence gère uniquement ses annonces (écriture bloquée si abonnement expiré).
create policy "agence_gere" on annonces for all
  using (agence_id in (select mine()))
  with check (agence_id in (select mine()) and active());
grant select on annonces to anon;

-- Photos : bucket public en lecture, écriture réservée au dossier de l'agence.
insert into storage.buckets (id, name, public) values ('annonces', 'annonces', true) on conflict do nothing;
create policy "photos_ajout" on storage.objects for insert to authenticated
  with check (bucket_id = 'annonces' and (storage.foldername(name))[1] in (select id::text from agences where owner = auth.uid()));
create policy "photos_suppression" on storage.objects for delete to authenticated
  using (bucket_id = 'annonces' and (storage.foldername(name))[1] in (select id::text from agences where owner = auth.uid()));
