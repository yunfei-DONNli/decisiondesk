# 视觉验收规范

本文件定义 DecisionDesk 的视觉验收测试套件。当前仓库统一使用 Playwright 场景测试和截图基线：本地优先复用系统 Chrome，CI 使用 Playwright Chromium，基线文件名保持平台无关。

执行需以下环境：
- macOS 已安装 Google Chrome
- 依赖安装完成（`npm install --legacy-peer-deps`）
- DecisionDesk 开发服务器运行中，或直接交给 Playwright 自动拉起

## 测试用例

### 1. 空态工作台
- **URL**: `http://localhost:5173`
- **预期**: 三栏布局渲染正常，左侧导航可见，中栏显示分析输入面板，右栏显示空态提示
- **截图基线**: `tests/e2e/visual-scenarios.spec.ts-snapshots/workbench-empty.png`

### 2. 分析结果页
- **状态**: 模拟 AnalysisResult 数据
- **预期**: 图表信号区正常渲染，包含雷达图、多空权重、风险三角和 K 线
- **截图基线**: `tests/e2e/visual-scenarios.spec.ts-snapshots/result-page.png`

### 3. 自选股列表
- **状态**: 模拟 5 只自选股
- **预期**: 列表显示股票名、价格、分析状态，支持删除操作
- **截图基线**: `tests/e2e/visual-scenarios.spec.ts-snapshots/watchlist.png`

### 4. 多股对比
- **状态**: 模拟 3 只股票对比数据
- **预期**: 对比表格显示综合评分排序，前 5 只上限
- **截图基线**: `tests/e2e/visual-scenarios.spec.ts-snapshots/compare.png`

### 5. 合规弹窗
- **状态**: 首次启动应用
- **预期**: 合规声明弹窗显示，用户确认后关闭
- **截图基线**: `tests/e2e/visual-scenarios.spec.ts-snapshots/compliance-modal.png`

## 运行

```bash
npm run test:e2e
```

首次生成或更新截图基线：

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm run test:e2e:update
```

如需可视化调试：

```bash
npm run test:e2e:headed
```

如系统未安装 Chrome，才需要改回 Playwright 自带浏览器模式，并额外执行：

```bash
npx playwright install chromium
```
