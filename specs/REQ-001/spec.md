# REQ-001 — Demonstration questionnaire

**Status:** Confirmed product baseline
**Project mode:** NEW
**Run ID:** `DEMO-REQ-001-20260918-01`

## Goal

Provide a shareable public questionnaire POC that demonstrates a complete
browser-to-server-to-database submission path while preventing collection of
real personal or business information.

## In scope

- A public form with required nickname, organization, profession, and job-title
  plain-text fields.
- Visible demo-data guidance and server-side validation that each submitted
  value starts with `DEMO-REQ-001-<run-id>`.
- Server-side persistence and a clear `Submission successful` confirmation.
- A single Business App Owner administrator experience for record viewing and
  CSV export.
- One key-path E2E check: submit compliant demo values, reload, then verify
  the administrator can find and export that record.

## Acceptance criteria

- **AC-001:** The public page visibly states that real personal and business
  information must not be entered.
- **AC-002:** All four fields are required and labelled Nickname, Organization,
  Profession, and Job title.
- **AC-003:** A missing field or a value without the required demo prefix is
  rejected without persistence.
- **AC-004:** A compliant four-field submission reaches a server-side handler,
  persists, and shows `Submission successful`.
- **AC-005:** Refreshing and authenticated administrator access exposes the
  persisted compliant record and provides a CSV download containing it.
- **AC-006:** Preview and production evidence use only data beginning with
  `DEMO-REQ-001-20260918-01`; logs, exports, and screenshots retain no other
  submitted values.

## Assumptions

- The confirmation view is a simple success message rather than a response
  summary.
- The administrator entrance is for the Business App Owner alone.

## This change does not

- Accept real information or any data without the demo prefix.
- Add Word export, field configuration, multiple field types, multi-user
  administration, visitor editing, or visitor deletion.
