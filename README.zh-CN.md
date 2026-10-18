[English](README.md) | 简体中文

# dsh-codex-reset-tracker

DeepSeek Harness 的 Codex 重置状态插件。它在 composer 输入区添加一个入口，打开后显示简洁的状态浮层，并注册只读智能体工具 `codex_reset`。

## 致谢

重置信号和可用译文由 [Did Codex Reset](https://didcodexreset.com/zh/) 提供。感谢其维护者收集和整理这些公开重置信号，并提供[只读 API](https://didcodexreset.com/zh/api.html) 和 [OpenAPI 规范](https://didcodexreset.com/openapi/v1/openapi.json)。本仓库将这些上游工作集成到 DSH；该 API 不包含特定账号的配额信息。

原始重置公告来自 [Tibo Sottiaux (@thsottiaux)](https://x.com/thsottiaux)。

## 截图

| 浅色主题 | 深色主题 |
|---|---|
| <a href="assets/screenshot-light.jpg"><img src="assets/screenshot-light.jpg" alt="浅色主题" width="380"></a> | <a href="assets/screenshot-dark.jpg"><img src="assets/screenshot-dark.jpg" alt="深色主题" width="380"></a> |

## 显示内容

- composer 输入区的入口会打开简洁的状态浮层，显示今天的重置状态、最近一次重置时间和下次排期时间。
- “今天”的判断使用浏览器本地日历日期。已排期事件不计为已完成重置。如果 `completedAt` 和 `effectiveAt` 缺失或无效，摘要会使用 `announcedAt`。
- 浮层包含 Tibo Sottiaux 的来源帖子。当简体中文译文与英文原文不同时，会同时显示两者。
- 新的排期公告和已完成的重置事件会显示未读标记。浮层在可见标签页中打开时，标记会清除。
- 客户端加载时请求 `/status`，之后每 10 分钟刷新一次。智能体工具可查询状态或分页记录。

## 从源码安装

克隆仓库，然后将其添加到 DSH 配置档案：

```sh
git clone https://github.com/loshanvren/dsh-codex-reset-tracker.git
cd dsh-codex-reset-tracker
dsh plugin --profile <profile> add .
```

在 DSH 加载器和 `package.json` 清单中，包名均为 `dsh-codex-reset`。

## 智能体工具

`codex_reset` 支持：

- `action: "status"` — 返回最新的全局重置与 Banked 重置信号，以及下次排期的重置。
- `action: "records"` — 返回一页记录，可按 `kind`、`page` 和 `pageSize` 筛选。

工具接受可选的 `lang` 参数，用于获取记录译文。成功响应默认缓存 60 秒。

| 配置项 | 默认值 | 用途 |
|---|---:|---|
| `apiBaseUrl` | `https://didcodexreset.com/openapi/v1` | 智能体工具使用的公开 API 基础 URL |
| `cacheTtlSeconds` | `60` | 工具响应缓存时间，可设为 5 到 3600 秒 |
| `timeoutMs` | `20000` | 工具调用超时时间，可设为 1000 到 120000 毫秒 |

可在 `cordis.patch.yml` 对应插件条目的 `config` 下覆盖这些值。公开 API 文档说明，共享限额为每个 IP 每小时 60 次请求。

## 许可证

本仓库代码适用 MIT 许可证。该许可证不对 Did Codex Reset 的数据或译文，以及 Tibo Sottiaux 的帖子和个人资料图片重新授权。
