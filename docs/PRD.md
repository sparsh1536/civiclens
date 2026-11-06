# CivicLens — Product Requirements Document

**Version:** 0.2 · **Status:** PromiseTracker + editorial review implemented; verification pending · **Initial market:** India

## Product thesis

CivicLens is a public political-accountability and governance-research platform. It helps people follow public commitments from the moment they are made through the actions, spending and outcomes that can be documented later.

**Positioning:** See beyond the promises.

CivicLens is not a political persuasion tool, a partisan scorecard, or a generic AI fact-checking chatbot. Its core unit is a *public commitment and its evidence trail*.

## Users

- **Public reader:** Browse published records without an account.
- **Registered researcher:** Bookmark commitments and organize a personal research library.
- **Researcher:** Prepare private assessment drafts against linked evidence and submit them for independent review.
- **Editor:** Review another researcher’s assessment, request changes or publish an approved assessment.
- **Platform administrator:** Publish commitment bundles and manage editorial access.

Authorization roles are stored in a dedicated RLS-protected database table. They are never inferred from user-editable profile metadata.

## Geographic scope

- National government of India.
- All 28 Indian states.
- Union Territories are intentionally deferred from the first data model rollout; the schema can support them in a later extension.

## Product principles

1. **Evidence before opinion:** Every published assessment links to source records.
2. **No false precision:** Do not invent completion percentages. Progress indicators must be derived from documented milestones and explain their calculation.
3. **Separate fact from interpretation:** Store source facts, editorial rationale and assessment status separately.
4. **Show uncertainty:** Support disputed and insufficient-evidence states; confidence is not the same as truth.
5. **Preserve history:** Published assessments are superseded, not silently overwritten.
6. **Public by default:** Published governance records are readable without signing in; accounts are for personal research features.
7. **Neutral presentation:** No party logos, partisan color coding or implied endorsement in the core experience.

## MVP scope

### Phase 1 — Foundation (implemented)
- Responsive public workspace/dashboard shell with live Supabase counts.
- Public overview and module navigation.
- Email/password sign-up and sign-in using cookie-based Supabase SSR sessions.
- Initial relational schema and row-level security policies applied to the dedicated project.
- FastAPI health endpoint and API skeleton.
- Documentation, environment template and local development setup.

### Phase 2 — PromiseTracker (implemented; end-to-end verification pending)
- Public register reads published promise records from Supabase.
- Keyword and assessment-status filters.
- Promise detail page with manifesto context, published assessment rationale and evidence references.
- Authenticated bookmark/unbookmark and saved-research page.
- Editorial commitment intake, evidence linking, draft queues and admin-only commitment-bundle publication are implemented.
- End-to-end browser verification and richer jurisdiction/election filters remain pending.

### Phase 3 — Evidence and assessments (workflow implemented; broader source ingestion pending)
- Evidence records with publisher, type, publication date, canonical URL and archived URL.
- Multiple evidence links per promise and assessment.
- Assessment lifecycle: draft → independent review → changes requested or published; revisions supersede earlier assessments.
- Reviewer cannot be the assessment author; review metadata and publication events are audited.
- Statuses: not assessed, in progress, fulfilled, partially fulfilled, not fulfilled, disputed, insufficient evidence.

### Phase 4 — Governance intelligence
- Policy monitor, budget records and parliamentary activity.
- Comparisons across jurisdictions and financial years.
- Methodology v1.0 is documented; downloadable reports and comparative analysis remain future work.

## Non-goals for MVP

- Automatically declaring political claims true or false.
- Generating political persuasion, campaign content or voter targeting.
- Unverified scraping of social media.
- A single opaque government performance score.
- Treating budget allocation as proof of implementation or impact.

## Core success criteria

- Anonymous visitors can browse published records without creating an account.
- A registered user can sign up, sign in and maintain private bookmarks.
- Every published promise assessment has a rationale and one or more published evidence records.
- Draft/unpublished records are not visible through public database access.
- Mobile users can use the primary research flows without horizontal page scrolling.
- The application clearly labels demonstration/sample data and never presents it as official statistics.

## MVP acceptance criteria

- `npm run build` succeeds for the web app.
- `pytest` passes for the API foundation.
- RLS is enabled on every exposed public-schema table.
- `anon` cannot insert/update/delete public governance records.
- An authenticated user can only read/write their own profile and bookmarks.
- No Supabase service-role secret is exposed to the browser.

## Phase 1.2 — Editorial desk (implemented)

### Goal
Enable approved researchers to capture manifesto commitments with source provenance while keeping unpublished material private.

### Workflow
1. An approved editor selects a jurisdiction and election.
2. The editor identifies a political party and records the original manifesto document URL.
3. The editor captures a commitment title, faithful description, category, target group and target date.
4. The editor attaches an initial source with publisher, source type, publication date, URL and research note.
5. The records are saved as drafts and appear only in the editorial queue.
6. Publication remains a separate administrator-controlled step; only explicitly published records appear in public views.

### Authorization
Roles are stored in a dedicated database table and are not read from user-editable Auth metadata. Public registration grants no editorial role. Initial administrator provisioning is an out-of-band operation after account creation.

### Non-goals for this increment
- Automatic AI grading of political promises.
- Automatic publication.
- Unverified progress percentages or rankings.
- Deleting or silently overwriting historical published assessments.
