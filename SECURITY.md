# 安全策略

## 支持范围

PrismUI 目前优先支持当前主分支和正在发布的 PrismUI 版本。历史 baidu/amis 版本不由本项目单独承诺安全维护；如问题仍影响 PrismUI 当前代码线，会按 PrismUI 的修复流程处理。

## 报告漏洞

请不要在公开 issue、PR、讨论区或社交渠道披露可利用细节。

推荐报告方式：

1. 优先使用 GitHub Security Advisory 私密报告入口（如果仓库已启用）。
2. 如果私密报告入口不可用，请创建一个标题以 `[Security]` 开头的 issue，只描述受影响模块、影响范围和联系方式，不公开复现 payload、利用链或敏感日志。
3. 维护者会在确认后安排私密沟通渠道，并在修复可用后公开说明。

报告时请尽量包含：

- 受影响的包、版本或提交。
- 影响范围，例如 XSS、权限绕过、任意请求、构建产物污染或依赖供应链问题。
- 最小复现步骤或概念验证，但不要在公开渠道发布可直接利用的 payload。
- 你是否已经在生产环境观察到利用迹象。

## 处理流程

- 收到报告后先确认影响范围和可复现性。
- 修复会优先保持 UI Schema、SDK 和渲染器兼容性。
- 对高风险问题，修复合并后会尽快发布版本和安全说明。
- 如果问题来自第三方依赖，会结合依赖升级、临时缓解和发布风险决定处理方式。

## Security Policy

Please do not disclose exploitable details in public issues or pull requests.

Use GitHub Security Advisory private reporting when available. If private reporting is unavailable, open a public issue titled `[Security] ...` with only high-level impact, affected modules, and contact information. Do not include exploit payloads, full reproduction chains, or sensitive logs in public.
