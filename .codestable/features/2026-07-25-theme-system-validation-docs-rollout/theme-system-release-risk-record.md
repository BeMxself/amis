---
doc_type: feature-artifact
artifact_type: ReleaseRiskRecord
feature: 2026-07-25-theme-system-validation-docs-rollout
status: current
updated: 2026-07-28
---

# Theme System Release Risk Record

## 1. Release Decision

主题系统文档收口可进入 review / QA。核心用户心智已经从主题前缀转到 token、稳定组件类名和主题作用域；examples shell 的旧选择器仍是已知发布风险，不阻塞本 feature，但必须作为后续 cleanup 或发布说明风险保留。

## 2. User-Visible Changes

- 新文档推荐 `--amis-*` token。
- 新文档推荐 `.amis-*` 稳定组件类名。
- 主题差异推荐 `[data-amis-theme]` 作用域。
- `classPrefix` 不再作为新增主题样式 API 推荐。
- `.cxd-*` / `.antd-*` / `.dark-*` 只作为历史、文件名兼容或迁移风险出现。

## 3. Known Limits

| Risk | Impact | Mitigation |
|---|---|---|
| Examples shell still uses old theme selectors | examples can visually pass while still carrying old selector debt | tracked in ExamplesThemeInventory; follow-up migration recommended |
| DOM-only `.cxd-*` alias can slow migration | old custom pages may continue writing `.cxd-*` | docs describe it only as explicit migration aid; AliasRetentionRecord requires manual review within 1 year after migration path is available |
| IE11 cannot use dynamic token switching | users may expect `cssVars` theme switching in IE11 | docs now say IE11 is static CSS fallback only |
| Broad `npm run typecheck` has known baseline failures | final validation may report non-feature failures | document baseline in QA / audit; do not treat as this feature regression without new evidence |

## 4. Validation Summary

Core commands to run before review / QA:

- `npm run check:theme-selectors --workspace amis-ui`
- `npm test --workspace amis-core -- theme`
- `npm test --workspace amis -- button`
- `npm run stylelint`
- `npm run typecheck`
- docs/examples grep commands from checklist

## 5. Non-Automatic Actions

This feature does not push, merge, release, publish, deploy or modify remote docs. Release note wording and examples shell migration remain separate owner decisions.
