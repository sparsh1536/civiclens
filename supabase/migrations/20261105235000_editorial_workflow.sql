-- Editorial intake access. The first editor/admin is provisioned out-of-band
-- after their Auth account exists; public sign-up never grants privileges.
create type public.editorial_role as enum ('researcher', 'editor', 'admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.editorial_role not null,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  unique (user_id, role)
);
create index user_roles_user_id_idx on public.user_roles(user_id);
create index user_roles_granted_by_idx on public.user_roles(granted_by);
alter table public.user_roles enable row level security;
grant select on public.user_roles to authenticated;
create policy "Users can read own editorial roles" on public.user_roles
  for select to authenticated using ((select auth.uid()) = user_id);

-- Editors can create and inspect drafts. Public readers still see published rows only.
create policy "Editors can create parties" on public.political_parties
  for insert to authenticated with check (exists (
    select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role in ('editor','admin')
  ));

create policy "Editors can read draft elections" on public.elections
  for select to authenticated using (visibility = 'draft' and exists (
    select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role in ('editor','admin')
  ));
create policy "Editors can create draft elections" on public.elections
  for insert to authenticated with check (visibility = 'draft' and exists (
    select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role in ('editor','admin')
  ));

create policy "Editors can read draft manifestos" on public.manifestos
  for select to authenticated using (visibility = 'draft' and exists (
    select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role in ('editor','admin')
  ));
create policy "Editors can create draft manifestos" on public.manifestos
  for insert to authenticated with check (visibility = 'draft' and exists (
    select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role in ('editor','admin')
  ));

create policy "Editors can read draft promises" on public.promises
  for select to authenticated using (visibility = 'draft' and exists (
    select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role in ('editor','admin')
  ));
create policy "Editors can create draft promises" on public.promises
  for insert to authenticated with check (visibility = 'draft' and exists (
    select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role in ('editor','admin')
  ));

create policy "Editors can read draft evidence" on public.evidence
  for select to authenticated using (visibility = 'draft' and exists (
    select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role in ('editor','admin')
  ));
create policy "Editors can create draft evidence" on public.evidence
  for insert to authenticated with check (visibility = 'draft' and exists (
    select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role in ('editor','admin')
  ));

create policy "Editors can read draft promise evidence" on public.promise_evidence
  for select to authenticated using (
    exists (select 1 from public.promises p where p.id = promise_id and p.visibility = 'draft')
    and exists (select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role in ('editor','admin'))
  );
create policy "Editors can link draft promise evidence" on public.promise_evidence
  for insert to authenticated with check (
    exists (select 1 from public.promises p where p.id = promise_id and p.visibility = 'draft')
    and exists (select 1 from public.evidence e where e.id = evidence_id and e.visibility = 'draft')
    and exists (select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role in ('editor','admin'))
  );

grant insert on public.political_parties to authenticated;
grant insert on public.elections to authenticated;
grant insert on public.manifestos to authenticated;
grant insert on public.promises to authenticated;
grant insert on public.evidence to authenticated;
grant insert on public.promise_evidence to authenticated;

-- Admin-only publication gate. A published row is not editable through these policies.
create policy "Admins can publish elections" on public.elections for update to authenticated
  using (visibility = 'draft' and exists (
    select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role = 'admin'
  )) with check (visibility in ('draft','published','archived') and exists (
    select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role = 'admin'
  ));
create policy "Admins can publish manifestos" on public.manifestos for update to authenticated
  using (visibility = 'draft' and exists (
    select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role = 'admin'
  )) with check (visibility in ('draft','published','archived') and exists (
    select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role = 'admin'
  ));
grant update on public.elections to authenticated;
grant update on public.manifestos to authenticated;

-- A transactional RPC was prototyped during setup but deliberately has no EXECUTE
-- grant; the application uses the user's RLS-scoped table client for intake instead.

-- Inactive transactional prototype retained in the database with no EXECUTE grants.
-- Application intake currently uses direct RLS-scoped inserts.
create or replace function public.create_commitment_draft(
  p_jurisdiction_id uuid, p_party_name text, p_party_abbreviation text,
  p_election_type text, p_election_date date, p_term_label text,
  p_manifesto_title text, p_manifesto_url text,
  p_promise_title text, p_promise_description text, p_category text, p_target_group text, p_target_date date,
  p_evidence_title text, p_evidence_publisher text, p_evidence_type public.evidence_type,
  p_evidence_url text, p_evidence_published_at date, p_evidence_summary text
) returns uuid
language plpgsql security invoker set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_party uuid;
  v_election uuid;
  v_manifesto uuid;
  v_promise uuid;
  v_evidence uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.user_roles r where r.user_id = v_user and r.role in ('editor','admin')) then
    raise exception 'Editorial access required';
  end if;
  insert into public.political_parties(name, abbreviation)
    values (trim(p_party_name), nullif(trim(p_party_abbreviation), ''))
    on conflict (name, abbreviation) do nothing returning id into v_party;
  if v_party is null then
    select id into v_party from public.political_parties
    where name = trim(p_party_name) and abbreviation is not distinct from nullif(trim(p_party_abbreviation), '');
  end if;
  insert into public.elections(jurisdiction_id, election_type, election_date, term_label, visibility)
    values (p_jurisdiction_id, trim(p_election_type), p_election_date, nullif(trim(p_term_label), ''), 'draft')
    on conflict (jurisdiction_id, election_type, election_date) do nothing returning id into v_election;
  if v_election is null then
    select id into v_election from public.elections
    where jurisdiction_id = p_jurisdiction_id and election_type = trim(p_election_type) and election_date = p_election_date;
  end if;
  insert into public.manifestos(election_id, party_id, title, document_url, visibility)
    values (v_election, v_party, trim(p_manifesto_title), trim(p_manifesto_url), 'draft')
    on conflict (election_id, party_id, language_code) do nothing returning id into v_manifesto;
  if v_manifesto is null then
    select id into v_manifesto from public.manifestos
    where election_id = v_election and party_id = v_party and language_code = 'en';
  end if;
  insert into public.promises(manifesto_id, title, description, category, target_group, target_date, visibility)
    values (v_manifesto, trim(p_promise_title), trim(p_promise_description), trim(p_category), nullif(trim(p_target_group), ''), p_target_date, 'draft')
    returning id into v_promise;
  insert into public.evidence(title, publisher, source_type, source_url, published_at, summary, visibility, submitted_by)
    values (trim(p_evidence_title), trim(p_evidence_publisher), p_evidence_type, trim(p_evidence_url), p_evidence_published_at, nullif(trim(p_evidence_summary), ''), 'draft', v_user)
    returning id into v_evidence;
  insert into public.promise_evidence(promise_id, evidence_id, relationship, notes)
    values (v_promise, v_evidence, 'source', 'Initial source captured with the commitment draft.');
  return v_promise;
end;
$$;
revoke execute on function public.create_commitment_draft(uuid,text,text,text,date,text,text,text,text,text,text,text,date,text,text,public.evidence_type,text,date,text) from public;
revoke execute on function public.create_commitment_draft(uuid,text,text,text,date,text,text,text,text,text,text,text,date,text,text,public.evidence_type,text,date,text) from anon;
