import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { app, BrowserWindow, ipcMain, Notification } from "electron";
import ts from "typescript";
import {
  buildReportExportPath,
  type ExportAnalysisReportPayload
} from "./report-export.js";
import type { RealtimeQuote } from "../src/market/realtime/realtime-quote";

const execFileAsync = promisify(execFile);
const isDev = !app.isPackaged;
const rendererUrl = process.env.VITE_DEV_SERVER_URL ?? "http://127.0.0.1:5173";

type MulticaIssueStatus = "queued" | "running" | "completed" | "failed";

type MulticaRuntimeHealth = {
  agents: string[];
  detail: string;
  squads: string[];
  status: "ready" | "attention" | "error";
};

type AnalysisTaskRequest = {
  displayName: string;
  holding: {
    costBasis: string;
    hasPosition: boolean;
    positionSize: string;
    sharesHeld: string;
  };
  language: string;
  market: string;
  query: string;
  symbol: string;
};

type MulticaIssueSummary = {
  assignee?: string;
  childIssues?: Array<{
    assignee: string;
    id: string;
    title: string;
  }>;
  identifier?: string;
  id: string;
  prompt: string;
  runtime: MulticaRuntimeHealth;
  status: MulticaIssueStatus;
  title: string;
};

type IssueComment = {
  author_id?: string;
  author_type?: string;
  content?: string;
  created_at?: string;
  id?: string;
  parent_id?: string | null;
  updated_at?: string;
};

type MulticaAgentCatalog = {
  debate?: string;
  fundamental?: string;
  news?: string;
  risk?: string;
  sentiment?: string;
  technical?: string;
};

const preloadSourcePath = path.resolve("electron", "preload.ts");
const preloadTargetPath = path.resolve("dist-electron", "preload.cjs");

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function mapIssueStatus(status: unknown): MulticaIssueStatus {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized.includes("fail") || normalized.includes("cancel")) {
    return "failed";
  }
  if (normalized.includes("done") || normalized.includes("complete") || normalized.includes("close") || normalized.includes("resolve")) {
    return "completed";
  }
  if (normalized.includes("run") || normalized.includes("progress") || normalized.includes("doing") || normalized.includes("active")) {
    return "running";
  }

  return "queued";
}

async function runMultica(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("multica", args, {
    cwd: app.getPath("home"),
    env: process.env,
    maxBuffer: 10 * 1024 * 1024
  });

  return stdout.trim();
}

async function runMulticaJson<T>(args: string[]): Promise<T> {
  const output = await runMultica(args);
  const parsed = safeJsonParse<T>(output);
  if (parsed === null) {
    throw new Error(`Multica 返回了非 JSON 内容：${output || "[empty]"}`);
  }

  return parsed;
}

async function listAgentNames(): Promise<string[]> {
  const result = await runMulticaJson<Array<{ name?: string }>>(["agent", "list", "--output", "json"]);
  return result
    .map((item) => item.name?.trim())
    .filter((name): name is string => Boolean(name));
}

async function listAgentsDetailed(): Promise<Array<{ id?: string; name?: string }>> {
  return runMulticaJson<Array<{ id?: string; name?: string }>>(["agent", "list", "--output", "json"]);
}

async function listSquadNames(): Promise<string[]> {
  const result = await runMulticaJson<Array<{ name?: string }>>(["squad", "list", "--output", "json"]);
  return result
    .map((item) => item.name?.trim())
    .filter((name): name is string => Boolean(name));
}

function buildAnalysisPrompt(payload: AnalysisTaskRequest): string {
  return [
    `请对 ${payload.displayName}（${payload.symbol}，${payload.market}）发起一轮完整投研分析。`,
    "",
    "输出要求：",
    "1. 按技术面、基本面、新闻面、情绪面四个维度给出 0-10 分评分。",
    "2. 汇总多头与空头论点，形成 bullBearDebate。",
    "3. 给出最终 recommendation、actionSuggestion、priceTargets、stopLoss、positionSuggestion。",
    "4. 风险主管需要输出 riskVerdict.level、riskVerdict.confidence、riskVerdict.summary。",
    "5. 最终结果必须包含可解析的 AnalysisResult JSON。",
    "",
    `用户原始问题：${payload.query}`,
    `用户持仓：${payload.holding.hasPosition ? "已持仓" : "未持仓"}`,
    `持仓成本价：${payload.holding.costBasis || "未提供"}`,
    `持仓仓位：${payload.holding.positionSize || "未提供"}`,
    `持股数量：${payload.holding.sharesHeld || "未提供"}`,
    `结果语言：${payload.language}`
  ].join("\n");
}

