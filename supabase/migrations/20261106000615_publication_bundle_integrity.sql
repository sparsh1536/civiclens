create or replace function public.publish_commitment_bundle(p_promise_id uuid)
returns void language plpgsql security invoker set search_path=public,pg_temp as $$
declare
  v_user uuid := auth.uid();
  v_manifesto_id uuid;
  v_election_id uuid;
  v_manifesto_visibility public.record_visibility;
  v_election_visibility public.record_visibility;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from public.user_roles r where r.user_id=v_user and r.role='admin') then
    raise exception 'Administrator access required';
  end if;
  select m.id,m.election_id,m.visibility,e.visibility
    into v_manifesto_id,v_election_id,v_manifesto_visibility,v_election_visibility
    from public.promises p join public.manifestos m on m.id=p.manifesto_id
    join public.elections e on e.id=m.election_id
    where p.id=p_promise_id and p.visibility='draft';
  if v_manifesto_id is null then raise exception 'Draft commitment not found'; end if;
  if v_manifesto_visibility='archived' or v_election_visibility='archived' then
    raise exception 'Archived manifesto/election cannot be published with this commitment';
  end if;
  if not exists(select 1 from public.promise_evidence pe where pe.promise_id=p_promise_id) then
    raise exception 'At least one linked evidence source is required';
  end if;
  if exists(select 1 from public.promise_evidence pe join public.evidence e on e.id=pe.evidence_id
    where pe.promise_id=p_promise_id and e.visibility='archived') then
    raise exception 'Archived evidence must be replaced before publication';
  end if;
  update public.elections set visibility='published' where id=v_election_id and visibility='draft';
  update public.manifestos set visibility='published' where id=v_manifesto_id and visibility='draft';
  update public.evidence set visibility='published' where id in (
    select pe.evidence_id from public.promise_evidence pe where pe.promise_id=p_promise_id
  ) and visibility='draft';
  update public.promises set visibility='published' where id=p_promise_id and visibility='draft';
end; $$;
revoke all on function public.publish_commitment_bundle(uuid) from public,anon;
grant execute on function public.publish_commitment_bundle(uuid) to authenticated;
