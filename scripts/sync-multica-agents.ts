import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const agentDir = path.resolve("multica", "agents");
const runtimeNamePattern = /^Codex\b/i;
const squadName = "DecisionDesk Research Squad";
const agentSpecs = [
  {
    description: "技术面分析师，负责趋势、关键价位与技术风险判断。",
    file: "codex-technical-analyst.md",
    name: "codex-technical-analyst"
  },
  {
    description: "基本面分析师，负责财务质量、估值与成长性判断。",
    file: "codex-fundamental-analyst.md",
    name: "codex-fundamental-analyst"
  },
  {
    description: "新闻面分析师，负责催化剂、公告与机构观点整理。",
    file: "codex-news-analyst.md",
    name: "codex-news-analyst"
  },
  {
    description: "情绪面分析师，负责资金流向与市场关注度判断。",
    file: "codex-sentiment-analyst.md",
    name: "codex-sentiment-analyst"
  },
  {
    description: "多空辩论员，负责汇总多头与空头核心论点。",
    file: "codex-debate-analyst.md",
    name: "codex-debate-analyst"
  },
  {
    description: "风险主管，负责形成最终推荐、仓位与风险裁决。",
    file: "codex-risk-chair.md",
    name: "codex-risk-chair"
  }
] as const;

type RuntimeRecord = {
  id: string;
  name: string;
  provider?: string;
  status?: string;
};

type AgentRecord = {
  description?: string;
  id: string;
  name: string;
};

type SquadRecord = {
  description?: string;
  id: string;
  name: string;
};

type SquadMemberRecord = {
  member_id?: string;
  member_type?: string;
  role?: string;
};

async function runMultica(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("multica", args, {
    cwd: process.cwd(),
    env: process.env,
    maxBuffer: 10 * 1024 * 1024
  });

  return stdout.trim();
}

async function runMulticaJson<T>(args: string[]): Promise<T> {
  const output = await runMultica(args);
  return JSON.parse(output) as T;
}

function readInstructions(filename: string): string {
  return fs.readFileSync(path.join(agentDir, filename), "utf8").trim();
}

async function getCodexRuntimeId(): Promise<string> {
  const runtimes = await runMulticaJson<RuntimeRecord[]>(["runtime", "list", "--output", "json"]);
  const runtime = runtimes.find((item) =>
    runtimeNamePattern.test(item.name) && item.provider === "codex" && item.status === "online"
  );

  if (!runtime) {
    throw new Error("未找到在线的 Codex runtime，请先确保 multica daemon 已启动且 Codex runtime 在线。");
  }

  return runtime.id;
}

async function upsertAgent(runtimeId: string, spec: (typeof agentSpecs)[number]): Promise<AgentRecord> {
  const existingAgents = await runMulticaJson<AgentRecord[]>(["agent", "list", "--output", "json"]);
  const existing = existingAgents.find((item) => item.name === spec.name);
  const instructions = readInstructions(spec.file);

  if (existing) {
    return runMulticaJson<AgentRecord>([
      "agent",
      "update",
      existing.id,
      "--name",
      spec.name,
      "--description",
      spec.description,
      "--instructions",
      instructions,
      "--runtime-id",
      runtimeId,
      "--visibility",
      "workspace",
      "--output",
      "json"
    ]);
  }

  return runMulticaJson<AgentRecord>([
    "agent",
    "create",
    "--name",
    spec.name,
    "--description",
    spec.description,
    "--instructions",
    instructions,
    "--runtime-id",
    runtimeId,
    "--visibility",
    "workspace",
    "--output",
    "json"
  ]);
}

async function upsertSquad(leaderName: string): Promise<SquadRecord> {
  const squads = await runMulticaJson<SquadRecord[]>(["squad", "list", "--output", "json"]);
  const description = "DecisionDesk 官方投研团队，统一承接股票研究与风险裁决任务。";
  const instructions = [
    "协调 6 个 Codex 投研角色分工执行。",
    "优先保证技术面、基本面、新闻面、情绪面完整覆盖。",
    "最终由风险主管汇总出统一的 AnalysisResult JSON 结构。"
  ].join("\n");
  const existing = squads.find((item) => item.name === squadName);

  if (existing) {
    return runMulticaJson<SquadRecord>([
      "squad",
      "update",
      existing.id,
      "--name",
      squadName,
      "--description",
      description,
      "--instructions",
      instructions,
      "--leader",
      leaderName,
      "--output",
      "json"
    ]);
  }

  return runMulticaJson<SquadRecord>([
    "squad",
    "create",
    "--name",
    squadName,
    "--description",
    description,
    "--leader",
    leaderName,
    "--output",
    "json"
  ]);
}

async function syncSquadMembers(squadId: string, agents: AgentRecord[]): Promise<void> {
  const members = await runMulticaJson<SquadMemberRecord[]>(["squad", "member", "list", squadId, "--output", "json"]);
  const memberIds = new Set(
    members
      .filter((member) => member.member_type === "agent" && typeof member.member_id === "string")
      .map((member) => member.member_id as string)
  );

  for (const agent of agents) {
    if (memberIds.has(agent.id)) {
      continue;
    }

    await runMulticaJson([
      "squad",
      "member",
      "add",
      squadId,
      "--member-id",
      agent.id,
      "--type",
      "agent",
      "--role",
      agent.name === "codex-risk-chair" ? "leader_delegate" : "member",
      "--output",
      "json"
    ]);
  }
}

async function main(): Promise<void> {
  const runtimeId = await getCodexRuntimeId();
  const syncedAgents: AgentRecord[] = [];

  for (const spec of agentSpecs) {
    const agent = await upsertAgent(runtimeId, spec);
    syncedAgents.push(agent);
  }

  const squad = await upsertSquad("codex-risk-chair");
  await syncSquadMembers(squad.id, syncedAgents);

  const summary = {
    agentNames: syncedAgents.map((item) => item.name),
    runtimeId,
    squadId: squad.id,
    squadName: squad.name
  };

  console.log(JSON.stringify(summary, null, 2));
}

void main();
