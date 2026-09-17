# REQ-001 events

| Event | Source | Prior → next revision | Outcome | Idempotency key |
| --- | --- | --- | --- | --- |
| EVT-001 | Business App Owner | 0 → 1 | Confirmed scope: nickname, organization, profession, job title; all required. | `REQ-001:scope:r1` |
| EVT-002 | Business App Owner | 1 → 2 | Confirmed SDD baseline; enter preview-build preparation. | `REQ-001:confirm:r2` |
| EVT-003 | Local orchestrator | 2 → 3 | Created verified `req/REQ-001` worktree from master baseline `65a42b0`. | `REQ-001:worktree:r3` |