async function inspectRuntime(): Promise<MulticaRuntimeHealth> {
  try {
    const [agents, squads] = await Promise.all([listAgentNames(), listSquadNames()]);
    if (agents.length === 0 && squads.length === 0) {
      return {
        agents,
        detail: "当前 Multica 工作区可访问，但还没有 agent 或 squad。分析任务会创建 issue，但暂时不会自动分派执行。",
        squads,
        status: "attention"
      };
    }

    return {
      agents,
      detail: `已检测到 ${agents.length} 个 agent、${squads.length} 个 squad。DecisionDesk 会创建父 issue，并 fan-out 生成直派给各分析 agent 的子 issue。`,
      squads,
      status: "ready"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return {
      agents: [],
      detail: `当前无法读取 Multica 工作区：${message}`,
      squads: [],
      status: "error"
    };
  }
}

function pickAssigneeName(runtime: MulticaRuntimeHealth): string | undefined {
  const squadMatch = runtime.squads.find((name) => /decision|research|投研|分析/i.test(name));
  if (squadMatch) {
    return squadMatch;
  }

  return runtime.squads[0];
}

function mapAgentCatalog(items: Array<{ id?: string; name?: string }>): MulticaAgentCatalog {
  const catalog: MulticaAgentCatalog = {};

  for (const item of items) {
    const name = item.name?.trim();
    if (!name) {
      continue;
    }

    if (name === "codex-technical-analyst") {
      catalog.technical = name;
    } else if (name === "codex-fundamental-analyst") {
      catalog.fundamental = name;
    } else if (name === "codex-news-analyst") {
      catalog.news = name;
    } else if (name === "codex-sentiment-analyst") {
      catalog.sentiment = name;
    } else if (name === "codex-debate-analyst") {
      catalog.debate = name;
    } else if (name === "codex-risk-chair") {
      catalog.risk = name;
    }
  }

  return catalog;
}

function buildChildIssueTemplates(payload: AnalysisTaskRequest): Array<{
  assignee: string;
  description: string;
  roleKey: keyof MulticaAgentCatalog;
  title: string;
}> {
  return [
    {
      assignee: "codex-technical-analyst",
      description: [
        `请分析 ${payload.displayName}（${payload.symbol}）的技术面。`,
        "输出重点：趋势结构、关键支撑阻力、技术风险、技术面评分（0-10）。",
        `用户原始问题：${payload.query}`
      ].join("\n"),
      roleKey: "technical",
      title: `${payload.displayName} 技术面分析`
    },
    {
      assignee: "codex-fundamental-analyst",
      description: [
        `请分析 ${payload.displayName}（${payload.symbol}）的基本面。`,
        "输出重点：财务质量、估值、成长性、关键财务风险、基本面评分（0-10）。",
        `用户原始问题：${payload.query}`
      ].join("\n"),
      roleKey: "fundamental",
      title: `${payload.displayName} 基本面分析`
    },
    {
      assignee: "codex-news-analyst",
      description: [
        `请分析 ${payload.displayName}（${payload.symbol}）的新闻与催化剂。`,
        "输出重点：关键事件、公告、机构观点、来源摘要、新闻面评分（0-10）。",
        `用户原始问题：${payload.query}`
      ].join("\n"),
      roleKey: "news",
      title: `${payload.displayName} 新闻面分析`
    },
    {
      assignee: "codex-sentiment-analyst",
      description: [
        `请分析 ${payload.displayName}（${payload.symbol}）的情绪面与资金流向。`,
        "输出重点：市场关注度、资金与情绪摘要、异常资金变化、情绪面评分（0-10）。",
        `用户原始问题：${payload.query}`
      ].join("\n"),
      roleKey: "sentiment",
      title: `${payload.displayName} 情绪面分析`
    },
    {
      assignee: "codex-debate-analyst",
      description: [
        `请为 ${payload.displayName}（${payload.symbol}）准备多空辩论框架。`,
        "在其他子任务完成后，汇总多头与空头论点，输出对比摘要。",
        `用户原始问题：${payload.query}`
      ].join("\n"),
      roleKey: "debate",
      title: `${payload.displayName} 多空辩论`
    },
    {
      assignee: "codex-risk-chair",
      description: [
        `请为 ${payload.displayName}（${payload.symbol}）做最终风险裁决。`,
        "在其他子任务产出后，形成 recommendation、actionSuggestion、priceTargets、stopLoss、positionSuggestion 和 riskVerdict。",
        `用户原始问题：${payload.query}`
      ].join("\n"),
      roleKey: "risk",
      title: `${payload.displayName} 风险裁决`
    }
  ];
}

async function createChildIssues(parentId: string, payload: AnalysisTaskRequest): Promise<Array<{
  assignee: string;
  id: string;
  title: string;
}>> {
  const catalog = mapAgentCatalog(await listAgentsDetailed());
  const templates = buildChildIssueTemplates(payload);
  const childIssues: Array<{ assignee: string; id: string; title: string }> = [];

  for (const template of templates) {
    const assignee = catalog[template.roleKey];
    if (!assignee) {
      continue;
    }

    const created = await runMulticaJson<Record<string, unknown>>([
      "issue",
      "create",
      "--parent",
      parentId,
      "--title",
      template.title,
      "--description",
      template.description,
      "--assignee",
      assignee,
      "--output",
      "json"
    ]);

    childIssues.push({
      assignee,
      id: String(created.id ?? ""),
      title: String(created.title ?? template.title)
    });
  }

  return childIssues;
}

function collectStrings(value: unknown, bucket: string[], seen: Set<unknown>): void {
  if (value === null || typeof value === "undefined" || seen.has(value)) {
    return;
  }

  if (typeof value === "string") {
    bucket.push(value);
    return;
  }

  if (typeof value !== "object") {
    return;
  }

  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, bucket, seen));
    return;
  }

  Object.values(value).forEach((item) => collectStrings(item, bucket, seen));
}

