drop policy if exists "Editors can attach evidence to assessment drafts" on public.assessment_evidence;
create policy "Researchers can attach linked evidence to own assessment drafts" on public.assessment_evidence
  for insert to authenticated with check (
    exists(select 1 from public.assessments a where a.id=assessment_id and a.visibility='draft'
      and a.created_by=(select auth.uid()) and a.review_state in ('draft','changes_requested'))
    and exists(select 1 from public.promise_evidence pe join public.assessments a on a.promise_id=pe.promise_id
      where a.id=assessment_id and pe.evidence_id=assessment_evidence.evidence_id)
    and exists(select 1 from public.evidence e where e.id=assessment_evidence.evidence_id
      and (e.visibility='published' or (e.visibility='draft' and e.submitted_by=(select auth.uid()))))
    and exists(select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('researcher','editor','admin'))
  );
