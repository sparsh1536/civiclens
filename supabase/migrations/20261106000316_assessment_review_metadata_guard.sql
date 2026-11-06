drop policy if exists "Researchers can create assessment drafts" on public.assessments;
create policy "Researchers can create assessment drafts" on public.assessments
  for insert to authenticated with check (
    visibility='draft' and review_state='draft' and created_by=(select auth.uid())
    and reviewed_by is null and review_notes is null
    and (supersedes_id is null or exists (
      select 1 from public.assessments prior where prior.id=supersedes_id
        and prior.promise_id=assessments.promise_id and prior.created_by=(select auth.uid())
        and prior.review_state='changes_requested'
    ))
    and exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('researcher','editor','admin'))
  );
create or replace function public.prevent_author_review_metadata_change()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
  if OLD.created_by=(select auth.uid()) and (
    NEW.review_notes is distinct from OLD.review_notes or NEW.reviewed_by is distinct from OLD.reviewed_by
  ) then raise exception 'Only an independent reviewer may change review metadata'; end if;
  return NEW;
end; $$;
revoke all on function public.prevent_author_review_metadata_change() from public,anon,authenticated;
create trigger prevent_author_review_metadata_update before update of review_notes,reviewed_by on public.assessments
  for each row execute function public.prevent_author_review_metadata_change();
