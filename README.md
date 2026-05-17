# DecisionDesk

DecisionDesk 是一个基于 React + Electron 的投研工作台，用来把多代理分析、结果预览、自选股跟踪、实时行情刷新和 HTML 报告导出串到同一套桌面交互里。

当前仓库包含三部分核心能力：

- 分析工作台：输入股票代码、名称或问题后，创建 Multica issue 并拉取结构化 `AnalysisResult`
- 决策结果面板：展示评分、图表、风险提示、数据来源说明和 HTML 报告预览
- 自动化辅助：自选股重评、桌面通知、实时行情刷新、视觉回归测试和 CI 验证

## 技术栈

- 前端：React 19、TypeScript、Vite
- 桌面壳：Electron
- 图表：Chart.js、`chartjs-chart-financial`、`react-chartjs-2`
- 测试：Vitest、Playwright
- 多代理桥接：Multica CLI + `multica/agents/` 里的投研角色定义

## 运行前提

### 必需

- Node.js 22 左右版本为宜
- npm
- pnpm

说明：
- 仓库当前用 `package-lock.json` 和 `npm ci` 管依赖安装
- 但 `npm run dev` 内部会调用 `pnpm dev:renderer` 和 `pnpm dev:electron`，所以本地开发仍需要安装 `pnpm`

### 按功能需要

- `multica` CLI：用于创建分析 issue、读取分析结果、列出 agent
- Python 3：供 AkShare / yfinance 数据链路使用
- Google Chrome：本地 Playwright 截图回归优先复用系统 Chrome

## 安装

```bash
npm install
```

如果本机还没有 `pnpm`：

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

如果需要完整联调 Multica 数据链路，还需要准备：

- 可用的 `multica` 命令
- 对应 Python 运行环境和数据源依赖

`multica/agents/README.md` 中已经约定了当前 agent 编排的数据源策略：

- A 股优先 AkShare，失败后回退公开接口
- 港股优先 AkShare，失败后回退 yfinance
- 美股优先 yfinance，必要时再回退 Alpha Vantage

## 开发

启动桌面开发环境：

```bash
npm run dev
```

这会同时启动：

- Vite renderer：默认 `http://127.0.0.1:5173`
- Electron main / preload 热更新进程

如果只想单独启动前端：

```bash
npm run dev:renderer
```

如果只想单独观察 Electron 主进程：

```bash
npm run dev:electron
```

## 构建

```bash
npm run build
```

这个命令会完成三件事：

- TypeScript project build
- Vite 前端生产构建
- 把 `electron/main.ts`、`electron/preload.ts`、`electron/report-export.ts` 转译到 `dist-electron/`

## 测试

### 类型与单元测试

```bash
npm run lint
npm test
```

- `npm run lint` 当前实际执行的是 `tsc --noEmit`
- `npm test` 使用 `vitest run`
- `vite.config.ts` 已排除 `tests/e2e/**`，避免 Vitest 和 Playwright 互相抢测试文件

### E2E 与视觉回归

```bash
npm run test:e2e
```

可视化调试：

```bash
npm run test:e2e:headed
```

更新截图基线：

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm run test:e2e:update
```

当前 Playwright 约定：

- 本地默认优先走系统 Chrome
- CI 统一走 Playwright Chromium
- 截图基线放在 `tests/e2e/visual-scenarios.spec.ts-snapshots/`
- 基线文件名已做平台无关处理，不再区分 `darwin` / `linux`

当前已覆盖的核心 e2e 场景：

- 空态工作台
- 分析结果页
- 自选股列表
- 多股对比
- 合规弹窗

更细的视觉说明见 [tests/visual/visual-validation.md](./tests/visual/visual-validation.md)。

## CI

GitHub Actions 工作流定义在 [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)。

当前分两段：

- `quality`：`npm ci`、`npm run lint`、`npm test`、`npm run build`
- `e2e`：安装 Playwright Chromium 后执行 `npm run test:e2e`

另外还启用了：

- 同一 PR / 分支的并发取消
- Playwright 浏览器缓存
- 失败时上传 `test-results/` 和 `playwright-report/`

## 目录结构

```text
src/                React 前端与工作台逻辑
electron/           Electron main / preload / report export
multica/            Multica agents 定义
scripts/            构建和同步脚本
tests/e2e/          Playwright 场景与截图基线
tests/visual/       视觉验收说明
dist/               前端构建产物
dist-electron/      Electron 构建产物
```

## 关键模块

- `src/analysis/input/AnalysisInputPanel.tsx`
  负责分析任务发起、多股对比和自动重评触发
- `src/workbench/Sidebar.tsx`
  负责历史记录、自选股和通知区
- `src/workbench/ResultPreviewPane.tsx`
  负责图表、合规说明、HTML 报告预览与导出
- `src/reporting/charts/AnalysisCharts.tsx`
  负责雷达图、多空权重、风险三角和 K 线渲染
- `electron/main.ts`
  负责 Multica 调用、实时行情查询、桌面通知和导出落盘

## 已知注意点

- 没有可用的 `multica` 运行环境时，桌面工作流里的分析任务无法真正取回远端结果
- 本地若没有安装 Chrome，Playwright 需要先执行 `npx playwright install chromium`
- `CONTRIBUTING.md` 里仍保留了较早期的环境说明；以本 README 和当前 `package.json` 为准
