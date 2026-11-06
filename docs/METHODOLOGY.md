# CivicLens assessment methodology

**Version 1.0 · Editorial standard · India**

CivicLens records what public evidence establishes about a defined public commitment. It does not rate political parties, leaders or governments as a whole, and it does not infer performance from rhetoric, popularity, partisan affiliation or the absence of a convenient source.

## 1. Unit of assessment

Assess one commitment at a time. Before evaluating delivery, record:

- The original manifesto/document and a stable source URL.
- The party and election cycle to which the commitment belongs.
- The jurisdiction responsible (Union, state or other explicitly defined level).
- The commitment's stated beneficiaries, quantity, geography, conditions and deadline, where specified.
- Any ambiguity in the original wording. Do not silently rewrite a broad aspiration into a measurable target.

If the commitment combines distinct deliverables, split it into separate promise records only when each part can be independently evaluated without changing the original meaning. Preserve a link to the source text.

## 2. Assessment statuses

| Status | Use when | Do not use when |
|---|---|---|
| `fulfilled` | Reliable evidence demonstrates completion of the commitment's stated scope. | An announcement, launch event or partial output is the only evidence. |
| `partially_fulfilled` | Some defined components are demonstrably delivered, but material parts remain incomplete. | Evidence is simply missing or contradictory. |
| `in_progress` | Verifiable implementation activity is underway and the stated end condition has not yet been met. | Activity is inferred from budget allocation alone. |
| `not_fulfilled` | The relevant deadline/period has passed and reliable evidence demonstrates non-delivery or a materially unmet target. | No source was found. Absence of evidence alone is not proof of non-delivery. |
| `disputed` | Credible sources materially conflict, or attribution/scope is contested and cannot yet be resolved. | Sources differ only in wording without changing the factual conclusion. |
| `insufficient_evidence` | Available evidence is not adequate to make a defensible determination. | The researcher wants to avoid an uncomfortable but well-supported conclusion. |

`insufficient_evidence` maps to `not_assessed` in the public promise register. It is not a failure verdict.

## 3. Evidence quality and source handling

Prefer primary sources: laws and gazette notifications, ministry and state department releases, budget documents, audited expenditure, official datasets, parliamentary records, CAG reports, court records and other original institutional publications. Credible independent research and journalism can add context, corroborate, or challenge official reporting.

For every source, capture publisher, title, source type, URL, publication date when available, access date, and a concise note explaining what it supports and what it cannot establish. Preserve archived URLs or hashes when available. Do not fabricate a citation, date, quote, dataset or source summary.

A source's institutional origin does not make every claim conclusive. Check methodology, definitions, time period, denominator, geographic coverage, revisions, missing data and whether reported activity represents an output or a real-world outcome. Seek contradictory evidence rather than collecting only supportive material.

## 4. Rationale requirements

A published rationale must be understandable without access to internal discussion. It should state:

1. The exact part of the commitment being evaluated.
2. The evidence that supports the selected status.
3. The material limitations, gaps or contrary evidence.
4. The relevant date range and geographic scope.
5. Why the evidence is sufficient for this status rather than a neighbouring status.

Confidence is optional and expressed from 0 to 1. It represents confidence in the assessment conclusion, not the quality or popularity of a government. Do not convert it into a public score without a separately published, validated methodology.

## 5. Independent review and publication

1. A researcher creates a private draft and attaches linked evidence.
2. The researcher submits it to the review queue.
3. An editor/admin other than the author reviews the evidence, scope, rationale, uncertainty and methodology version.
4. The reviewer either requests changes with an explanation or publishes the assessment.
5. A requested revision creates a new assessment version linked through `supersedes_id`; prior decisions are retained.
6. Publication updates the public promise status from the published assessment and writes an audit event.

Authors cannot publish their own assessment. Reviewers cannot silently rewrite an author's rationale; they must return it for revision or publish the reviewed version. Public history must retain the status, rationale, methodology version, assessment date and evidence links.

## 6. Prohibited shortcuts

- No AI-generated political verdicts or unsupported progress percentages.
- No equating spending/allocation with delivery or outcomes.
- No equating a missing source with failure.
- No selective time windows or changing denominators without explanation.
- No retrospective edits that erase an earlier public assessment.
- No party-wide or leader-wide rankings from isolated commitment records.

## 7. Corrections

When new evidence materially changes a conclusion, create a new assessment version and explain what changed. Preserve the prior published assessment and link the new version to it. Corrections should identify the evidence, the date of the change and the reason for supersession.
