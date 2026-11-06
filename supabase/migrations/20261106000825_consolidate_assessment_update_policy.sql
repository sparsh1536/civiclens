drop policy if exists "Authors can revise their own draft assessments" on public.assessments;
drop policy if exists "Independent reviewers can decide submitted assessments" on public.assessments;
create policy "Authors and independent reviewers can update assessments" on public.assessments
  for update to authenticated using (
    (visibility='draft' and created_by=(select auth.uid()) and review_state in ('draft','changes_requested'))
    or (visibility='draft' and review_state='in_review' and created_by is not null and created_by<>(select auth.uid())
      and exists(select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('editor','admin')))
  ) with check (
    (visibility='draft' and created_by=(select auth.uid()) and review_state in ('draft','in_review'))
    or (review_state in ('changes_requested','published') and reviewed_by=(select auth.uid())
      and created_by<>(select auth.uid())
      and ((review_state='published' and visibility='published') or (review_state='changes_requested' and visibility='draft'))
      and exists(select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('editor','admin')))
  );
