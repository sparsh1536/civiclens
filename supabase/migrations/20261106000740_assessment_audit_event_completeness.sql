create or replace function public.capture_civiclens_audit_event()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_actor uuid := auth.uid();
  v_entity_type text := TG_TABLE_NAME;
  v_entity_id uuid := coalesce(NEW.id,OLD.id);
begin
  if TG_OP='INSERT' then
    insert into public.audit_logs(actor_id,action,entity_type,entity_id,change_summary)
      values(v_actor,'created',v_entity_type,v_entity_id,jsonb_build_object('visibility',NEW.visibility));
    return NEW;
  end if;
  if TG_OP='UPDATE' and TG_TABLE_NAME='assessments' then
    if NEW.review_state is distinct from OLD.review_state then
      insert into public.audit_logs(actor_id,action,entity_type,entity_id,change_summary)
        values(v_actor,'review_state_changed',v_entity_type,v_entity_id,
          jsonb_build_object('from',OLD.review_state,'to',NEW.review_state,'review_notes',NEW.review_notes));
    end if;
    if NEW.visibility is distinct from OLD.visibility then
      insert into public.audit_logs(actor_id,action,entity_type,entity_id,change_summary)
        values(v_actor,'visibility_changed',v_entity_type,v_entity_id,
          jsonb_build_object('from',OLD.visibility,'to',NEW.visibility));
    end if;
    return NEW;
  end if;
  if TG_OP='UPDATE' and NEW.visibility is distinct from OLD.visibility then
    insert into public.audit_logs(actor_id,action,entity_type,entity_id,change_summary)
      values(v_actor,'visibility_changed',v_entity_type,v_entity_id,
        jsonb_build_object('from',OLD.visibility,'to',NEW.visibility));
  end if;
  return NEW;
end; $$;
revoke all on function public.capture_civiclens_audit_event() from public,anon,authenticated;
drop trigger if exists audit_assessment_visibility on public.assessments;
drop trigger if exists audit_assessment_review_state on public.assessments;
create trigger audit_assessment_update after update of visibility,review_state on public.assessments
  for each row execute function public.capture_civiclens_audit_event();
