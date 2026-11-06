-- Complete audit coverage for editorial intake and publication.
create trigger audit_election_insert after insert on public.elections
  for each row execute function public.capture_civiclens_audit_event();
create trigger audit_manifesto_insert after insert on public.manifestos
  for each row execute function public.capture_civiclens_audit_event();
create trigger audit_promise_insert after insert on public.promises
  for each row execute function public.capture_civiclens_audit_event();
create trigger audit_evidence_insert after insert on public.evidence
  for each row execute function public.capture_civiclens_audit_event();
create trigger audit_election_visibility after update of visibility on public.elections
  for each row execute function public.capture_civiclens_audit_event();
create trigger audit_manifesto_visibility after update of visibility on public.manifestos
  for each row execute function public.capture_civiclens_audit_event();
