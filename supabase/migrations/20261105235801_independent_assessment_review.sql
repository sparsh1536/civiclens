-- Authors can prepare private assessment drafts; a different editor/admin reviews them.
alter table public.assessments
  add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.assessments alter column created_by set default auth.uid();
create index if not exists assessments_created_by_idx on public.assessments(created_by);

create policy "Researchers can read own assessment drafts" on public.assessments
  for select to authenticated using (visibility='draft' and (
    created_by=(select auth.uid()) or exists (
      select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('editor','admin')
    )
  ));
create policy "Researchers can create assessment drafts" on public.assessments
  for insert to authenticated with check (
    visibility='draft' and created_by=(select auth.uid()) and reviewed_by is null
    and exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('researcher','editor','admin'))
  );
grant insert on public.assessments to authenticated;

create policy "Reviewers can publish independent assessments" on public.assessments
  for update to authenticated using (
    visibility='draft' and created_by is not null and created_by<>(select auth.uid())
    and exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('editor','admin'))
  ) with check (
    visibility in ('draft','published','archived') and reviewed_by=(select auth.uid())
    and created_by<>(select auth.uid())
    and exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('editor','admin'))
  );
revoke update on public.assessments from authenticated;
grant update (visibility, reviewed_by) on public.assessments to authenticated;

create policy "Editors can attach evidence to assessment drafts" on public.assessment_evidence
  for insert to authenticated with check (
    exists (select 1 from public.assessments a where a.id=assessment_id and a.visibility='draft' and a.created_by=(select auth.uid()))
    and exists (select 1 from public.evidence e where e.id=evidence_id and (
      e.visibility='published' or (e.visibility='draft' and e.submitted_by=(select auth.uid()))
    ))
    and exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('researcher','editor','admin'))
  );
grant insert on public.assessment_evidence to authenticated;
