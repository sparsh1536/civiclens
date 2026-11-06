-- CivicLens initial schema
-- Public governance records are readable by everyone; user workspaces are private.
-- Only a trusted ingestion/admin service should write public records in this phase.

create extension if not exists pgcrypto;

create type public.jurisdiction_level as enum ('national', 'state');
create type public.record_visibility as enum ('draft', 'published', 'archived');
create type public.promise_status as enum (
  'not_assessed', 'not_started', 'in_progress', 'fulfilled',
  'partially_fulfilled', 'not_fulfilled', 'disputed'
);
create type public.evidence_type as enum (
  'government_document', 'official_dataset', 'parliament_record',
  'audit_report', 'court_record', 'research_paper', 'news_report', 'other'
);
create type public.assessment_status as enum (
  'not_assessed', 'in_progress', 'fulfilled', 'partially_fulfilled',
  'not_fulfilled', 'disputed', 'insufficient_evidence'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.jurisdictions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  level public.jurisdiction_level not null,
  state_code char(2),
  created_at timestamptz not null default now(),
  constraint jurisdiction_state_code_check check (
    (level = 'national' and state_code is null) or
    (level = 'state' and state_code is not null)
  )
);

create table public.political_parties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  abbreviation text,
  official_website text,
  created_at timestamptz not null default now(),
  unique (name, abbreviation)
);

create table public.elections (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references public.jurisdictions(id),
  election_type text not null,
  election_date date not null,
  term_label text,
  source_url text,
  visibility public.record_visibility not null default 'draft',
  created_at timestamptz not null default now(),
  unique (jurisdiction_id, election_type, election_date)
);

create table public.governments (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references public.jurisdictions(id),
  name text not null,
  leader_name text,
  party_id uuid references public.political_parties(id),
  coalition_name text,
  term_start date not null,
  term_end date,
  source_url text,
  visibility public.record_visibility not null default 'draft',
  created_at timestamptz not null default now(),
  constraint government_term_check check (term_end is null or term_end >= term_start)
);

create table public.manifestos (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections(id),
  party_id uuid not null references public.political_parties(id),
  title text not null,
  document_url text not null,
  published_at date,
  language_code text not null default 'en',
  visibility public.record_visibility not null default 'draft',
  created_at timestamptz not null default now(),
  unique (election_id, party_id, language_code)
);

