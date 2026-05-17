# 智策台 DecisionDesk — 技术架构

> 更新日期：2026-05-16
> 架构决策：采用 Multica + Codex 替代自建 Python 分析引擎

## 技术选型
- 桌面容器：Electron
- 前端：React + TypeScript
- Agent 平台：Multica (multica-ai/multica) 自托管
- Agent 运行时：Codex CLI (通过 Multica Daemon 管理)
- 图表：Chart.js
- 数据源：AkShare (A股/港股) + yfinance (美股)
- 持久化：SQLite (better-sqlite3)

## 架构概览

```
┌──────────────────────────────────────────────────────────┐
│                  DecisionDesk (Electron)                  │
│  ┌──────────────────────────────────────────────────┐    │
│  │          React 前端 (三栏工作台)                    │    │
│  │  左栏: 任务/专家/资料库/自动化                      │    │
│  │  中栏: 过程消息 (WebSocket 进度)                    │    │
│  │  右栏: 结果预览 (内嵌浏览器)                        │    │
│  └────────┬─────────────────────────────────────────┘    │
│           │ IPC                                           │
│  ┌────────┴─────────────────────────────────────────┐    │
│  │  Main Process                                     │    │
│  │  ├─ Multica Bridge (API + WebSocket 客户端)       │    │
│  │  ├─ 窗口管理 + 原生通知                           │    │
│  │  └─ SQLite 本地缓存                               │    │
│  └────────┬─────────────────────────────────────────┘    │
└───────────┼──────────────────────────────────────────────┘
            │ HTTP + WebSocket
            ▼
┌──────────────────────────────────────────────────────────┐
│              Multica (自托管 Docker)                      │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Issue Board                                      │    │
│  │  ├─ T-001: 技术面分析 → Codex Agent              │    │
│  │  ├─ T-002: 基本面分析 → Codex Agent              │    │
│  │  ├─ T-003: 新闻面分析 → Codex Agent              │    │
│  │  ├─ T-004: 情绪面分析 → Codex Agent              │    │
│  │  ├─ T-005: 多空辩论   → Codex Agent              │    │
│  │  └─ T-006: 风险主管裁决 → Codex Agent            │    │
│  └──────────────────────┬───────────────────────────┘    │
│                         │                                 │
│  ┌──────────────────────┴───────────────────────────┐    │
│  │  Agent Daemon (本地)                              │    │
│  │  管理 Codex CLI 进程，实时上报进度                │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

## 投研分析流程

```
用户输入 "分析小米 01810.HK"
        │
        ▼
DecisionDesk → Multica API: 创建父 Issue
        │
        ├─→ 子 Issue T-001: "01810.HK 技术面分析"
        │   Agent: codex-technical-analyst
        │   Prompt: 获取 AkShare K线数据 + MACD/RSI/均线 + 评分
        │
        ├─→ 子 Issue T-002: "01810.HK 基本面分析"
        │   Agent: codex-fundamental-analyst
        │   Prompt: 获取财务数据 + ROE/PE/营收 + 评分
        │
        ├─→ 子 Issue T-003: "01810.HK 新闻面分析"
        │   Agent: codex-news-analyst
        │   Prompt: 联网搜索 + 机构评级 + 催化剂 + 评分
        │
        ├─→ 子 Issue T-004: "01810.HK 情绪面分析"
        │   Agent: codex-sentiment-analyst
        │   Prompt: 资金流向 + 社交媒体情绪 + 评分
        │
        ├─→ 子 Issue T-005: "01810.HK 多空辩论"
        │   Agent: codex-debate-analyst
        │   Prompt: 汇总前 4 角色论点 + 多空权重对比
        │
        └─→ 子 Issue T-006: "01810.HK 风险主管裁决"
            Agent: codex-risk-chair
            Prompt: 三方风险评估 + 最终 BUY/SELL/HOLD + 参数建议
                    │
                    ▼
            AnalysisResult (JSON)
            → DecisionDesk 拉取 → 报告渲染
```

## Multica Agent 配置

| Agent 名称 | 角色 | CLI | 关键 Prompt |
|-----------|------|-----|------------|
| codex-technical-analyst | 技术面分析师 | Codex | K线形态、均线系统、MACD/RSI/KDJ、评分 0-10 |
| codex-fundamental-analyst | 基本面分析师 | Codex | 财报数据、ROE/PE/PB、成长性、评分 0-10 |
| codex-news-analyst | 新闻面分析师 | Codex | 联网搜索、机构评级、催化剂事件、评分 0-10 |
| codex-sentiment-analyst | 情绪面分析师 | Codex | 资金流向、社交情绪、持仓变化、评分 0-10 |
| codex-debate-analyst | 多空辩论员 | Codex | 汇总四维论点、多空权重对比、研究主管裁决 |
| codex-risk-chair | 风险主管 | Codex | 三方风险评估、最终方向、入场/目标/止损、对冲策略 |

## 核心模块

- `src/app-shell/` — Electron 窗口 + 三栏布局
- `src/workbench/` — 任务状态管理、历史版本
- `src/analysis/` — 股票输入(T02)、Multica Bridge(T03)、持仓(T12)、多股对比(T08)
- `src/reporting/` — 报告模板、Chart.js 图表、合规声明
- `src/automation/` — 自选股调度(T06)、通知代理(T10)
- `src/market/` — 准实时价格(T09)
- `src/i18n/` — 双语切换(T11)
- `src/shared/` — 类型定义、AnalysisResult 数据格式

## 关键 ADR
- 首发平台仅 macOS
- Agent 执行引擎：Multica + Codex（不自建）
- 数据源：AkShare + yfinance（免费优先）
- HTML 结果作为首版标准交付格式
- 官方团队优先于用户自由编排
