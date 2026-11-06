# Security policy

CivicLens is an evidence and public-accountability application. Security reports should be sent privately to the project maintainers; do not publish exploit details before a fix is available.

## Data boundaries

- Public users can read published records only.
- Authenticated users can access only their own profile and bookmarks.
- `researcher`, `editor` and `admin` roles are assigned out-of-band; signup metadata is never used for authorization.
- Researchers can create and submit assessment drafts. Independent editors/admins review them; authors cannot approve their own assessments.
- Only administrators can publish commitment bundles. Assessment publication is a separate independent-review action.
- Audit logs are not readable or writable through public client roles. Database triggers record key editorial events.
- Browser code uses only the Supabase publishable key. A service-role/secret key must never be exposed to the browser or committed to source control.

## Reporting

Include the affected route/table, reproduction steps, expected impact and any relevant request IDs. Do not include personal data, passwords, access tokens or live secrets in an issue.
