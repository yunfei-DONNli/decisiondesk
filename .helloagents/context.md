# 项目上下文

## 项目名称
- 中文：智策台
- 英文：DecisionDesk
- 品牌：智策台 DecisionDesk by 芨芨草

## 产品定位
- 面向个人投资研究者的桌面投研工作台
- 对外定位为研究辅助工具
- 对内保留较强的交易决策建议能力

## 核心能力
- 单股深度分析
- 自选股持续跟踪
- 多股横向对比
- 官方投研团队协作
- 本地 HTML 报告生成与预览

## 平台与架构边界
- 首发平台：macOS
- 桌面技术：Electron + React + TypeScript
- Agent 引擎：Multica (multica-ai/multica) + Codex CLI
- 数据源：AkShare（A股/港股）+ yfinance（美股）
- 执行方式：Multica 自托管 Docker，Agent 通过 Codex CLI 本地执行
- 图表：Chart.js + react-chartjs-2 + chartjs-chart-financial

## 默认工作台结构
- 左栏：任务 / 专家 / 资料库 / 自动化
- 中栏：任务主线程与协作过程
- 右栏：结果预览浏览器

## 经验

- [2026-05-17] 三视角审查（CEO/工程经理/设计）在方案阶段的投资回报率高于预期——一次审查避免 3-7 天错误方向
- [2026-05-17] 有成熟开源方案且功能重叠 > 80% 时优先集成，不自建轮子（Multica 替代自建 agent pipeline）
- [2026-05-17] AI Agent 输出的 JSON 不可信任，必须在边界处加运行时类型守卫（validateAnalysisResult 模式）
- [2026-05-17] 数据源耦合在 Agent 内部导致可控性降低——fallback 逻辑需在 Agent prompt 层面实现
- [2026-05-17] npm 可选依赖（rollup darwin-arm64）可能丢失，修复：`npm install @rollup/rollup-darwin-arm64`
