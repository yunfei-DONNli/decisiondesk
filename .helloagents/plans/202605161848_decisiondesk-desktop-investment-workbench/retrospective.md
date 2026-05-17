# Sprint 回顾 — 智策台 DecisionDesk v0.1.0

> 回顾日期：2026-05-17
> 方案包路径：plan/202605161848_decisiondesk-desktop-investment-workbench/

## Keep（继续保持）

- **三视角审查前置** — CEO/工程经理/设计三个视角的审查在 build 前发现了 7 个问题（数据源阻塞、T03 任务过重、术语不统一、等待体验缺失等），避免了实现阶段的返工
- **架构决策及时调整** — CEO 审查后从自建 Python pipeline 切换为 Multica + Codex，T03 从最重任务（预估 3-7 天）变为最轻任务（1-2 天）。这个决策来自于"不自建轮子"的原则
- **竞品参考加速设计** — WorkBuddy 的投研报告模板和 12 人角色矩阵直接提供了可复用的设计参考，T04-T05 不是从零设计
- **方案包结构完整** — PRD 13 维度 + contract.json（含验证契约）+ decisions.md（18 条关键决策），为后续 ~verify 提供了明确的验证边界
- **TypeScript 严格类型 + 运行时验证** — `validateAnalysisResult` 函数在 Multica JSON 解析边界处防止了类型不安全的数据流入前端

## Change（需要改进）

- **数据源 fallback 未实现** — `contract.json` 要求 data-source-fallback-behavior，但代码中未见 AkShare→yfinance 的显式切换逻辑。根因：Multica Agent 内部调用数据源，DecisionDesk 不直接管理。改进：应在 Multica Agent prompt 中明确 fallback 指令，或在 DecisionDesk 端增加数据源健康检查
- **视觉验收自动化缺失** — `contract.json` 要求 5 screens × 4 states 的视觉验收，但无 Playwright/Puppeteer 等截图工具。改进：v0.2 可加入 E2E 截图测试
- **vitest 依赖脆弱** — rollup darwin-arm64 可选依赖在 npm 下反复丢失，需手动修复。改进：在 CONTRIBUTING.md 中记录 `npm install @rollup/rollup-darwin-arm64` 修复步骤
- **T03-T05 的实现边界在状态文件中不够清晰** — STATE.md 说"已完成 T05：HTML 报告本地导出"，但实际 T05 包括图表和导出两部分，术语歧义可能导致后续开发者误判进度

## Learn（经验沉淀）

- **三视角审查的投资回报率高于预期** — 投入约 1 小时做 CEO+Eng+Design 审查，换回了架构决策优化（Multica）、MVP 范围明确、避免了至少 3-7 天的错误方向投入
- **「不自建轮子」在 agent 编排领域尤其成立** — Multica 提供了任务调度、WebSocket 进度、Agent 发现、Issue fan-out，这些如果自建需要数百行代码。决策原则：有成熟开源方案且功能重叠 > 80% 时，优先集成
- **TypeScript 运行时类型守卫在 AI 产出的 JSON 边界处是必需品** — Codex Agent 输出的 JSON 不能信任，`validateAnalysisResult` 是最后防线
- **数据源耦合在 Agent 内部会导致可控性降低** — DecisionDesk 不直接控制数据源调用，fallback 逻辑需要在 Agent prompt 层面实现，这是 Multica 架构的固有特性

## Metrics（数据复盘）

| 指标 | 预估 | 实际 | 偏差 |
|------|------|------|------|
| 任务数 | 13 | 13 | 0 |
| 方案变更 | 0 | 1（Python→Multica） | +1 |
| 验证循环 | — | 1 | — |
| 文件变更 | — | 35 | — |
| 代码行数 | — | 4,504 | — |
| 测试通过 | — | 20/20 | — |
| 审查通过 | — | 3/3 | — |
| Git 提交 | — | 1 (`23d94cc`) | — |

## 经验已同步到

- 待 ~learn 命令执行后同步到 context.md
