# 贡献指南

感谢你参与 PrismUI。这个项目采用轻量社区协作方式，目标是在保留 baidu/amis 兼容性的同时，让 UI Schema、渲染器、SDK 和编辑器继续稳定演进。

## 贡献许可

本项目采用 inbound = outbound：提交贡献即表示你同意该贡献按其所修改文件或子包适用的同一开源许可证授权。

这意味着：

- 修改 Apache-2.0 授权代码时，你的贡献按 Apache-2.0 授权。
- 修改 MIT 或 ISC 子包时，你的贡献按该子包当前许可证授权。
- 不需要额外签署 CLA。
- 当前不强制 DCO sign-off；如果你愿意保留 `Signed-off-by` 也可以。
- 请保留原有版权、许可和 attribution 声明。修改源自 Apache-2.0 的文件时，请保留必要的修改说明。

## 开始之前

适合直接提交 PR 的改动：

- 文档修正、示例补充、类型修正和小型 bug fix。
- 覆盖现有行为的测试用例。
- 与现有架构一致的小型组件能力增强。

建议先开 issue 讨论的改动：

- 包名迁移、构建系统、SDK 输出契约、主题体系或编辑器插件机制。
- 可能改变 UI Schema 兼容性的行为。
- 大范围重构、删除旧 API、调整发布流程或许可证说明。

## 本地开发

```bash
npm i --legacy-peer-deps
npm start
```

常用入口：

```text
http://127.0.0.1:8888/examples/pages/simple
http://127.0.0.1:8888/packages/amis-editor/
```

## 提交前检查

按改动范围选择检查命令，不要求所有 PR 都跑完整构建，但影响公共 API、SDK、主题或编辑器的改动应补足对应验证。

```bash
npm run typecheck
npm run stylelint
npm test --workspaces
npm run build
```

SDK 相关改动还应运行：

```bash
npm run check-sdk-contract
npm run check-sdk-rollup-entry
npm run check-sdk-theme-css
```

单测示例：

```bash
npm test --workspace amis -- -t <spec-name>
./node_modules/.bin/jest packages/amis/__tests__/renderers/Form/buttonToolBar.test.tsx
npm run update-snapshot --workspace amis -- -t <spec-name>
```

## PR 要求

- 保持改动聚焦，一个 PR 解决一个问题或一组紧密相关的问题。
- 说明用户可见影响、兼容性影响和验证方式。
- 修改行为时补充测试；无法补测试时说明原因和人工验证步骤。
- 不要顺手重排无关文件、批量格式化无关代码或删除历史许可声明。
- 包名或发布路径如有迁移，文档应以 release notes 已确认的信息为准；不要预设 `amis-*` 会批量改成 `prismui-*`。

## Commit 和分支

分支名建议使用：

```text
feat/<short-name>
fix/<short-name>
docs/<short-name>
chore/<short-name>
```

提交信息尽量写清楚动机，例如：

```text
fix: keep toast className when rendering close icon
docs: describe PrismUI package migration plan
```

## 兼容性原则

- 优先保持 UI Schema 的向后兼容。
- 不引入绕过主渲染器、数据域、事件系统或 SDK loader 的平行机制。
- 修改默认行为时，尽量提供迁移说明或兼容路径。
- 公共 API、样式类名、SDK 文件名和资源路径都视为兼容性表面。

## 安全问题

不要在公开 issue 或 PR 中披露可利用细节。请按 [SECURITY.md](./SECURITY.md) 报告。
