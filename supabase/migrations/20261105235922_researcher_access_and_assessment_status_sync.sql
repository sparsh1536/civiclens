drop policy if exists "Editors can read draft promises" on public.promises;
create policy "Editorial team can read draft promises" on public.promises for select to authenticated
  using (visibility='draft' and exists (select 1 from public.user_roles r
    where r.user_id=(select auth.uid()) and r.role in ('researcher','editor','admin')));
drop policy if exists "Editors can read draft evidence" on public.evidence;
create policy "Editorial team can read draft evidence" on public.evidence for select to authenticated
  using (visibility='draft' and (submitted_by=(select auth.uid()) or exists (
    select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('editor','admin'))));
drop policy if exists "Editors can read draft promise evidence" on public.promise_evidence;
create policy "Editorial team can read draft promise evidence" on public.promise_evidence for select to authenticated
  using (exists(select 1 from public.promises p where p.id=promise_id and p.visibility='draft')
    and exists(select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('researcher','editor','admin')));
create policy "Authors and reviewers can read assessment evidence drafts" on public.assessment_evidence
  for select to authenticated using (exists(select 1 from public.assessments a
    where a.id=assessment_id and a.visibility='draft' and (a.created_by=(select auth.uid()) or
      (a.review_state='in_review' and a.created_by<>(select auth.uid()) and exists(
        select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('editor','admin'))))));

create or replace function public.sync_promise_status_after_assessment_publication()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if NEW.visibility='published' and OLD.visibility is distinct from NEW.visibility then
    update public.promises set status=case
      when NEW.status='insufficient_evidence' then 'not_assessed'::public.promise_status
      else NEW.status::text::public.promise_status end,
      updated_at=now() where id=NEW.promise_id;
  end if;
  return NEW;
end; $$;
revoke all on function public.sync_promise_status_after_assessment_publication() from public,anon,authenticated;
create trigger sync_promise_status_on_assessment_publish after update of visibility on public.assessments
  for each row execute function public.sync_promise_status_after_assessment_publication();
