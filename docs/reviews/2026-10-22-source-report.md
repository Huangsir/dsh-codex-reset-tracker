# v0.4.1: report the source schedule headline

Baseline: `d15ff3efa4bba1e44ca4f59bf5422501a221b8da`.
Reviewed runtime: `e7cc9d9`.

The product reports Did Codex Reset's public signals. Its live-schedule headline
must preserve the source's probability and Yes presentation, rather than convert
that headline into a completed-today-only answer.

## Source contract

Observed on https://didcodexreset.com/zh/ on 2026-10-22:

- Question: 接下来会有 Codex 重置吗？
- Headline: ≥86% 是.
- API: nextScheduled.confidence = 0.86; kind = reset_scheduled; state = pending.
- Local expected time: October 23, 02:00 Asia/Shanghai.

The source's public presentation rounds schedule confidence, uses ≥ except for
100%, and displays Yes for live schedule confidence without a plugin-defined
80% threshold. An actual completion today takes priority. A schedule remains a
schedule record; the latest completed reset is shown separately.

This client projects the public /status API's live pending schedule into that
presentation. It does not consume the website's full internal feed, including
its separate monitor/grace metadata, and does not claim to reproduce those
unexposed states. The screenshot case and live-schedule headline are the scope
of this correction. The implementation is independently written; no upstream
application source is bundled.

## Verification

The captured Day 17 regression failed under v0.4.0's Unconfirmed rendering and
passes with ≥86% Yes and the upcoming-reset heading. Twelve tests cover the
reporting headline, 80/65/100% formatting, missing confidence, spanning windows,
completed-record priority, package identity and existing refresh/cooldown/timeout
behavior. All pass, as do syntax checks.

Chromium Chinese/light and English/dark at 360px validate the visible ≥86% Yes
headline, opening refresh to a newly confirmed completion, Escape dismissal,
local zone, and no horizontal overflow or runtime errors. README screenshots
were refreshed from the production client rendering with the captured public
response. Browser screenshots use fixtures rather than live timing.

## Review record

| Round | Reviewer | Finding | Result |
|---|---|---|---|
| R1 | Codex one and two | Missing-confidence multi-day window did not cover now | Fixed; failing regression observed, now passing |
| R1 | Codex two | Migration docs pinned v0.4.0 | Fixed; stable latest/download links |
| R2 | Codex one | Standards / Spec | CLEAR |
| R2 | Codex two | Standards / Spec | CLEAR |