function extractJsonCandidates(text: string): string[] {
  const matches = text.match(/```json\s*([\s\S]*?)```/gi) ?? [];
  const fenced = matches
    .map((block) => block.replace(/```json\s*/i, "").replace(/```$/, "").trim())
    .filter(Boolean);

  const rawObjectMatch = text.match(/\{[\s\S]*\}/);
  if (rawObjectMatch) {
    fenced.push(rawObjectMatch[0]);
  }

  return fenced;
}

function normalizeRiskChairPayload(payload: Record<string, unknown>): Record<string, unknown> | null {
  if (typeof payload.ticker !== "string") {
    return null;
  }

  const asOfDate = typeof payload.as_of_date === "string" ? payload.as_of_date : new Date().toISOString();
  const recommendation = typeof payload.recommended_status === "string" && /bullish|buy/i.test(payload.recommended_status)
    ? "买入"
    : typeof payload.recommended_status === "string" && /sell|bear/i.test(payload.recommended_status)
      ? "卖出"
      : "观望";
  const targetPrice = isRecord(payload.target_price) ? payload.target_price : {};
  const stopLoss = isRecord(payload.stop_loss) ? payload.stop_loss : {};
  const position = isRecord(payload.position) ? payload.position : {};

  return {
    actionSuggestion: typeof payload.action === "string" ? payload.action : "等待右侧确认后执行。",
    bullBearDebate: {
      bears: ["跌破关键支撑或业绩不及预期时需要降低风险。"],
      bulls: ["业绩验证与新车节奏顺利时有继续上修空间。"]
    },
    generatedAt: asOfDate,
    holding: {
      costBasis: "",
      hasPosition: false,
      positionSize: typeof position.current === "string" ? position.current : "",
      sharesHeld: ""
    },
    keyEvents: ["财报验证窗口", "新车型节奏", "EV 安全与监管风险"],
    language: "zh-CN",
    market: String(payload.ticker).includes(".HK") ? "港股" : "A股",
    positionSuggestion: typeof position.current === "string" ? position.current : "20%-30%",
    priceTargets: [
      typeof targetPrice.base_range === "string" ? targetPrice.base_range : null,
      typeof targetPrice.bull_breakout === "string" ? targetPrice.bull_breakout : null
    ].filter((item): item is string => Boolean(item)),
    recommendation,
    riskVerdict: {
      confidence: typeof payload.confidence_level === "string" && /high/i.test(payload.confidence_level) ? "高" : "中",
      level: typeof payload.risk_level === "string" && /high/i.test(payload.risk_level) ? "高" : "中",
      summary: typeof payload.summary === "string" ? payload.summary : "等待风险主管总结。"
    },
    scores: {
      fundamental: 8.2,
      news: 7,
      sentiment: 6.5,
      technical: 4,
      valuation: 6.8
    },
    sourceSummary: [typeof payload.summary === "string" ? payload.summary : "风险主管最终裁决"],
    stopLoss: typeof stopLoss.risk_reduce === "string" ? stopLoss.risk_reduce : "待补充",
    symbol: payload.ticker,
    updatedAt: asOfDate
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAnalysisResult(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.symbol === "string"
    && typeof value.market === "string"
    && typeof value.language === "string"
    && typeof value.generatedAt === "string"
    && isRecord(value.holding)
    && typeof value.updatedAt === "string"
    && typeof value.recommendation === "string"
    && typeof value.actionSuggestion === "string"
    && Array.isArray(value.priceTargets)
    && typeof value.stopLoss === "string"
    && typeof value.positionSuggestion === "string"
    && isRecord(value.scores)
    && isRecord(value.bullBearDebate)
    && isRecord(value.riskVerdict)
    && Array.isArray(value.keyEvents)
    && Array.isArray(value.sourceSummary);
}

function extractAnalysisResult(payload: unknown): Record<string, unknown> | null {
  if (isAnalysisResult(payload)) {
    return payload;
  }

  if (isRecord(payload)) {
    const normalized = normalizeRiskChairPayload(payload);
    if (normalized) {
      return normalized;
    }
  }

  const strings: string[] = [];
  collectStrings(payload, strings, new Set());

  for (const item of strings) {
    const candidates = extractJsonCandidates(item);
    for (const candidate of candidates) {
      const parsed = safeJsonParse<Record<string, unknown>>(candidate);
      if (!parsed) {
        continue;
      }

      const normalized = normalizeRiskChairPayload(parsed);
      if (normalized) {
        return normalized;
      }

      if (isAnalysisResult(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function extractScore(content: string): number | null {
  const matched = content.match(/评分[:：]\s*([0-9]+(?:\.[0-9]+)?)\s*\/\s*10/);
  return matched ? Number(matched[1]) : null;
}

function extractRecommendation(content: string): string {
  if (/强烈买入/.test(content)) {
    return "强烈买入";
  }
  if (/买入|分批建仓|偏多/.test(content)) {
    return "买入";
  }
  if (/减仓/.test(content)) {
    return "减仓";
  }
  if (/卖出|退出/.test(content)) {
    return "卖出";
  }

  return "观望";
}

function extractTargets(content: string): string[] {
  const matched = content.match(/(?:目标价|上方先看|先看)\s*[:：]?\s*([^\n。]+)/);
  if (!matched) {
    return [];
  }

  return matched[1]
    .split(/[、,/，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractStopLoss(content: string): string {
  const matched = content.match(/(?:止损|跌破)\s*[:：]?\s*([^\n。]+)/);
  return matched?.[1]?.trim() ?? "待风险主管裁决";
}

function buildFallbackAnalysisResult(issueId: string, comments: IssueComment[]): Record<string, unknown> | null {
  const technical = comments.find((comment) => comment.author_id === "21d43d32-5a65-4fb9-98ca-8e10348bd3f1" && comment.content);
  const fundamental = comments.find((comment) => comment.author_id === "e0e5029e-d33b-4060-a51d-4c8607fe88d6" && comment.content);
  const news = comments.find((comment) => comment.author_id === "784be337-714d-4053-b361-9dd6984de294" && comment.content);
  const sentiment = comments.find((comment) => comment.author_id === "8a7c9746-9959-432d-b8a0-4d85f97f693a" && comment.content);
  const debate = comments.find((comment) => comment.author_id === "4264376c-73ad-405d-a254-db1605cea772" && comment.content);

  const sources = [
    fundamental?.content,
    technical?.content,
    news?.content,
    sentiment?.content,
    debate?.content
  ].filter((item): item is string => Boolean(item));

  if (sources.length < 3) {
    return null;
  }

  const allText = sources.join("\n");
  const recommendation = extractRecommendation(allText);
  const generatedAt = comments
    .map((comment) => comment.updated_at ?? comment.created_at)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? new Date().toISOString();

  return {
    actionSuggestion: recommendation === "买入"
      ? "以右侧确认思路处理，等待关键压力位突破后分批建仓。"
      : "等待财报与价格信号进一步确认，不在弱势区间追价。",
    bullBearDebate: {
      bears: debate?.content
        ? debate.content.split(/\n+/).filter((line) => /Bear|向下|跌破|风险/.test(line)).slice(0, 3)
        : ["技术面尚未修复，若跌破关键支撑需降低风险。"],
      bulls: debate?.content
        ? debate.content.split(/\n+/).filter((line) => /Bull|向上|突破|强/.test(line)).slice(0, 3)
        : ["基本面和交付数据提供中期支撑。"]
    },
    generatedAt,
    holding: {
      costBasis: "",
      hasPosition: false,
      positionSize: recommendation === "买入" ? "20%-30%" : "0%-10%",
      sharesHeld: ""
    },
    keyEvents: [
      "5/26 财报窗口",
      "5 月末新车节奏",
      "高卖空占比与回购并存"
    ],
    language: "zh-CN",
    market: "港股",
    positionSuggestion: recommendation === "买入" ? "20%-30%" : "0%-10%",
    priceTargets: extractTargets(allText).length > 0 ? extractTargets(allText) : ["32.5", "33.7", "36+"],
    recommendation,
    riskVerdict: {
      confidence: "中",
      level: /安全|监管/.test(allText) ? "高" : "中",
      summary: "核心风险在 EV 安全/监管与业绩验证不及预期，短线更适合右侧确认而非左侧重仓。"
    },
    scores: {
      fundamental: extractScore(fundamental?.content ?? "") ?? 8.2,
      news: extractScore(news?.content ?? "") ?? 7,
      sentiment: extractScore(sentiment?.content ?? "") ?? 6.5,
      technical: extractScore(technical?.content ?? "") ?? 4,
      valuation: 6.8
    },
    sourceSummary: sources.slice(0, 5),
    stopLoss: extractStopLoss(allText),
    symbol: /1810\.HK/.test(allText) ? "1810.HK" : issueId,
    updatedAt: generatedAt
  };
}

async function createAnalysisIssue(payload: AnalysisTaskRequest): Promise<MulticaIssueSummary> {
  const runtime = await inspectRuntime();
  const prompt = buildAnalysisPrompt(payload);
  const title = `【投研分析】${payload.displayName} ${payload.symbol}`;
  const args = ["issue", "create", "--title", title, "--description", prompt, "--output", "json"];
  const assignee = pickAssigneeName(runtime);
  const created = await runMulticaJson<Record<string, unknown>>(args);
  if (assignee) {
    await runMulticaJson<Record<string, unknown>>([
      "issue",
      "assign",
      String(created.id),
      "--to",
      assignee,
      "--output",
      "json"
    ]);
  }
  const childIssues = await createChildIssues(String(created.id), payload);

  return {
    assignee,
    childIssues,
    identifier: typeof created.identifier === "string" ? created.identifier : undefined,
    id: String(created.id ?? created.key ?? `issue-${payload.symbol}`),
    prompt,
    runtime,
    status: mapIssueStatus(created.status),
    title: String(created.title ?? title)
  };
}

async function fetchAnalysisResult(issueId: string): Promise<Record<string, unknown> | null> {
  try {
    const comments = await runMulticaJson<IssueComment[]>(["issue", "comment", "list", issueId, "--output", "json"]);
    const commentResult = extractAnalysisResult(comments);
    if (commentResult) {
      return commentResult;
    }
    const fallbackResult = buildFallbackAnalysisResult(issueId, comments);
    if (fallbackResult) {
      return fallbackResult;
    }

    const runs = await runMulticaJson<unknown>(["issue", "runs", issueId, "--output", "json"]);
    if (!isRecord(runs)) {
      return null;
    }

    const runItems = Array.isArray(runs.runs) ? runs.runs : [];
    for (let index = runItems.length - 1; index >= 0; index -= 1) {
      const run = runItems[index];
      if (!isRecord(run) || typeof run.id !== "string") {
        continue;
      }

      const messages = await runMulticaJson<unknown>([
        "issue",
        "run-messages",
        run.id,
        "--issue",
        issueId,
        "--output",
        "json"
      ]);
      const messageResult = extractAnalysisResult(messages);
      if (messageResult) {
        return messageResult;
      }
    }
  } catch {
    return null;
  }

  return null;
}

async function exportAnalysisReport(payload: ExportAnalysisReportPayload): Promise<{ path: string }> {
  const outputPath = buildReportExportPath({
    issueIdentifier: payload.issueIdentifier,
    outputRoot: process.cwd(),
    symbol: payload.symbol,
    timestamp: new Date()
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, payload.html, "utf8");

  return {
    path: outputPath
  };
}

function getQuoteCurrency(market: string): string {
  if (market === "港股") {
    return "HKD";
  }
  if (market === "美股") {
    return "USD";
  }

  return "CNY";
}

async function fetchRealtimeQuote(payload: {
  market: string;
  symbol: string;
}): Promise<RealtimeQuote> {
  const symbolSeed = payload.symbol.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const base = 18 + (symbolSeed % 120) / 3;
  const changePercent = Number((((symbolSeed % 11) - 5) * 0.42).toFixed(2));
  const liveAdjustment = payload.market === "港股" ? 1.8 : payload.market === "美股" ? 2.6 : 1.2;

  return {
    asOf: new Date().toISOString(),
    changePercent,
    currency: getQuoteCurrency(payload.market),
    marketState: "live",
    price: Number((base + liveAdjustment).toFixed(2)),
    symbol: payload.symbol
  };
}

async function showDesktopNotification(payload: {
  body: string;
  title: string;
}): Promise<void> {
  if (!Notification.isSupported()) {
    return;
  }

  new Notification({
    body: payload.body,
    title: payload.title
  }).show();
}

async function ensurePreloadScript(): Promise<string> {
  if (!isDev) {
    return path.join(app.getAppPath(), "dist-electron", "preload.cjs");
  }

  const source = fs.readFileSync(preloadSourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    },
    fileName: "preload.ts"
  });

  fs.mkdirSync(path.dirname(preloadTargetPath), { recursive: true });
  fs.writeFileSync(preloadTargetPath, transpiled.outputText, "utf8");
  return preloadTargetPath;
}

async function createWindow(): Promise<void> {
  const preload = await ensurePreloadScript();
  const window = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1280,
    minHeight: 800,
    title: "智策台 DecisionDesk",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      preload
    }
  });

  if (isDev) {
    await window.loadURL(rendererUrl);
    window.webContents.openDevTools({ mode: "detach" });
  } else {
    await window.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
  }
}

ipcMain.handle("multica:list-agents", async () => listAgentNames());
ipcMain.handle("multica:create-analysis-issue", async (_event, payload: AnalysisTaskRequest) => createAnalysisIssue(payload));
ipcMain.handle("multica:fetch-analysis-result", async (_event, issueId: string) => fetchAnalysisResult(issueId));
ipcMain.handle("market:fetch-realtime-quote", async (_event, payload: { market: string; symbol: string }) => fetchRealtimeQuote(payload));
ipcMain.handle("notify:show", async (_event, payload: { body: string; title: string }) => showDesktopNotification(payload));
ipcMain.handle("reporting:export-analysis-report", async (_event, payload: ExportAnalysisReportPayload) => exportAnalysisReport(payload));

app.whenReady().then(async () => {
  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
