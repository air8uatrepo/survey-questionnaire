# REQ-001 Implementation Task Ledger

**Workflow status:** Internal planning complete inside `BUILDING_PREVIEW`; this ledger is not a business review artifact.

**Source baseline:** `specs/REQ-001/spec.md`

**Required synthetic run ID:** `DEMO-REQ-001-20260918-01`

| ID | Independent behavior | Depends on | Product acceptance | Owner | Test-first completion evidence | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| TASK-001 | Bootstrap the Next.js application and reject incomplete or non-demo questionnaire values through one shared parser. | Confirmed `spec.md` | AC-001, AC-002, AC-003, AC-006 | `business_direct_developer` | `tests/questionnaire.test.ts` first fails for absent parser, then passes valid/blank/unprefixed cases; `npm run lint` and `npm run build` pass. | Medium |
| TASK-002 | Persist valid responses only through a server-only, fail-closed pooled PostgreSQL adapter that selects `proto_survey_questionnaire_poc` for proto/preview and `app_survey_questionnaire_poc` for production; render the identical additive RLS migration only for that validated target and serialize CSV safely. | TASK-001 | AC-003, AC-004, AC-005, AC-006 | `business_direct_developer`, then `business_direct_deployment` for schema preflight and proto migration evidence | `tests/target-schema.test.ts`, `tests/migration-template.test.ts`, and `tests/responses.test.ts` first fail for the absent target contract, then prove missing/swapped/public schemas fail before pool creation, all values are SQL parameters, rendered SQL contains no public schema, and populated `proto_survey_questionnaire_poc` migration/readback succeeds. | High |
| TASK-003 | Provide the public four-field form and server-side route with success feedback and no raw-value error output. | TASK-001, TASK-002 | AC-001, AC-002, AC-003, AC-004, AC-006 | `business_direct_developer` | Route test first fails for missing handler factory, then proves invalid input does not invoke insert and valid input returns 201; lint/build pass. | High |
| TASK-004 | Protect the one-owner record view and CSV export with a strict Supabase Auth user-ID check. | TASK-002 | AC-005, AC-006 | `business_direct_developer` | `tests/admin.test.ts` first fails for absent authorization/export handler, then proves non-owner is 403 and owner receives compliant CSV; full unit/lint/build suite passes. | High |
| TASK-005 | Retain one browser-visible cumulative key path from public submission through owner CSV download. | TASK-001, TASK-002, TASK-003, TASK-004 | AC-001 through AC-006 | `business_direct_tester` after developer commits test | Playwright case first fails before behavior exists, then passes locally and against verified preview with synthetic persistence readback and downloaded CSV assertions. | High |

## Required task execution sequence

1. Complete `TASK-001` with the red → green test record and commit `feat: bootstrap questionnaire validation`.
2. Complete `TASK-002` with its unit red → green record. Before altering the unexecuted public-schema source, the Deployment role proves that it has never been applied and that no public response table exists; otherwise it stops as `MIGRATION_STATE_UNCERTAIN`. The Developer supplies the fixed-schema template, manifest, and fail-closed server adapter. The Deployment role renders and verifies it only against populated `proto_survey_questionnaire_poc` before the task is considered ready for preview. It must not run the production template until after the preview confirmation and at `APPLY_PRODUCTION_MIGRATION`, immediately before `VERIFY_PRODUCTION_MIGRATION` and `MERGE_MASTER`.
3. Complete `TASK-003` with its route red → green record and commit `feat: add demonstration questionnaire submission`.
4. Complete `TASK-004` with its authorization/export red → green record and commit `feat: add owner response export`.
5. Complete `TASK-005` with local Playwright evidence. The Tester independently repeats the same retained browser path on the verified preview URL; it does not alter application code.
6. After the tester reports preview pass, the coordinator records preview deployment evidence and moves to `WAITING_ON_PREVIEW`. Do not request a plan, task, design, or implementation confirmation.

## Task acceptance checklist

- [ ] Every production behavior was preceded by the exact failing test identified in `plan.md`.
- [ ] Each red failure was caused by the missing behavior rather than test setup or a typographical error.
- [ ] Each green step ran the named focused test before broader checks.
- [ ] No repository file containing submitted values, demo output, screenshot, trace, seed, export assertion, or test account violates the `DEMO-REQ-001-20260918-01` prefix rule.
- [ ] The database migration is additive, RLS is enabled, `public.questionnaire_responses` is absent from source and target evidence, and no browser-visible service credential or database configuration exists.
- [ ] Only a server-only resolver may select a schema: proto/preview resolves to `proto_survey_questionnaire_poc`, production resolves to `app_survey_questionnaire_poc`, and missing, swapped, or public values fail before pool creation.
- [ ] Every response query uses the resolver's hard-coded quoted table literal and `$1`–`$4` bind parameters; browser modules contain no response-table or database client call.
- [ ] The privileged adapter verified the wrong-schema preflight before replacing the unexecuted source, applied the template with pre-existing synthetic data to the proto schema, and will apply/verify the app schema only at the production migration cursor before `MERGE_MASTER`.
- [ ] The owner check compares Supabase `user.id` directly to `BUSINESS_APP_OWNER_USER_ID`.
- [ ] The retained E2E covers persistence after a reload and owner CSV output, not only a success response.
- [ ] `npm test`, `npm run lint`, `npm run build`, `npm run test:e2e`, and `git diff --check` have fresh successful evidence before a preview handoff.
