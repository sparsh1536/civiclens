drop policy if exists "Editors can read draft elections" on public.elections;
create policy "Editorial team can read draft elections" on public.elections
  for select to authenticated using (visibility='draft' and exists (
    select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('researcher','editor','admin')
  ));
drop policy if exists "Editors can read draft manifestos" on public.manifestos;
create policy "Editorial team can read draft manifestos" on public.manifestos
  for select to authenticated using (visibility='draft' and exists (
    select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('researcher','editor','admin')
  ));
