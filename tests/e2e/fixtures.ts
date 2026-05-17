export const ANALYSIS_HISTORY_STORAGE_KEY = "decisiondesk.analysis-history.v1";
export const WATCHLIST_STORAGE_KEY = "decisiondesk.watchlist.v1";
export const NOTIFICATION_STORAGE_KEY = "decisiondesk.notifications.v1";
export const COMPLIANCE_ACK_STORAGE_KEY = "decisiondesk.compliance-ack.v1";

export const sampleIssue = {
  assignee: "Lead Researcher",
  childIssues: [
    { assignee: "技术分析师", id: "child-tech-1", title: "技术面分析" },
    { assignee: "基本面分析师", id: "child-fund-1", title: "基本面分析" }
  ],
  id: "issue-1810",
  identifier: "DD-1810",
  prompt: "分析小米集团",
  runtime: {
    agents: ["技术分析师", "基本面分析师", "情绪分析师"],
    detail: "所有子任务已经汇总完毕。",
    squads: ["研究总台"],
    status: "ready"
  },
  status: "completed",
  title: "小米集团综合分析"
} as const;

export const sampleResult = {
  actionSuggestion: "等待回踩后分批布局，优先关注手机与汽车业务协同。",
  bullBearDebate: {
    bears: [
      "汽车业务仍处于重投入期，利润释放节奏慢于预期。",
      "手机市场竞争激烈，ASP 提升需要持续验证。"
    ],
    bulls: [
      "高端机型渗透率提升，带动毛利率改善。",
      "生态链与汽车业务形成新的增长叙事。"
    ]
  },
  generatedAt: "2026-05-17T00:00:00.000Z",
  holding: {
    costBasis: "28.50",
    hasPosition: true,
    positionSize: "25%",
    sharesHeld: "2000"
  },
  keyEvents: [
    "季度财报显示 IoT 与互联网服务延续增长。",
    "汽车业务交付节奏继续推进。"
  ],
  language: "zh-CN",
  market: "港股",
  positionSuggestion: "建议维持 20%-30% 仓位，保留机动加仓空间。",
  priceTargets: ["34 HKD", "38 HKD"],
  recommendation: "买入",
  riskVerdict: {
    confidence: "中",
    level: "中",
    summary: "中期逻辑偏正面，但汽车业务投入与市场波动仍带来不确定性。"
  },
  scores: {
    fundamental: 7.8,
    news: 7.1,
    sentiment: 6.8,
    technical: 7.5,
    valuation: 6.9
  },
  sourceSummary: [
    "公司财报电话会纪要",
    "港交所公告与公开新闻",
    "卖方研究摘要"
  ],
  stopLoss: "26.80 HKD",
  symbol: "1810.HK",
  updatedAt: "2026-05-17T00:15:00.000Z"
} as const;

export const sampleRequest = {
  displayName: "小米集团",
  holding: sampleResult.holding,
  language: "zh-CN",
  market: "港股",
  query: "帮我分析一下小米",
  symbol: "1810.HK"
} as const;

export const sampleQuote = {
  asOf: "2026-05-17T01:00:00.000Z",
  changePercent: 1.82,
  currency: "HKD",
  marketState: "live",
  price: 31.42,
  symbol: "1810.HK"
} as const;

export const sampleHistory = [
  {
    createdAt: "2026-05-17T00:00:00.000Z",
    id: sampleIssue.id,
    issue: sampleIssue,
    request: sampleRequest,
    result: sampleResult
  }
];

export const sampleWatchlist = [
  {
    addedAt: "2026-05-16T12:00:00.000Z",
    id: "1810.HK",
    lastAnalyzedAt: "2026-05-17T00:15:00.000Z",
    lastIssueId: sampleIssue.id,
    nextRunAt: "2026-05-17T12:15:00.000Z",
    quote: sampleQuote,
    request: sampleRequest,
    status: "completed"
  },
  {
    addedAt: "2026-05-16T12:30:00.000Z",
    id: "600519.SH",
    lastAnalyzedAt: "2026-05-16T12:30:00.000Z",
    lastIssueId: "issue-600519",
    nextRunAt: "2026-05-17T11:30:00.000Z",
    quote: {
      asOf: "2026-05-17T01:00:00.000Z",
      changePercent: -0.62,
      currency: "CNY",
      marketState: "live",
      price: 1648.55,
      symbol: "600519.SH"
    },
    request: {
      displayName: "贵州茅台",
      holding: {
        costBasis: "",
        hasPosition: false,
        positionSize: "",
        sharesHeld: ""
      },
      language: "zh-CN",
      market: "A股",
      query: "分析茅台",
      symbol: "600519.SH"
    },
    status: "scheduled"
  },
  {
    addedAt: "2026-05-16T13:00:00.000Z",
    id: "AAPL",
    lastAnalyzedAt: "2026-05-16T13:00:00.000Z",
    lastIssueId: "issue-aapl",
    nextRunAt: "2026-05-17T13:00:00.000Z",
    quote: {
      asOf: "2026-05-17T01:00:00.000Z",
      changePercent: 0.45,
      currency: "USD",
      marketState: "closed",
      price: 212.34,
      symbol: "AAPL"
    },
    request: {
      displayName: "苹果",
      holding: {
        costBasis: "",
        hasPosition: false,
        positionSize: "",
        sharesHeld: ""
      },
      language: "zh-CN",
      market: "美股",
      query: "分析苹果",
      symbol: "AAPL"
    },
    status: "idle"
  },
  {
    addedAt: "2026-05-16T14:00:00.000Z",
    id: "00700.HK",
    lastAnalyzedAt: "2026-05-16T14:00:00.000Z",
    lastIssueId: "issue-700",
    nextRunAt: "2026-05-17T14:00:00.000Z",
    quote: {
      asOf: "2026-05-17T01:00:00.000Z",
      changePercent: 2.16,
      currency: "HKD",
      marketState: "live",
      price: 398.2,
      symbol: "00700.HK"
    },
    request: {
      displayName: "腾讯控股",
      holding: {
        costBasis: "",
        hasPosition: false,
        positionSize: "",
        sharesHeld: ""
      },
      language: "zh-CN",
      market: "港股",
      query: "分析腾讯",
      symbol: "00700.HK"
    },
    status: "idle"
  },
  {
    addedAt: "2026-05-16T15:00:00.000Z",
    id: "TSLA",
    lastAnalyzedAt: "2026-05-16T15:00:00.000Z",
    lastIssueId: "issue-tsla",
    nextRunAt: "2026-05-17T15:00:00.000Z",
    quote: {
      asOf: "2026-05-17T01:00:00.000Z",
      changePercent: -1.24,
      currency: "USD",
      marketState: "closed",
      price: 176.8,
      symbol: "TSLA"
    },
    request: {
      displayName: "特斯拉",
      holding: {
        costBasis: "",
        hasPosition: false,
        positionSize: "",
        sharesHeld: ""
      },
      language: "zh-CN",
      market: "美股",
      query: "分析特斯拉",
      symbol: "TSLA"
    },
    status: "idle"
  }
];

export const sampleNotifications = [
  {
    createdAt: "2026-05-17T00:15:00.000Z",
    id: "success-2026-05-17T00:15:00.000Z-已完成重评估",
    level: "success",
    message: "小米集团 重评估已完成，结果已写入历史版本与自选股状态。",
    title: "已完成重评估"
  }
];

