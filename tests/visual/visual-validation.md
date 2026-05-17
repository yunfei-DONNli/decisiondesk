# 视觉验收规范

本文件定义 DecisionDesk 的视觉验收测试套件。执行需以下环境：
- Playwright (`npx playwright install chromium`)
- DecisionDesk 开发服务器运行中 (`pnpm dev`)

## 测试用例

### 1. 空态工作台
- **URL**: `http://localhost:5173`
- **预期**: 三栏布局渲染正常，左侧导航可见，中栏显示分析输入面板，右栏显示空态提示
- **截图**: `screenshots/workbench-empty.png`

### 2. 分析结果页
- **状态**: 模拟 AnalysisResult 数据
- **预期**: 决策卡顶部显示 BUY/SELL/HOLD，评分卡 5 维度，多空论点区，风险三角图
- **截图**: `screenshots/result-page.png`

### 3. 自选股列表
- **状态**: 模拟 5 只自选股
- **预期**: 列表显示股票名、价格、分析状态，支持删除操作
- **截图**: `screenshots/watchlist.png`

### 4. 多股对比
- **状态**: 模拟 3 只股票对比数据
- **预期**: 对比表格显示综合评分排序，前 5 只上限
- **截图**: `screenshots/compare.png`

### 5. 合规弹窗
- **状态**: 首次启动应用
- **预期**: 合规声明弹窗显示，用户确认后关闭
- **截图**: `screenshots/compliance-modal.png`

## 运行

```bash
npx playwright test tests/visual/
```
