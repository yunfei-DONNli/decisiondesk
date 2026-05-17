# DecisionDesk Multica Agent Squad

本目录定义智策台在 Multica 中使用的官方 Codex 投研团队。

## 官方角色
- `codex-technical-analyst`
- `codex-fundamental-analyst`
- `codex-news-analyst`
- `codex-sentiment-analyst`
- `codex-debate-analyst`
- `codex-risk-chair`

## 目标
- 统一每个角色的职责、输入、输出
- 统一输出 `AnalysisResult` 子结果字段，便于最终汇总
- 为后续脚本化创建 Multica agents 和 issues 做准备

## 数据源与 Fallback 规则

所有 Agent 在获取金融数据时必须遵循以下规则：

| 市场 | 首选数据源 | Fallback | 说明 |
|------|----------|----------|------|
| A 股 | AkShare (Python `akshare`) | 东方财富公开接口 | 优先 `stock_zh_a_hist` |
| 港股 | AkShare (Python `akshare`) | yfinance (Python) | `stock_hk_hist` |
| 美股 | yfinance (Python) | Alpha Vantage API | 需配置 API key |

**Fallback 触发条件**：首选数据源 3 次重试失败或返回空数据后，自动切换备选源。

**数据缺失处理**：所有数据源均失败时，在 `sourceSummary` 中记录缺失的数据类型和原因，不阻塞分析流程。
