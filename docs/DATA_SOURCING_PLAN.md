# CivicLens Data Sourcing Plan

## Purpose

This document defines the first research and ingestion scope for PromiseTracker. It is a source-discovery and editorial workflow plan, not a claim that any promise has been fulfilled or failed.

## First collection: Union Government, 2024–2029

Start with a balanced, cross-party collection of manifesto commitments from the 2024 Lok Sabha election. Capture the source manifesto itself before extracting individual commitments. Do not infer a promise from a speech, news report, or secondary summary when the primary manifesto is available.

### Primary-source register

| Source | Use | URL |
|---|---|---|
| Bharatiya Janata Party, Sankalp Patra 2024 | Primary source for BJP 2024 Lok Sabha commitments | https://www.bjp.org/manifesto |
| Indian National Congress, Nyay Patra 2024 | Primary source for INC 2024 Lok Sabha commitments | https://inc.in/media/manifesto |
| Election Commission of India | Election context and official election records | https://www.eci.gov.in/ |
| Union Budget documents, Ministry of Finance | Annual budget estimates, revised estimates, actuals and implementation documents | https://www.indiabudget.gov.in/ |
| Press Information Bureau | Official ministry announcements and implementation updates; corroboration, not a substitute for outcome evidence | https://pib.gov.in/ |
| Parliament of India / Digital Sansad | Bills, questions, debates and legislative records | https://sansad.in/ |

## Initial policy domains

Use a deliberately small first batch across policy areas so that the collection is not skewed toward one ministry:

- Employment and livelihoods
- Agriculture and rural development
- Education and skills
- Health
- Infrastructure and transport
- Women and social welfare
- Energy and environment
- Governance and institutional reform

## Evidence hierarchy

1. Primary legal/administrative records: Acts, rules, Gazette notifications, official orders and audited reports.
2. Official implementation records: ministry dashboards, annual reports, parliamentary answers, scheme MIS and official datasets.
3. Budget and expenditure records: Union Budget documents, demand for grants, actual expenditure and outcome budgets.
4. Independent verification: CAG reports, parliamentary committee reports, statutory regulators and credible independent evaluations.
5. Reputable journalism and civil-society research: useful for leads and context; label clearly and corroborate material claims.

A government press release is evidence that the government made an announcement. By itself, it is not proof that the promised outcome occurred.

## Promise extraction rules

For every candidate commitment, record:

- Exact or minimally edited promise wording.
- Manifesto title, issuing party, election, publication date and page/section.
- Jurisdiction and responsible level of government.
- Policy domain and a concise, neutral commitment title.
- Whether the commitment is measurable, time-bound, ongoing, conditional or aspirational.
- Any explicit target, deadline, beneficiary group or geographic scope.
- Research notes explaining ambiguity or dependencies.

Do not combine multiple independently verifiable promises into one record. Do not rewrite a broad aspiration as a quantified target. Preserve enough context to avoid changing the original meaning.

## Assessment rules

- New records remain drafts until editorial review and admin publication.
- Every published assessment must cite at least one linked evidence item and include a reasoned rationale.
- Distinguish government action, administrative output and real-world outcome.
- Use `insufficient_evidence` when the available record does not support a defensible conclusion.
- A missing public record is not proof of non-performance.
- Record conflicting evidence and material limitations rather than suppressing them.
- Reassessments create new versions; do not overwrite published history.
- Never generate a completion percentage unless the promise has a defined denominator, a defensible measurement method and cited data supporting the calculation.

## First operational milestone

Prepare a balanced pilot of 20–30 candidate commitments (roughly equal coverage across the major national parties represented in the 2024 Lok Sabha election), each with a primary manifesto citation and a research note. Keep all candidates unpublished until source links, wording, jurisdiction and scope have been checked by an editor.

The pilot is a workflow test, not a representative statistical sample and not a political ranking.
