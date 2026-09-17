# Survey Questionnaire POC

## Product boundary

This public POC collects only deliberately fabricated demonstration data. It
must never collect, retain, expose, export, or log real personal or business
information.

## Current capabilities

### REQ-001 — Demonstration questionnaire

Visitors can complete a public questionnaire with exactly four mandatory
plain-text fields:

1. Nickname
2. Organization
3. Profession
4. Job title

Every value must begin with `DEMO-REQ-001-<run-id>`. The form explains this
restriction before submission and rejects values that do not satisfy it. A
successful submission is persisted through a server-side API and displays a
simple success message. It does not display a response summary and cannot be
edited or deleted by the visitor.

One administrator (the Business App Owner) can sign in to view the submitted
demonstration records and download them as CSV.

## Explicit non-goals

- Real personal or business data, including names, telephone numbers and
  addresses.
- Multiple administrators or business-user account management.
- Word export, configurable questionnaire fields, or non-text field types.
- Visitor edits, deletes, response summaries, analytics, or production-grade
  moderation features.

## Delivery rule

The preview must remain under business review until an explicit local approval
to publish. Production migration verification completes before `MERGE_MASTER`.
