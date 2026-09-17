---
application_id: survey-questionnaire-poc
requirement_id: REQ-001
run_id: DEMO-REQ-001-20260918-01
status: HELD
acquired_at: 2026-09-18
---

# Application implementation lock

The local orchestrator holds this lock for REQ-001. No second requirement may
enter `BUILDING_PREVIEW` or later until this lock is released.