create table public.promises (
  id uuid primary key default gen_random_uuid(),
  manifesto_id uuid not null references public.manifestos(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  target_group text,
  target_date date,
  status public.promise_status not null default 'not_assessed',
  visibility public.record_visibility not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  publisher text not null,
  source_type public.evidence_type not null,
  source_url text not null,
  archived_url text,
  published_at date,
  accessed_at timestamptz not null default now(),
  summary text,
  content_hash text,
  visibility public.record_visibility not null default 'draft',
  submitted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint evidence_url_nonempty check (length(trim(source_url)) > 0)
);

create table public.promise_evidence (
  promise_id uuid not null references public.promises(id) on delete cascade,
  evidence_id uuid not null references public.evidence(id) on delete cascade,
  relationship text not null default 'context',
  notes text,
  created_at timestamptz not null default now(),
  primary key (promise_id, evidence_id)
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  promise_id uuid not null references public.promises(id) on delete cascade,
  status public.assessment_status not null,
  rationale text not null,
  confidence numeric(4,3) check (confidence between 0 and 1),
  methodology_version text not null default '1.0',
  assessed_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  visibility public.record_visibility not null default 'draft',
  supersedes_id uuid references public.assessments(id),
  created_at timestamptz not null default now()
);

create table public.assessment_evidence (
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  evidence_id uuid not null references public.evidence(id),
  supports_assessment boolean not null,
  explanation text,
  primary key (assessment_id, evidence_id)
);

create table public.policies (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references public.jurisdictions(id),
  government_id uuid references public.governments(id),
  name text not null,
  description text not null,
  policy_area text not null,
  announced_on date,
  effective_from date,
  source_url text,
  visibility public.record_visibility not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.budget_records (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references public.jurisdictions(id),
  financial_year text not null,
  ministry_or_department text not null,
  scheme_name text,
  budget_stage text not null check (budget_stage in ('budget_estimate','revised_estimate','actuals')),
  amount_inr numeric(20,2) not null check (amount_inr >= 0),
  source_url text not null,
  visibility public.record_visibility not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.user_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  promise_id uuid not null references public.promises(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, promise_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  change_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index elections_jurisdiction_date_idx on public.elections(jurisdiction_id, election_date desc);
create index governments_jurisdiction_term_idx on public.governments(jurisdiction_id, term_start desc);
create index manifestos_election_idx on public.manifestos(election_id);
create index promises_manifesto_category_idx on public.promises(manifesto_id, category);
create index promises_status_idx on public.promises(status);
create index evidence_publisher_idx on public.evidence(publisher);
create index assessments_promise_assessed_idx on public.assessments(promise_id, assessed_at desc);
create index policies_jurisdiction_area_idx on public.policies(jurisdiction_id, policy_area);
create index budget_records_jurisdiction_year_idx on public.budget_records(jurisdiction_id, financial_year);
create index user_bookmarks_user_idx on public.user_bookmarks(user_id);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);

-- Every exposed table has RLS. Public records are visible only once published.
alter table public.profiles enable row level security;
alter table public.jurisdictions enable row level security;
alter table public.political_parties enable row level security;
alter table public.elections enable row level security;
alter table public.governments enable row level security;
alter table public.manifestos enable row level security;
alter table public.promises enable row level security;
alter table public.evidence enable row level security;
alter table public.promise_evidence enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_evidence enable row level security;
alter table public.policies enable row level security;
alter table public.budget_records enable row level security;
alter table public.user_bookmarks enable row level security;
alter table public.audit_logs enable row level security;

-- Restrict default privileges before granting the minimum required access.
revoke all on public.profiles, public.jurisdictions, public.political_parties,
  public.elections, public.governments, public.manifestos, public.promises,
  public.evidence, public.promise_evidence, public.assessments,
  public.assessment_evidence, public.policies, public.budget_records,
  public.user_bookmarks, public.audit_logs from anon, authenticated;

grant select on public.jurisdictions, public.political_parties to anon, authenticated;
grant select on public.elections, public.governments, public.manifestos,
  public.promises, public.evidence, public.promise_evidence, public.assessments,
  public.assessment_evidence, public.policies, public.budget_records to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, delete on public.user_bookmarks to authenticated;

create policy "Published jurisdictions are public" on public.jurisdictions
  for select to anon, authenticated using (true);
create policy "Public can read parties" on public.political_parties
  for select to anon, authenticated using (true);

create policy "Published elections are public" on public.elections
  for select to anon, authenticated using (visibility = 'published');
create policy "Published governments are public" on public.governments
  for select to anon, authenticated using (visibility = 'published');
create policy "Published manifestos are public" on public.manifestos
  for select to anon, authenticated using (visibility = 'published');
create policy "Published promises are public" on public.promises
  for select to anon, authenticated using (visibility = 'published');
create policy "Published evidence is public" on public.evidence
  for select to anon, authenticated using (visibility = 'published');
create policy "Evidence links for published promises are public" on public.promise_evidence
  for select to anon, authenticated using (
    exists (select 1 from public.promises p where p.id = promise_id and p.visibility = 'published')
    and exists (select 1 from public.evidence e where e.id = evidence_id and e.visibility = 'published')
  );
create policy "Published assessments are public" on public.assessments
  for select to anon, authenticated using (
    visibility = 'published' and exists (
      select 1 from public.promises p where p.id = promise_id and p.visibility = 'published'
    )
  );
create policy "Evidence linked to published assessments is public" on public.assessment_evidence
  for select to anon, authenticated using (
    exists (select 1 from public.assessments a where a.id = assessment_id and a.visibility = 'published')
    and exists (select 1 from public.evidence e where e.id = evidence_id and e.visibility = 'published')
  );
create policy "Published policies are public" on public.policies
  for select to anon, authenticated using (visibility = 'published');
create policy "Published budget records are public" on public.budget_records
  for select to anon, authenticated using (visibility = 'published');

create policy "Users can read their own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Users can create their own profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users can read their own bookmarks" on public.user_bookmarks
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can bookmark published promises" on public.user_bookmarks
  for insert to authenticated with check (
    (select auth.uid()) = user_id and exists (
      select 1 from public.promises p where p.id = promise_id and p.visibility = 'published'
    )
  );
create policy "Users can remove their own bookmarks" on public.user_bookmarks
  for delete to authenticated using ((select auth.uid()) = user_id);

-- No direct client grants or policies for audit_logs: service-side writes only.

insert into public.jurisdictions (name, slug, level, state_code) values
  ('India', 'india', 'national', null),
  ('Andhra Pradesh', 'andhra-pradesh', 'state', 'AP'),
  ('Arunachal Pradesh', 'arunachal-pradesh', 'state', 'AR'),
  ('Assam', 'assam', 'state', 'AS'),
  ('Bihar', 'bihar', 'state', 'BR'),
  ('Chhattisgarh', 'chhattisgarh', 'state', 'CG'),
  ('Goa', 'goa', 'state', 'GA'),
  ('Gujarat', 'gujarat', 'state', 'GJ'),
  ('Haryana', 'haryana', 'state', 'HR'),
  ('Himachal Pradesh', 'himachal-pradesh', 'state', 'HP'),
  ('Jharkhand', 'jharkhand', 'state', 'JH'),
  ('Karnataka', 'karnataka', 'state', 'KA'),
  ('Kerala', 'kerala', 'state', 'KL'),
  ('Madhya Pradesh', 'madhya-pradesh', 'state', 'MP'),
  ('Maharashtra', 'maharashtra', 'state', 'MH'),
  ('Manipur', 'manipur', 'state', 'MN'),
  ('Meghalaya', 'meghalaya', 'state', 'ML'),
  ('Mizoram', 'mizoram', 'state', 'MZ'),
  ('Nagaland', 'nagaland', 'state', 'NL'),
  ('Odisha', 'odisha', 'state', 'OD'),
  ('Punjab', 'punjab', 'state', 'PB'),
  ('Rajasthan', 'rajasthan', 'state', 'RJ'),
  ('Sikkim', 'sikkim', 'state', 'SK'),
  ('Tamil Nadu', 'tamil-nadu', 'state', 'TN'),
  ('Telangana', 'telangana', 'state', 'TG'),
  ('Tripura', 'tripura', 'state', 'TR'),
  ('Uttar Pradesh', 'uttar-pradesh', 'state', 'UP'),
  ('Uttarakhand', 'uttarakhand', 'state', 'UK'),
  ('West Bengal', 'west-bengal', 'state', 'WB')
on conflict (slug) do nothing;

-- Explicitly deny browser roles access to the internal audit trail.
create policy "Audit logs are not exposed to client roles" on public.audit_logs
  for all to anon, authenticated using (false) with check (false);

-- Cover foreign keys used for joins and referential actions.
create index if not exists assessment_evidence_evidence_id_idx on public.assessment_evidence(evidence_id);
create index if not exists assessments_reviewed_by_idx on public.assessments(reviewed_by);
create index if not exists assessments_supersedes_id_idx on public.assessments(supersedes_id);
create index if not exists audit_logs_actor_id_idx on public.audit_logs(actor_id);
create index if not exists evidence_submitted_by_idx on public.evidence(submitted_by);
create index if not exists governments_party_id_idx on public.governments(party_id);
create index if not exists manifestos_party_id_idx on public.manifestos(party_id);
create index if not exists policies_government_id_idx on public.policies(government_id);
create index if not exists promise_evidence_evidence_id_idx on public.promise_evidence(evidence_id);
create index if not exists user_bookmarks_promise_id_idx on public.user_bookmarks(promise_id);
