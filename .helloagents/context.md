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

## 当前交互约定
- 应用启动默认进入“新建任务”态，而不是默认展开某条历史任务
- 左栏历史任务是可选上下文，用户点击后才切换右侧结果与过程视图
- 左栏必须保留明确的“新建任务”入口，用于从任意历史任务切回空白草稿
- 手动输入新的公司名、代码或自然语言问题时，应视为新任务草稿，不得继续复用当前历史任务的视觉上下文
- 候选识别失败时返回空候选，不允许回退展示无关股票，避免把新任务误导成旧任务

## 开发运行注意点
- `npm run dev` 需要真正拉起 Electron 主进程，单独执行 `tsx watch electron/main.ts` 不会注入 preload
- Electron 开发环境默认依赖 `VITE_DEV_SERVER_URL`，当前本地默认地址应与 Vite 保持一致：`http://127.0.0.1:4173`

## 经验

- [2026-05-17] 三视角审查（CEO/工程经理/设计）在方案阶段的投资回报率高于预期——一次审查避免 3-7 天错误方向
- [2026-05-17] 有成熟开源方案且功能重叠 > 80% 时优先集成，不自建轮子（Multica 替代自建 agent pipeline）
- [2026-05-17] AI Agent 输出的 JSON 不可信任，必须在边界处加运行时类型守卫（validateAnalysisResult 模式）
- [2026-05-17] 数据源耦合在 Agent 内部导致可控性降低——fallback 逻辑需在 Agent prompt 层面实现
- [2026-05-17] npm 可选依赖（rollup darwin-arm64）可能丢失，修复：`npm install @rollup/rollup-darwin-arm64`
- [2026-05-17] 桌面应用若默认把历史任务当成当前任务，会严重干扰“新建任务”心智；默认空白草稿态比默认选中历史项更符合任务工作台模型
- [2026-05-17] 股票候选识别宁可返回空，也不要在无法匹配时默认回退无关标的；否则用户会误以为系统在篡改当前任务
