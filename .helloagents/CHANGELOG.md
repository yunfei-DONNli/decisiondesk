# 变更记录

## [v0.1.0] — 2026-05-17

### Changed
- 修正 Electron 开发启动链路：`dev:electron` 改为真正通过 Electron 启动主进程，修复浏览器模式下 preload 未注入导致的 `未检测到桌面端 Multica API` 问题
- 修正 Electron 开发默认渲染地址为 `http://127.0.0.1:4173`，与当前 Vite 开发端口保持一致
- 调整任务工作台默认交互：应用进入后默认展示“新建任务”态，历史任务仅在用户主动点击后接管右侧内容
- 新增左侧“新建任务”入口，支持随时从历史任务切回全新草稿任务
- 修正候选识别逻辑：移除无法识别时默认回退到小米/茅台的行为，并补充阿里巴巴（`9988.HK` / `BABA`）候选
- 调整输入面板文案与状态：手动输入新任务时清空旧任务摘要、旧错误和旧对比结果，避免视觉上误判为在旧任务上继续修改

### Added
- 新增 `stockResolver` 单测，覆盖小米、阿里巴巴和未知公司三类识别路径

### Added
- T01 Electron + React + TypeScript 三栏桌面工作台
- T02 股票输入识别（代码/名称/自然语言）
- T03 Multica + Codex 6 Agent 投研 Squad
- T04 决策卡 + HTML 报告生成（521 行模板）
- T05 Chart.js 四图（雷达图/蜡烛K线/多空权重/风险三角）
- T06 自选股列表与收盘后自动重评估
- T07 历史版本保留与管理
- T08 多股对比（最多 5 只）
- T09 准实时价格显示
- T10 通知代理系统
- T11 中英文双语切换（271 行字典）
- T12 轻量持仓录入
- T13 合规声明与免责弹窗

### Technical
- TypeScript 编译零错误
- 20/20 测试通过
- AnalysisResult 类型守卫（validateAnalysisResult）
- Multica API 集成（735 行 IPC 通道）
- 本地 localStorage 持久化

## 2026-05-16
- 新增：智策台 DecisionDesk 完整 PRD 方案包
- 新增：产品上下文、设计契约、项目约定
- 新增：CEO/工程经理/设计三视角审查
- 新增：数据源方案（AkShare + yfinance）
