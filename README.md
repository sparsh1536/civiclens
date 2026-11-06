# CivicLens

**See beyond the promises.**

CivicLens is an evidence-led political accountability and governance research platform for India. It connects public commitments to documented actions, spending and outcomes — with transparent sourcing and an auditable assessment history.

## Current implementation

- Responsive Next.js dashboard with live counts from Supabase (published records only).
- Admin publication gate for commitment bundles, plus a separate independent assessment review queue.
- Supabase email/password sign-up and sign-in using cookie-based SSR sessions.
- Public PromiseTracker register with keyword and status filters.
- Promise detail pages with manifesto context, published assessment rationale and source trail.
- Authenticated bookmarks, including a personal saved-research page.
- PostgreSQL schema with 16 tables, explicit grants and RLS on every public table.
- Editorial roles (`researcher`, `editor`, `admin`) and private commitment intake.
- Assessment drafting, evidence linking, independent review, change requests and versioned publication. Database constraints require a substantive rationale and linked evidence before publication.
- Database audit triggers for record creation, review-state changes and publication events.
- Published promise status is synchronized from the independently reviewed assessment.
- FastAPI service foundation with a health endpoint.

The database is intentionally empty of political/government performance claims. The dashboard displays empty states until verified records are reviewed and published. No illustrative figures are passed off as live facts.

## Repository layout

```text
civiclens/
├── apps/
│   ├── web/                 # Next.js + TypeScript responsive web app
│   └── api/                 # FastAPI service foundation
├── supabase/
│   └── migrations/          # PostgreSQL schema + RLS policies
├── docs/
│   ├── PRD.md
│   └── ARCHITECTURE.md
├── .github/workflows/ci.yml
├── SECURITY.md
├── .env.example
└── package.json
```

## Local development

### Web application

The dedicated CivicLens Supabase project is already provisioned. Create `apps/web/.env.local` from the template and enter its project URL and publishable key:

```bash
cp .env.example apps/web/.env.local
```

Then install and run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Supabase Auth email confirmation redirects to `/auth/callback`. For deployed environments, add the deployed callback URL to Supabase Authentication → URL Configuration → Redirect URLs.

### API

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
uvicorn app.main:app --reload --port 8000
```

Health check: `http://localhost:8000/health`.

## Database and security

The initial schema is in `supabase/migrations/20261105233707_initial_civiclens_schema.sql` and has been applied to the dedicated CivicLens Supabase project. It seeds India and its 28 states. All 16 public tables have RLS enabled. Anonymous visitors and ordinary signed-in users can read published governance records; authorized editorial roles can access only the draft workflows allowed by their role. User bookmarks are scoped to `auth.uid()`. Browser clients use only the publishable key. Never place a Supabase secret/service-role key in a `NEXT_PUBLIC_` variable.

The live Supabase security advisor returned no security findings after setup. Internal audit logs have no client grants and an explicit deny policy.

## Product principles

- Evidence before opinion.
- No invented progress percentages or unsupported verdicts.
- Published assessments link to their evidence and methodology.
- Earlier assessments are superseded, not silently erased.
- Public information remains browsable without an account.

## Assessment standard

The status definitions, evidence hierarchy, rationale requirements, independent review process and correction policy are documented in [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md). Role provisioning and editorial procedures are in [`docs/OPERATIONS.md`](docs/OPERATIONS.md); hosting setup and the migration-history caveat are in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). The application requires a reviewer other than the author before an assessment can become public.

## Deployment status

The Supabase database is provisioned and healthy in Mumbai (`ap-south-1`). A Vercel project could not be created because the connected Vercel account returned HTTP 403 for project creation; no deployment or public production URL exists yet. The GitHub connection exposes repository read/write operations but no repository-creation action, and the connected account currently has no accessible CivicLens repository.

## Current limitations

- Dependency installation and a production Next.js build have not yet been verified in this environment because npm registry access timed out.
- Auth email delivery/confirmation, editorial intake, independent review and bookmark flows still need an end-to-end browser test.
- The first administrator account must be created and provisioned out-of-band; there are currently no Auth users in the project.
- No real manifesto, promise, evidence or assessment records have been ingested; public lists will be empty until editorially reviewed records are published.
- No GitHub remote or deployment has been created.

## License

License to be selected before public release.

## Editorial access and intake

The editorial workspace is available at `/editor`. It is role-gated by `public.user_roles` (`researcher`, `editor`, `admin`); a public sign-up never grants an editorial role. Editors can create private draft commitments with an election, manifesto and initial evidence source. The public register continues to query only `visibility = 'published'`.

The first administrator must be provisioned after creating their Auth account. Run this once in the CivicLens Supabase SQL Editor, replacing the email with the account that should own editorial administration:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.editorial_role
from auth.users
where lower(email) = lower('YOUR_ADMIN_EMAIL')
on conflict (user_id, role) do nothing;
```

Then sign out and back in, and open `/editor`. Do not expose a role-grant form in the public application. Promote additional editors only through a trusted administrative process.

The intake flow records the party, election, manifesto, commitment and first source as separate linked draft rows. If a step fails midway, inspect the draft records before retrying to avoid duplicates. Researchers can draft assessments only against linked evidence; an independent editor/admin must review them. Requested revisions create a superseding version. Publication triggers an audit event and updates the public promise status.

### Migration history note

The editorial-role DDL (`20261105235000_editorial_workflow.sql`) was applied directly during initial provisioning and is not yet represented in the remote migration-history table. All other timestamped migration files match the remote migration history. Before using `supabase db push`, mark version `20261105235000` as already applied with the Supabase CLI migration-repair workflow; do not execute that migration again against this live database.
