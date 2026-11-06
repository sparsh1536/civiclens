-- Keep public access and authenticated editorial access in one policy per role/action.
drop policy if exists "Published assessments are public" on public.assessments;
drop policy if exists "Researchers can read own assessment drafts" on public.assessments;
create policy "Published assessments are public" on public.assessments for select to anon
  using (visibility='published' and exists(select 1 from public.promises p where p.id=promise_id and p.visibility='published'));
create policy "Authenticated users can read published and authorized assessment drafts" on public.assessments
  for select to authenticated using (
    (visibility='published' and exists(select 1 from public.promises p where p.id=promise_id and p.visibility='published'))
    or (visibility='draft' and (created_by=(select auth.uid()) or exists(select 1 from public.user_roles r
      where r.user_id=(select auth.uid()) and r.role in ('editor','admin'))))
  );

drop policy if exists "Evidence linked to published assessments is public" on public.assessment_evidence;
drop policy if exists "Authors and reviewers can read assessment evidence drafts" on public.assessment_evidence;
create policy "Evidence linked to published assessments is public" on public.assessment_evidence for select to anon
  using (exists(select 1 from public.assessments a where a.id=assessment_id and a.visibility='published')
    and exists(select 1 from public.evidence e where e.id=evidence_id and e.visibility='published'));
create policy "Authenticated users can read published and authorized assessment evidence" on public.assessment_evidence
  for select to authenticated using (
    (exists(select 1 from public.assessments a where a.id=assessment_id and a.visibility='published')
      and exists(select 1 from public.evidence e where e.id=evidence_id and e.visibility='published'))
    or exists(select 1 from public.assessments a where a.id=assessment_id and a.visibility='draft' and (
      a.created_by=(select auth.uid()) or (a.review_state='in_review' and a.created_by<>(select auth.uid())
        and exists(select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('editor','admin')))
    ))
  );

drop policy if exists "Published elections are public" on public.elections;
drop policy if exists "Editorial team can read draft elections" on public.elections;
create policy "Published elections are public" on public.elections for select to anon using (visibility='published');
create policy "Authenticated users can read published and editorial elections" on public.elections for select to authenticated
  using (visibility='published' or (visibility='draft' and exists(select 1 from public.user_roles r
    where r.user_id=(select auth.uid()) and r.role in ('researcher','editor','admin'))));

drop policy if exists "Published evidence is public" on public.evidence;
drop policy if exists "Editorial team can read draft evidence" on public.evidence;
create policy "Published evidence is public" on public.evidence for select to anon using (visibility='published');
create policy "Authenticated users can read published and authorized evidence" on public.evidence for select to authenticated
  using (visibility='published' or (visibility='draft' and (submitted_by=(select auth.uid()) or exists(
    select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('editor','admin')))));

drop policy if exists "Published manifestos are public" on public.manifestos;
drop policy if exists "Editorial team can read draft manifestos" on public.manifestos;
create policy "Published manifestos are public" on public.manifestos for select to anon using (visibility='published');
create policy "Authenticated users can read published and editorial manifestos" on public.manifestos for select to authenticated
  using (visibility='published' or (visibility='draft' and exists(select 1 from public.user_roles r
    where r.user_id=(select auth.uid()) and r.role in ('researcher','editor','admin'))));

drop policy if exists "Evidence links for published promises are public" on public.promise_evidence;
drop policy if exists "Editorial team can read draft promise evidence" on public.promise_evidence;
create policy "Evidence links for published promises are public" on public.promise_evidence for select to anon
  using (exists(select 1 from public.promises p where p.id=promise_id and p.visibility='published')
    and exists(select 1 from public.evidence e where e.id=evidence_id and e.visibility='published'));
create policy "Authenticated users can read published and editorial promise evidence" on public.promise_evidence
  for select to authenticated using (
    (exists(select 1 from public.promises p where p.id=promise_id and p.visibility='published')
      and exists(select 1 from public.evidence e where e.id=evidence_id and e.visibility='published'))
    or (exists(select 1 from public.promises p where p.id=promise_id and p.visibility='draft')
      and exists(select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('researcher','editor','admin')))
  );

drop policy if exists "Published promises are public" on public.promises;
drop policy if exists "Editorial team can read draft promises" on public.promises;
create policy "Published promises are public" on public.promises for select to anon using (visibility='published');
create policy "Authenticated users can read published and editorial promises" on public.promises for select to authenticated
  using (visibility='published' or (visibility='draft' and exists(select 1 from public.user_roles r
    where r.user_id=(select auth.uid()) and r.role in ('researcher','editor','admin'))));
