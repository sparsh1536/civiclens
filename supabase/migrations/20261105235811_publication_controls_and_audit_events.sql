-- Keep publication permissions column-scoped and record important changes server-side.
alter table public.assessments add column if not exists review_notes text;
revoke update on public.elections from authenticated;
grant update (visibility) on public.elections to authenticated;
revoke update on public.manifestos from authenticated;
grant update (visibility) on public.manifestos to authenticated;
revoke update on public.assessments from authenticated;
grant update (visibility, reviewed_by, review_notes) on public.assessments to authenticated;

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
  elsif TG_OP='UPDATE' and NEW.visibility is distinct from OLD.visibility then
    v_action := 'visibility_changed'; v_summary := jsonb_build_object('from', OLD.visibility, 'to', NEW.visibility);
  else return NEW;
  end if;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,change_summary)
    values(v_actor,v_action,v_entity_type,v_entity_id,v_summary);
  return NEW;
end; $$;
revoke all on function public.capture_civiclens_audit_event() from public,anon,authenticated;

create trigger audit_assessment_insert after insert on public.assessments
  for each row execute function public.capture_civiclens_audit_event();
create trigger audit_assessment_visibility after update of visibility on public.assessments
  for each row execute function public.capture_civiclens_audit_event();
create trigger audit_promise_visibility after update of visibility on public.promises
  for each row execute function public.capture_civiclens_audit_event();
create trigger audit_evidence_visibility after update of visibility on public.evidence
  for each row execute function public.capture_civiclens_audit_event();
