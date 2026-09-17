# REQ-001 Implementation Task Ledger

**Workflow status:** Internal planning complete inside `BUILDING_PREVIEW`; this ledger is not a business review artifact.

**Source baseline:** `specs/REQ-001/spec.md`

**Required synthetic run ID:** `DEMO-REQ-001-20260918-01`

| ID | Independent behavior | Depends on | Product acceptance | Owner | Test-first completion evidence | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| TASK-001 | Bootstrap the Next.js application and reject incomplete or non-demo questionnaire values through one shared parser. | Confirmed `spec.md` | AC-001, AC-002, AC-003, AC-006 | `business_direct_developer` | `tests/questionnaire.test.ts` first fails for absent parser, then passes valid/blank/unprefixed cases; `npm run lint` and `npm run build` pass. | Medium |
| TASK-002 | Persist only valid questionnaire responses into an additive RLS-protected Supabase table and serialize them safely as CSV. | TASK-001 | AC-003, AC-004, AC-005, AC-006 | `business_direct_developer`, then `business_direct_deployment` for proto migration evidence | `tests/responses.test.ts` first fails for absent CSV serializer, then passes RFC 4180 escaping; populated `proto_survey_questionnaire_poc` migration and compliant readback succeed. | High |
| TASK-003 | Provide the public four-field form and server-side route with success feedback and no raw-value error output. | TASK-001, TASK-002 | AC-001, AC-002, AC-003, AC-004, AC-006 | `business_direct_developer` | Route test first fails for missing handler factory, then proves invalid input does not invoke insert and valid input returns 201; lint/build pass. | High |
| TASK-004 | Protect the one-owner record view and CSV export with a strict Supabase Auth user-ID check. | TASK-002 | AC-005, AC-006 | `business_direct_developer` | `tests/admin.test.ts` first fails for absent authorization/export handler, then proves non-owner is 403 and owner receives compliant CSV; full unit/lint/build suite passes. | High |
| TASK-005 | Retain one browser-visible cumulative key path from public submission through owner CSV download. | TASK-001, TASK-002, TASK-003, TASK-004 | AC-001 through AC-006 | `business_direct_tester` after developer commits test | Playwright case first fails before behavior exists, then passes locally and against verified preview with synthetic persistence readback and downloaded CSV assertions. | High |

## Required task execution sequence

1. Complete `TASK-001` with the red → green test record and commit `feat: bootstrap questionnaire validation`.
2. Complete `TASK-002` with its unit red → green record. The Developer supplies the migration; the Deployment role verifies it only against populated `proto_survey_questionnaire_poc` before the task is considered ready for preview.
3. Complete `TASK-003` with its route red → green record and commit `feat: add demonstration questionnaire submission`.
4. Complete `TASK-004` with its authorization/export red → green record and commit `feat: add owner response export`.
5. Complete `TASK-005` with local Playwright evidence. The Tester independently repeats the same retained browser path on the verified preview URL; it does not alter application code.
6. After the tester reports preview pass, the coordinator records preview deployment evidence and moves to `WAITING_ON_PREVIEW`. Do not request a plan, task, design, or implementation confirmation.

## Task acceptance checklist

- [ ] Every production behavior was preceded by the exact failing test identified in `plan.md`.
- [ ] Each red failure was caused by the missing behavior rather than test setup or a typographical error.
- [ ] Each green step ran the named focused test before broader checks.
- [ ] No repository file containing submitted values, demo output, screenshot, trace, seed, export assertion, or test account violates the `DEMO-REQ-001-20260918-01` prefix rule.
- [ ] The database migration is additive, RLS is enabled, and no browser-visible service credential exists.
- [ ] The owner check compares Supabase `user.id` directly to `BUSINESS_APP_OWNER_USER_ID`.
- [ ] The retained E2E covers persistence after a reload and owner CSV output, not only a success response.
- [ ] `npm test`, `npm run lint`, `npm run build`, `npm run test:e2e`, and `git diff --check` have fresh successful evidence before a preview handoff.
