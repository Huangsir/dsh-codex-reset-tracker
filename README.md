# dsh-codex-reset-tracker

DeepSeek Harness plugin for Codex reset status. It adds a composer entry with a compact status popover and registers the read-only `codex_reset` agent tool. Reset data comes from [didcodexreset.com](https://didcodexreset.com/zh/) and does not include account-specific quota information.

![Light theme](assets/screenshot-light.jpg)

![Dark theme](assets/screenshot-dark.jpg)

## What it shows

- The composer entry opens a compact popover with today's reset status, the latest reset time, and the next scheduled time.
- The day check uses the browser's local calendar day. Scheduled events do not count as completed resets. If `completedAt` and `effectiveAt` are unavailable or invalid, the summary uses `announcedAt`.
- The popover includes the Tibo Sottiaux source post. It shows the Simplified Chinese translation and the English source when both differ.
- New schedule announcements and completed reset events show an unread marker. The marker clears when the popover is open in a visible tab.
- The client requests `/status` on mount and refreshes every 10 minutes. The agent tool can query status or paginated records.

## Install from source

Clone the repository, then add it to a DSH profile:

```sh
git clone https://github.com/loshanvren/dsh-codex-reset-tracker.git
cd dsh-codex-reset-tracker
dsh plugin --profile <profile> add .
```

The package is named `dsh-codex-reset` in the DSH loader and package manifest.

## Agent tool

`codex_reset` supports:

- `action: "status"` — the latest global and Banked reset signals and the next scheduled reset.
- `action: "records"` — one page of records, filtered by `kind`, `page`, and `pageSize`.

The tool accepts an optional `lang` for record translations. Successful responses are cached for 60 seconds by default.

| Config | Default | Purpose |
|---|---:|---|
| `apiBaseUrl` | `https://didcodexreset.com/openapi/v1` | Public API base URL used by the agent tool |
| `cacheTtlSeconds` | `60` | Tool response cache, from 5 to 3600 seconds |
| `timeoutMs` | `20000` | Tool call timeout, from 1000 to 120000 milliseconds |

Override these values under the plugin row's `config` in `cordis.patch.yml`. The public API documents a shared limit of 60 requests per hour per IP.

## Data and license

The reset signals are provided by didcodexreset.com. Tibo Sottiaux's source post and profile image are third-party materials; this project attributes them to the source and does not claim ownership. Project code is licensed under the MIT License.
