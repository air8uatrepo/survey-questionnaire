# REQ-001 cumulative browser test charter

**Mode:** `TEST_DESIGN`
**Baseline:** `specs/REQ-001/spec.md`
**Plan:** `specs/REQ-001/plan.md`
**Required run ID:** `DEMO-REQ-001-20260918-01`

This is an internal test-design record created during `BUILDING_PREVIEW`. It
does not request a business review, send a notification, or advance workflow
state. It defines one retained cumulative browser case for proto, preview, and
production verification.

## Retained cumulative case

### E2E-KP-REQ-001-001 — Submit and export one compliant demonstration response

**Acceptance coverage:** AC-001, AC-002, AC-003, AC-004, AC-005, AC-006
**Risk:** High — public input validation, persistence, single-owner access,
and export cross browser/server/database boundaries.
**Synthetic response:**

| Field | Browser value |
| --- | --- |
| Nickname | `DEMO-REQ-001-20260918-01-nickname` |
| Organization | `DEMO-REQ-001-20260918-01-organization` |
| Profession | `DEMO-REQ-001-20260918-01-profession` |
| Job title | `DEMO-REQ-001-20260918-01-job-title` |

**Preconditions for each execution mode:**

- The target is the approved proto, preview, or production URL for this exact
  requirement and uses HTTPS unless it is a loopback local check.
- The Deployment role has completed the target's approved migration/readback
  and supplied exactly one synthetic owner identity. The tester obtains any
  login secret only from the approved runtime test configuration; it neither
  displays, records, nor returns a credential.
- Browser artifacts, logs, test labels, generated fixtures, downloaded CSV
  evidence, and any persistence evidence use only
  `DEMO-REQ-001-20260918-01`-prefixed submitted values. No direct database
  connection, live-data query, credential inspection, or privileged adapter is
  used by this case.

**Browser procedure and observable assertions:**

1. Open the public questionnaire. Verify its visible warning says that real
   personal and business information must not be entered. Verify labelled,
   required controls for Nickname, Organization, Profession, and Job title.
2. Attempt submission with one required field empty. Verify the corresponding
   visible required-field error and that no success confirmation appears.
3. Fill all fields, but set Profession to a synthetic invalid marker that does
   not start with the approved prefix. Submit and verify the visible
   prefix-validation error and no success confirmation. Reload the public page;
   no submitted response is shown or recoverable through the public flow.
4. Fill the four fields with the synthetic response above and submit. Verify
   the exact visible text `Submission successful`.
5. Reload the public page. Verify that it remains a blank questionnaire and
   does not disclose the submitted response to the public visitor.
6. Open the administrator route without an authenticated session and verify it
   redirects to the administrator login route. Sign in only as the provisioned
   synthetic Business App Owner, then enter the administrator view. Verify the
   submitted synthetic nickname and the four labelled values are visible after
   the public-page reload; this is the browser-visible persistence readback.
7. Select Download CSV. Verify a CSV file downloads, its header is
   `id,nickname,organization,profession,jobTitle,createdAt`, and it contains
   each of the four synthetic response values exactly once and no rejected
   submission. Verify every response value retained in the evidence begins with
   `DEMO-REQ-001-20260918-01`.

**Mode-specific execution:**

| Mode | Target and additional evidence | Pass condition |
| --- | --- | --- |
| `PROTO_VERIFICATION` | Run after the Deployment role's populated `proto_survey_questionnaire_poc` migration and synthetic readback evidence. | All seven browser steps pass and the application-flow readback plus CSV contain only the defined synthetic response. |
| `PREVIEW_E2E` | Run against the verified preview URL after its deployment evidence is available. | All seven browser steps pass; retain the compliant browser run identifier, persistence readback result, and CSV assertion result for the coordinator. |
| `PRODUCTION_E2E` | Run only at the `RUN_PRODUCTION_E2E` cursor against the verified production URL after migration, merge, and deployment cursor evidence. | All seven browser steps pass; retain the compliant browser run identifier, persistence readback result, and CSV assertion result required before `COMPLETE`. |

**Independent result and handoff:**

- On success, return `PASS` with mode, exact case ID
  `E2E-KP-REQ-001-001`, target evidence reference, browser-visible
  persistence-after-reload result, CSV assertion result, synthetic-data result
  `COMPLIANT`, and proposed local action `ACCEPT_TEST_EVIDENCE`. The Test Agent
  does not write state or notifications.
- Classify a public validation, submit, persistence, owner-access, or CSV
  mismatch as `NEW_BEHAVIOR_DEFECT`; a failure of this retained path after a
  later requirement as `REGRESSION_DEFECT`; target startup/build failure as
  `BUILD_FAILURE`; migration/readback failure as `MIGRATION_FAILURE`; unclear
  confirmed behavior as `REQUIREMENT_AMBIGUITY`; and inaccessible or unsafe
  target/runtime configuration as `ENVIRONMENT_BLOCKED`.
- Return the classification, compliant evidence references, and a proposed
  local action to the coordinator. The coordinator, rather than the Test
  Agent, records any state transition or routes the issue to the appropriate
  role.
