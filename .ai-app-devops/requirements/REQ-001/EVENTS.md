# REQ-001 events

| Event | Source | Prior → next revision | Outcome | Idempotency key |
| --- | --- | --- | --- | --- |
| EVT-001 | Business App Owner | 0 → 1 | Confirmed scope: nickname, organization, profession, job title; all required. | `REQ-001:scope:r1` |
| EVT-002 | Business App Owner | 1 → 2 | Confirmed SDD baseline; enter preview-build preparation. | `REQ-001:confirm:r2` |
