# 数据源方案

> 决策日期：2026-05-16
> 状态：已确认

## 方案

| 市场 | 首选数据源 | 备选 | 数据类型 |
|------|----------|------|---------|
| A 股 | AkShare | 东方财富 API | 实时行情、历史K线、财务数据、技术指标 |
| 港股 | AkShare | yfinance | 实时行情、历史K线、财务数据 |
| 美股 | yfinance | Alpha Vantage | 实时行情、历史K线、财务数据 |
| 新闻/情绪 | 联网搜索 + NeoData（可选） | — | 新闻聚合、机构评级、情绪分析 |

## 三层架构

```
Layer 1: 结构化行情 — AkShare / yfinance（Python 库，本地调用）
Layer 2: 联网增强   — 搜索引擎 + NeoData Skill（可选）
Layer 3: 本地缓存   — SQLite（历史数据缓存，减少重复请求）
```

## DataSource 接口设计（T01 骨架时实现）

```typescript
interface DataSource {
  name: string;
  markets: Market[];  // 支持的市场
  getQuote(symbol: string, market: Market): Promise<Quote>;
  getHistory(symbol: string, market: Market, range: DateRange): Promise<KLine[]>;
  getFinancials(symbol: string, market: Market): Promise<FinancialData>;
  getTechnicals(symbol: string, market: Market): Promise<TechnicalData>;
}

// 实现
const primarySource: DataSource = new CompositeSource([
  new AkShareSource(),   // A股、港股
  new YFinanceSource(),  // 美股、港股 fallback
]);

// 备用源自动切换
const dataSource = new FallbackSource(primarySource, fallbackSources);
```

## 费用

- AkShare：免费开源
- yfinance：免费，非官方 API
- Alpha Vantage：免费层 25 次/天，付费层 $50/月起

## 风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| AkShare 接口变动 | 锁定版本号，定期更新 |
| yfinance 限流 | 本地缓存 + Alpha Vantage fallback |
| 实时行情延迟 | A 股用 AkShare 5 秒级，标记分析时间 |
| 境外数据不可用 | 仅影响美股分析，A 股/港股不受影响 |
