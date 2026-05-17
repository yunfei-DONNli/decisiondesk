# 智策台 DecisionDesk — 任务清单

> 状态说明：`[√]` 已完成，`[ ]` 待完成，`[HITL]` 需要用户输入但当前实现已具备入口。

| 状态 | ID | 任务 | 类型 | 依赖 | 关键文件 | 完成标准 | 验证方式 |
|------|----|------|------|------|----------|----------|----------|
| [√] | T01 | 搭建 Electron 三栏工作台骨架 | AFK | - | `src/App.tsx`, `src/workbench/*` | 左中右三栏稳定渲染 | 本地启动与界面截图 |
| [√] | T02 | 实现股票输入、识别与候选确认流程 | AFK | T01 | `src/analysis/input/*` | 支持代码/名称/自然语言输入 | 用例测试：单标的/多候选 |
| [√] | T03 | 配置 Multica + Codex 投研 Agent Squad | AFK | T02 | `multica/agents/*`, `src/analysis/team/multica-bridge.ts`, `electron/main.ts` | 6 个 Codex Agent 可接收分析 Issue 并产出 AnalysisResult | 端到端分析任务验证 |
| [√] | T04 | 生成结果页主状态卡与 HTML 报告 | AFK | T03 | `src/reporting/*`, `src/workbench/ResultPreviewPane.tsx` | 消费 AnalysisResult 输出决策卡、报告与 HTML 文件 | HTML 本地打开与字段校验 |
| [√] | T05 | 实现结果页丰富图表与中度交互 | AFK | T04 | `src/reporting/charts/*` | Chart.js 雷达图/K线/多空权重/风险三角 | 图表交互验证 |
| [√] | T06 | 实现自选股列表与收盘后自动重评估 | AFK | T03 | `src/automation/watchlist/*`, `src/App.tsx` | 自选列表可自动创建 Multica Issue 触发重分析 | 调度模拟与历史生成 |
| [√] | T07 | 实现重新分析与历史版本保留 | AFK | T04 | `src/workbench/history/*`, `src/App.tsx` | 每次重分析创建独立 Multica Issue，历史按时间倒序 | 倒序历史查看 |
| [√] | T08 | 实现多股对比与候选池删改流程 | AFK | T02,T03 | `src/analysis/compare/*`, `src/analysis/input/AnalysisInputPanel.tsx` | 最多 5 只股票并发分析后对比排序 | 对比报告检查 |
| [√] | T09 | 实现准实时价格显示与快照提示 | AFK | T04,T06 | `src/market/realtime/*`, `src/workbench/ResultPreviewPane.tsx` | 列表和状态卡显示实时价，标注分析时间差异 | 实时价与分析时间核对 |
| [√] | T10 | 实现通知代理与应用内/桌面通知 | AFK | T06 | `src/automation/notify/*`, `src/App.tsx`, `src/analysis/team/multica-bridge.ts` | Multica Issue 状态变化触发通知 | 通知链路联调 |
| [√] | T11 | 实现中英文界面与报告切换 | AFK | T01,T04 | `src/i18n/*`, `src/App.tsx`, `src/reporting/reportTemplate.ts` | UI 与报告跟随语言切换 | 双语回归测试 |
| [HITL] | T12 | 实现轻量持仓录入与建议增强 | HITL | T04 | `src/analysis/holding/*`, `src/analysis/input/AnalysisInputPanel.tsx`, `src/reporting/reportTemplate.ts` | 支持成本价与仓位输入 | 场景验证：持仓/未持仓 |
| [√] | T13 | 完成合规、免责声明与来源说明 | AFK | T04 | `src/reporting/legal/*`, `src/App.tsx`, `src/workbench/ResultPreviewPane.tsx` | 首次弹窗 + 结果页简版免责声明 | 合规检查 |

## 当前结论

- `T01-T11`、`T13` 已按代码事实完成。
- `T12` 已实现输入入口、结果联动与报告展示，但是否填入持仓信息仍取决于用户，因此保留 `HITL` 标记。
- 旧版任务表把 `T05-T13` 全部写成待开发，已不符合当前仓库状态。

## 执行架构说明

T03 为架构核心：不再自建 Python 分析引擎，改用 Multica + Codex。

- **Multica** (自托管) 负责任务调度、Agent 管理、WebSocket 进度推送
- **6 个 Codex Agent** 组成投研 Squad：技术面、基本面、新闻面、情绪面、多空辩论、风险主管
- **DecisionDesk 前端**通过 Multica API 创建 Issue 并订阅进度，不直接管理 Agent 生命周期
