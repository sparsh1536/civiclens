# CivicLens editorial operations

## First administrator

1. Create a normal CivicLens account through `/sign-up` and complete email confirmation.
2. In the Supabase SQL Editor for the dedicated CivicLens project, run `supabase/scripts/provision_admin.sql` after replacing `YOUR_ADMIN_EMAIL` with that exact account email.
3. Sign out and sign in again, then open `/editor`.
4. Keep administrator access limited. Public sign-up never grants roles.

## Add an editor or researcher

The target account must already exist in Supabase Auth. An administrator provisions the role using the trusted SQL Editor:

- Editor: run `supabase/scripts/provision_editor.sql` after replacing `ADMIN_EMAIL` and `EDITOR_EMAIL`.
- Researcher: use the same pattern with `'researcher'::public.editorial_role` and a trusted admin account.

Role rows are not editable through the public application.

## Editorial lifecycle

1. An editor records the jurisdiction, election, party, original manifesto, commitment and at least one initial source at `/editor/new`.
2. A researcher opens the draft commitment and prepares an assessment. The rationale must be substantive (at least 80 characters) and at least one linked evidence record must be selected.
3. The researcher submits the assessment for review.
4. A different editor/admin reviews the source trail and rationale. The reviewer may request changes or publish. The author cannot review their own work.
5. A requested revision creates a new assessment version linked through `supersedes_id`; the previous decision remains in history.
6. An administrator uses `/editor/publication` to publish the commitment bundle. The database checks for an original manifesto URL and active linked evidence, then publishes the election, manifesto, evidence and commitment in one transaction.

Publishing a commitment and publishing an assessment are separate decisions. A published assessment remains hidden from the public register until its commitment bundle is published. An assessment with no linked evidence cannot be published.

## Public status semantics

- `fulfilled`, `partially_fulfilled`, `in_progress`, `not_fulfilled` and `disputed` flow from a published assessment to the public commitment status.
- `insufficient_evidence` maps to `not_assessed`; it is not treated as failure.
- Published assessments are not overwritten. New evidence or corrections create a superseding version.

See [`METHODOLOGY.md`](METHODOLOGY.md) for the evidence standard and status definitions.
