# v0.4.0 review and acceptance

> Historical v0.4.0 record. The live-schedule headline interpretation is superseded by [v0.4.1](2026-10-22-source-report.md).

Baseline: `44f098ac1611f654abd2f1190f4c21d99cd1f02f`.
Implementation reviewed: `24206222aee33955cc1f8883817c154af9630ab7`.
Scope: issues #1 and #2, full plugin sanity check and marketplace distribution.

## Evidence and interpretation

The captured public `/status` response at `2026-10-22T10:11:53.095Z`
(`test/fixtures/status-pending.json`) has the last confirmed global completion on
October 20. Day 17 is `reset_scheduled`, `pending`, effective October 23 at 02:00
Asia/Shanghai. It does not prove a missed completed reset. The old UI's absolute
“No” is misleading; v0.4.0 says “Unconfirmed” and explains the pending announcement.
Scheduled or elapsed time alone never establishes completion. Public reports do
not establish an individual account's quota.

`TZ=Asia/Shanghai node --test test/client.test.js` failed on the old code in five
cases (name, misleading answer, foreground refresh, interactive freshness,
missing timeout). After the fix, all eight cases pass. Syntax checks and
`npm pack --dry-run` also pass. The fixture is public data, without credentials.

Actual Chromium rendering of the production client passed in Chinese/light and
English/dark at 360px: pending summary, local time zone, new completion fetched
when reopening after 61 seconds, Escape dismissal, no horizontal overflow, no
page errors. Network responses were deterministic fixture replays.

An isolated DSH_HOME profile installed the packed artifact using the actual
`dsh plugin --profile web add <tarball>` command. `--dump-config` composes exactly
one `codex-reset` row with package `dsh-codex-reset-tracker`. The installed plugin
is shown as **Codex Reset Tracker** in DSH's plugin UI. The CLI's `plugin --help`
confirms `remove <pkg>` is forwarded to pnpm; migration removes the old package
before installing the renamed one. Peer warnings in the isolated profile reflect
host-supplied Schemastery; DSH's schema inspection resolves the plugin Config.
The host's schema inspection also reports pre-existing built-in tree-carrier
warnings, separate from this plugin. Composer integration was verified separately
in the controlled React/browser host; no account credentials were configured in
the isolated DSH profile.

## Round 1 conclusions

Two independent Codex reviewers reviewed the same diff, full source, requirements,
installation migration, and marketplace rules.

- Reviewer one — Standards: CLEAR. Spec: CLEAR.
- Reviewer two — Standards: CLEAR. Spec: CLEAR.

No actionable code defects or standards violations remain. Release execution must
still verify the uploaded tarball and the single marketplace YAML update; code
review alone does not establish publication or market acceptance.

## Review record

| # | Round | Reviewer | Issue | Disposition |
|---|---|---|---|---|
| 1 | R1 | Primary | Absolute “No” for unconfirmed status | Fixed; pending notice and local/fetch times |
| 2 | R1 | Primary | Recovery/opening does not refresh stale status | Fixed; deduplication and cooldown regression tests |
| 3 | R1 | Primary | Request can remain loading indefinitely | Fixed; abort timeout and retry regression test |
| 4 | R1 | Primary | Installed package name omits tracker | Fixed; manifest/lock/loader/patch and migration |

> Both independent reviewers returned CLEAR in R1; no further code-review round required.
