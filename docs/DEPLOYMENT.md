# Deployment runbook

## Current infrastructure

- Supabase project: CivicLens, Mumbai region (`ap-south-1`), active/healthy.
- Vercel: project creation was denied by the connected account (HTTP 403); no Vercel project or deployment currently exists.
- GitHub: the connected integration exposes repository file/commit operations but not repository creation; no CivicLens remote exists yet.
- The local project is a monorepo with the Next.js app in `apps/web` and FastAPI in `apps/api`.

## Web deployment

1. Create a private GitHub repository named `civiclens` in the intended owner account and push this source tree.
2. Import that repository into Vercel. Select Next.js and set the project root directory to `apps/web`.
3. Configure these environment variables for Development, Preview and Production:
   - `NEXT_PUBLIC_SUPABASE_URL=https://gszpdbtuassfzlipuzvt.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<the CivicLens publishable key>`
4. Use Node.js 22. The repository-root npm workspace and the `apps/web` package contain pinned dependencies and scripts.
5. Add the deployed origin and `/auth/callback` URL to Supabase Authentication URL Configuration. Keep the local callback URL for development.
6. Run the CI checks and verify signup, email confirmation, sign-in, bookmarks, editorial intake, review and publication using non-production test records before opening the site publicly.

Do not add a Supabase secret/service-role key to any `NEXT_PUBLIC_` variable or client-side file.

## API deployment

Deploy `apps/api` as a separate Python 3.11+ service with `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Set `CIVICLENS_CORS_ORIGINS` to a comma-separated allowlist containing the exact deployed web origin(s). The API currently provides health and foundation metadata endpoints only; it is not yet required by the web UI.

## Database migration history

The live database contains all timestamped migrations except `20261105235000_editorial_workflow`, which was applied directly during initial provisioning and is therefore absent from the remote migration-history table. Before using `supabase db push`, reconcile that one version with `supabase migration repair --status applied` for version `20261105235000`. Do not execute the editorial bootstrap migration again against the live database.
