alter table public.assessments add constraint assessments_rationale_min_length
  check (length(btrim(rationale)) >= 80);
create or replace function public.require_assessment_evidence_before_publication()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
  if NEW.review_state='published' and OLD.review_state is distinct from NEW.review_state
    and not exists(select 1 from public.assessment_evidence ae where ae.assessment_id=NEW.id) then
    raise exception 'An assessment must cite at least one linked evidence source before publication';
  end if;
  return NEW;
end; $$;
revoke all on function public.require_assessment_evidence_before_publication() from public,anon,authenticated;
drop trigger if exists require_assessment_evidence_before_publication on public.assessments;
create trigger require_assessment_evidence_before_publication before update of review_state on public.assessments
  for each row execute function public.require_assessment_evidence_before_publication();
