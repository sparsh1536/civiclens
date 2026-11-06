alter table public.assessments add column if not exists review_state text not null default 'draft'
  check (review_state in ('draft','in_review','changes_requested','published'));
drop policy if exists "Reviewers can publish independent assessments" on public.assessments;
create policy "Authors can revise their own draft assessments" on public.assessments
  for update to authenticated using (
    visibility='draft' and created_by=(select auth.uid()) and review_state in ('draft','changes_requested')
  ) with check (
    visibility='draft' and created_by=(select auth.uid()) and review_state in ('draft','in_review') and reviewed_by is null
  );
create policy "Independent reviewers can decide submitted assessments" on public.assessments
  for update to authenticated using (
    visibility='draft' and review_state='in_review' and created_by is not null and created_by<>(select auth.uid())
    and exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('editor','admin'))
  ) with check (
    review_state in ('changes_requested','published') and reviewed_by=(select auth.uid())
    and created_by<>(select auth.uid())
    and ((review_state='published' and visibility='published') or (review_state='changes_requested' and visibility='draft'))
    and exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('editor','admin'))
  );
revoke update on public.assessments from authenticated;
grant update (status,rationale,confidence,methodology_version,review_state,visibility,reviewed_by,review_notes) on public.assessments to authenticated;
create policy "Authors can remove evidence from own draft assessments" on public.assessment_evidence
  for delete to authenticated using (exists (
    select 1 from public.assessments a where a.id=assessment_id and a.visibility='draft'
      and a.created_by=(select auth.uid()) and a.review_state in ('draft','changes_requested')
  ));
grant delete on public.assessment_evidence to authenticated;

create or replace function public.capture_civiclens_audit_event()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_actor uuid := auth.uid();
  v_entity_type text := TG_TABLE_NAME;
  v_entity_id uuid := coalesce(NEW.id, OLD.id);
  v_action text;
  v_summary jsonb;
begin
  if TG_OP='INSERT' then
    v_action := 'created'; v_summary := jsonb_build_object('visibility', NEW.visibility);
  elsif TG_OP='UPDATE' and TG_TABLE_NAME='assessments' and NEW.review_state is distinct from OLD.review_state then
    v_action := 'review_state_changed';
    v_summary := jsonb_build_object('from',OLD.review_state,'to',NEW.review_state,'review_notes',NEW.review_notes);
  elsif TG_OP='UPDATE' and NEW.visibility is distinct from OLD.visibility then
    v_action := 'visibility_changed'; v_summary := jsonb_build_object('from',OLD.visibility,'to',NEW.visibility);
  else return NEW;
  end if;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,change_summary)
    values(v_actor,v_action,v_entity_type,v_entity_id,v_summary);
  return NEW;
end; $$;
revoke all on function public.capture_civiclens_audit_event() from public,anon,authenticated;
create trigger audit_assessment_review_state after update of review_state on public.assessments
  for each row execute function public.capture_civiclens_audit_event();
