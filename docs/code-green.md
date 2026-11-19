# Code Green: Cleanup, Hygiene, and Finishing

Code Green is the cleanup and finishing phase after a feature or review. Its purpose is to remove dormant material and make small, approved improvements without changing the behavior of working functionality.

## Core rule: prove unused before delete

An AI suggestion, a search hit, or a compiler warning is a candidate — not proof. A candidate is safe to remove only when:

- a repository-wide reference search (source, routes, tests, scripts, docs, deployment files) finds no live use;
- typecheck, tests, and the production build still pass after removal;
- no API contract, database structure, environment variable, dependency, Compose service, role, or deployment behavior changes;
- anything ambiguous or irreversible has explicit human approval.

If the proof is incomplete, leave the code in place and report it as deferred.

## Preserve by default

Unless a change is explicitly approved and verified, preserve:

- working functionality and user-visible behavior;
- route paths, response shapes, auth requirements, and roles;
- database schema, data, and migrations;
- environment variable names and meanings;
- Docker Compose services and deployment configuration;
- installed dependencies and package scripts.

## Allowed without behavior change

- remove proven-unused imports, locals, parameters, private functions, and dead files;
- align stale comments or documentation with the current code;
- remove generated output only when it is untracked and ignored (never committed build output);
- enable compiler hygiene checks after the repository is clean;
- make small type or clarity improvements covered by existing tests.

## Not allowed without explicit approval

- remove or upgrade dependencies;
- add, remove, or rename environment variables;
- change database schema, migrations, data, API paths, response shapes, auth, roles, payments, or deployment services;
- delete files that were not created by the agent or that may have users outside this repository;
- perform broad formatting churn, rewrites, or unrelated refactors during cleanup.

## Procedure

1. **Inventory non-destructively.** Run typechecking with unused-code checks, repository searches, and package-script audits. Do not edit while inventorying.
2. **Prove each candidate.** Search for imports, route references, tests, dynamic strings, documentation, and deployment use. Record why it is unused.
3. **Classify.** Mark each candidate as Safe, Needs approval, or Leave. Apply only the Safe set.
4. **Make the smallest change.** Keep one concern per change and do not mix cleanup with feature work.
5. **Verify.** Run `npm run verify`; add focused checks when the existing suite cannot prove behavior.
6. **Report.** State what was removed, the proof, what was deferred, and any residual risk.

## Definition of done

- No working code, contract, schema, environment, dependency, service, or role changed without explicit approval.
- Every deletion has a recorded reference search and passes verification.
- `npm run verify` passes.
- Deferred cleanup candidates are listed instead of silently ignored.
