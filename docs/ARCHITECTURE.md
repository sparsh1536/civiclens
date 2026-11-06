# CivicLens — Technical Architecture

## Architecture style

Start as a modular monorepo with a Next.js web client and a small FastAPI service. Keep deployment and operational complexity low; split services only when a module has a real scaling or ownership need.

```text
Browser
  └── Next.js App Router (public UI, auth pages, server components)
        ├── Supabase SSR client (@supabase/ssr; cookie-backed sessions)
        ├── Supabase Auth
        ├── Supabase Postgres (RLS-protected public records + private bookmarks)
        └── FastAPI service (future ingestion, analysis and reporting endpoints)
```

## Trust boundaries

- Browser: only the Supabase publishable key may be used here.
- Next.js server: validates user sessions and handles server-side application operations.
- FastAPI: future protected endpoints validate Supabase JWTs; privileged service credentials remain server-side.
- Database: RLS is the final authorization boundary. Public records are read-only to `anon` and `authenticated` clients; draft records remain hidden.
- Admin/ingestion writes: performed by trusted server-side workers only. Never expose a service-role key in `NEXT_PUBLIC_*` variables.

## Web app structure

- `src/app`: routes and layouts.
- `src/lib/supabase/client.ts`: browser client.
- `src/lib/supabase/server.ts`: cookie-aware server client.
- `src/middleware.ts`: refreshes the auth session on requests.
- `src/app/auth/callback`: exchanges the PKCE auth code for a session.

## Data model

- `jurisdictions` → national or state geography.
- `elections` → an election event within a jurisdiction.
- `political_parties` → party identity.
- `manifestos` → a party's published manifesto for an election.
- `promises` → normalized commitments extracted from manifesto text.
- `governments` → government terms within a jurisdiction.
- `evidence` → immutable source metadata and provenance.
- `promise_evidence` → many-to-many links between promises and sources.
- `assessments` → versioned, explainable assessment records.
- `assessment_evidence` → sources used by a particular assessment.
- `policies`, `budget_records` → governance modules introduced after PromiseTracker.
- `profiles`, `user_bookmarks` → private account features.
- `audit_logs` → server-side audit trail; no direct client access.

## Assessment model

An assessment is an editorially reviewable conclusion, not an AI verdict. It contains a status, written rationale, optional confidence value, methodology version, reviewer and linked evidence. New assessments supersede earlier ones so the public record remains auditable.

## Security model

- RLS enabled on every table in the exposed `public` schema.
- Explicit grants accompany RLS; policies alone are not treated as sufficient.
- Anonymous users can read only published governance records. Authenticated non-editorial users see the same public register.
- Editorial roles can access drafts only through narrowly scoped RLS policies; researchers create drafts, independent editors review, and admins publish commitment bundles.
- Authenticated users can read/update their own profile and manage their own bookmarks.
- No anonymous write access to governance records; audit logs have no direct client read/write grants.
- Authorization must not rely on user-editable `user_metadata`.
- Do not create security-definer functions unless a narrowly scoped, reviewed requirement exists.

## Local development

1. Copy `.env.example` to `apps/web/.env.local` and provide a dedicated CivicLens Supabase project URL and publishable key.
2. For a fresh project, apply all timestamped files in `supabase/migrations/` in ascending order after reviewing them. The existing CivicLens project is already provisioned; do not reapply migrations to it. See the migration-history note below.
3. Install dependencies from the repository root with `npm install`.
4. Run `npm run dev` for the web app.
5. In a separate terminal, create a Python virtual environment in `apps/api`, install the project (`pip install -e '.[dev]'`) and run `uvicorn app.main:app --reload --port 8000`.

The existing unrelated Supabase project should not be reused for CivicLens.

## Editorial authorization (Phase 1.2)

Editorial permissions are stored in `public.user_roles`, not user-editable Auth metadata. The role table has RLS enabled and exposes only a user's own role rows; browser clients receive no insert/update/delete grant on it. The initial administrator is provisioned through a trusted SQL operation after their Auth account exists (`supabase/scripts/provision_admin.sql`). Public sign-up never self-assigns privileged access.

The editorial intake uses the signed-in user's publishable-key client and database RLS. It creates linked draft records for party, election, manifesto, commitment and initial evidence. The public PromiseTracker continues to select only published rows. Assessment and publication workflows remain separate; a draft is not a verdict, and a commitment without adequate evidence is not assigned a progress score.

The editorial DDL was applied directly to the remote database during initial provisioning. Its source file is `supabase/migrations/20261105235000_editorial_workflow.sql`; it is the only local migration not yet present in the remote migration-history table. Mark version `20261105235000` as applied with the Supabase CLI migration-repair workflow before running `supabase db push`; do not reapply it.


## Editorial and assessment workflow

The editorial workflow is implemented as a role-gated application layer backed by PostgreSQL RLS. `public.user_roles` assigns `researcher`, `editor` or `admin`; public signup does not grant any of these roles. The first admin is provisioned out-of-band after an Auth user exists.

Researchers can create assessment drafts for private commitment records, attach only evidence already linked to that commitment, and submit the draft. An editor/admin can review only another user's submitted draft. The reviewer can publish or request changes, but cannot edit the author's assessment status or rationale. Authors respond to a change request by creating a new assessment linked through `supersedes_id`.

The database limits update grants to the specific review/publication columns and enforces the state machine with RLS. Publication is not exposed as a public client capability. Audit triggers record creation, review-state transitions and visibility changes in the private `audit_logs` table. A published assessment synchronizes the associated public promise status; `insufficient_evidence` maps to `not_assessed`.

See [`METHODOLOGY.md`](METHODOLOGY.md) for the editorial standard and status definitions.
