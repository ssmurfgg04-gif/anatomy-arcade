# DECISION RECORDS

Append-only. One block per decision. (Context lives in CONTEXT.md §Key decisions; this file holds the reasoning.)

## D1 — Repo layout (P0)
- Spec stored verbatim as `PROJECT.md` (canonical, never edited — changes become addenda below it or in docs/).
- `CONTEXT.md` = living state, `worklog.md` = append-only history, `docs/` = evidence logs.
- Reason: sandbox wipes + parallel agents require single-source, git-durable state.

## D2 — Context durability: 3 layers (P0)
- Layer 1: GitHub milestone pushes (primary anti-loss).
- Layer 2: in-repo CONTEXT.md + worklog.md (recoverable via clone).
- Layer 3: cortexm facts (user's context-m repo tooling) for semantic recall of decisions/ideas; DB + markdown export committed into context-m repo.
- Reason: user explicitly asked for cortexm/context-m usage so parallel agents and post-wipe runs recover full context.

## D3 — Parallel-agent protocol (P0)
- Every subagent: read CONTEXT.md + worklog.md → work → append worklog → update CONTEXT.md status → commit+push.
- Long-running jobs use `nohup ... &` (Task channels can time out).
