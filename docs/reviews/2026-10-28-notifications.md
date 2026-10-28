# PR #5 — v0.5.0 acceptance

Contributor: [Huangsir](https://github.com/Huangsir).
PR: https://github.com/loshanvren/dsh-codex-reset-tracker/pull/5.
Baseline: `f90fd606b83f52f8b54f9e2f29bdd1c2c74a3fde`.
Contributor head: `29a53e367c5e817339cacd30ad7ef3debc2bcc70`.
Reviewed fix: `62516e44f2e15b98e5b18ab51671250dcdd78a67`.

## Behavior

The dock displays source forecast percentages at rounded confidence >=80%, keeps
valid forecasts during refresh, restores its normal name after failures, and
reserves width across label changes. The popover still reports source schedule
probabilities below 80%; forecasts never become completed records.

The footer requests browser notification permission only after a click. New
completed reset events produce a localized notification, while the initial
snapshot establishes a baseline. The unread dot/storage are removed. Browser
notification delivery depends on browser and OS permissions.

## Review and fixes

Both independent Codex reviewers found a cross-page deduplication defect: two
already-initialized pages ignored a newly stored key and each announced the same
completion. Reviewer one additionally found that a single completion appearing
in both API slots changed a composite key and repeated the notification.

The fix stores individual recent completion IDs, reloads shared state for each
decision, and serializes decisions using Web Locks when supported. Blocked
storage keeps per-page memory deduplication; without Web Locks, cross-page
coordination is best effort. The recent-ID history is bounded at 128 records.

Four added regressions failed against the original contribution and pass after
the fix: initialized pages, duplicate slot identities, concurrent lock-protected
pages, and reappearance of an already-announced older completion.

## Validation

- All 31 tests, syntax checks, diff whitespace and pack dry-run pass.
- Chromium Chinese/English × light/dark at 360px: 80/93/100% dock labels, stable
  width, correct probability colors, error/retry recovery, 65% source headline in
  the popover, permission button state and one notification per completion pass.
- Two real same-origin Chromium pages using the actual Web Locks implementation
  produce one notification construction for a concurrent shared completion.
- Notification API delivery was stubbed in isolated browser contexts; no actual
  OS notification permission or personal DSH profile settings were changed.
- Test dates replay the captured October 22 public API fixture deterministically.

## Review record

| Round | Reviewer | Finding | Disposition |
|---|---|---|---|
| R1 | Codex one and two | Duplicate announcements across open pages | Fixed; shared IDs and Web Locks |
| R1 | Codex one | Composite slot key re-announces one completion | Fixed; individual event IDs |
| R2 | Codex one | Standards / Spec | CLEAR |
| R2 | Codex two | Standards / Spec | CLEAR |
