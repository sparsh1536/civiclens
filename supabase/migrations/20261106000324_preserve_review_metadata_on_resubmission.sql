drop policy if exists "Authors can revise their own draft assessments" on public.assessments;
create policy "Authors can revise their own draft assessments" on public.assessments
  for update to authenticated using (
    visibility='draft' and created_by=(select auth.uid()) and review_state in ('draft','changes_requested')
  ) with check (
    visibility='draft' and created_by=(select auth.uid()) and review_state in ('draft','in_review')
  );
