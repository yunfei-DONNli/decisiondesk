import type { Locale } from "@/i18n/messages";

export const FIRST_USE_COMPLIANCE_ACK_STORAGE_KEY = "decisiondesk.compliance-ack.v1";

const LEGAL_DISCLAIMER_SHORT_MAP: Record<Locale, string> = {
  "en-US": "This product is for research and product demonstration only. It does not constitute investment advice, advisory services, or any return guarantee.",
  "zh-CN": "本产品仅供研究与产品演示使用，不构成任何投资建议、投顾服务或收益承诺。"
};

const LEGAL_DISCLAIMER_FULL_MAP: Record<Locale, string> = {
  "en-US": "This product is only for research support and product demonstration. Every conclusion is time-sensitive and uncertain. It does not constitute investment advice, advisory services, guaranteed returns, or deterministic conclusions. Please make independent decisions based on your own risk tolerance.",
  "zh-CN": "本产品输出仅用于研究辅助与产品演示，所有判断均带有不确定性与时效性，不构成投资建议、投资顾问服务、收益承诺或确定性结论。请结合自身风险承受能力独立决策。"
};

const LEGAL_CONFIRMATION_ITEMS_MAP: Record<Locale, string[]> = {
  "en-US": [
    "I understand DecisionDesk is not an investment advisor and does not promise returns.",
    "I understand every conclusion depends on public information, model summaries, and risk assumptions at that time and may expire later.",
    "I understand online analysis only sends the minimum required information, while reports and history stay on this device by default."
  ],
  "zh-CN": [
    "我理解智策台不提供投资顾问服务，也不会承诺收益。",
    "我理解所有结论依赖当时的公开信息、模型摘要与风险假设，可能随时间失效。",
    "我理解联网分析只会外发完成任务所需的最小信息，报告与历史版本默认保存在本机。"
  ]
};

const SOURCE_TYPE_ITEMS_MAP: Record<Locale, string[]> = {
  "en-US": [
    "Structured output: AnalysisResult JSON aggregated by Multica.",
    "Public-information summaries: news, announcements, market sentiment, and research view digests.",
    "Risk verdict layer: the final judgment after technical, fundamental, news, and sentiment inputs are combined."
  ],
  "zh-CN": [
    "结构化输出：Multica 聚合后的 AnalysisResult JSON。",
    "公开信息摘要：新闻、公告、市场情绪与研究观点的摘要化整理。",
    "风险裁决层：综合技术面、基本面、新闻面、情绪面后的最终判断。"
  ]
};

export function getLegalDisclaimerShort(locale: Locale): string {
  return LEGAL_DISCLAIMER_SHORT_MAP[locale];
}

export function getLegalDisclaimerFull(locale: Locale): string {
  return LEGAL_DISCLAIMER_FULL_MAP[locale];
}

export function getLegalConfirmationItems(locale: Locale): string[] {
  return LEGAL_CONFIRMATION_ITEMS_MAP[locale];
}

export function getSourceTypeItems(locale: Locale): string[] {
  return SOURCE_TYPE_ITEMS_MAP[locale];
}

export function buildPrimarySourceNotes(sourceSummary: string[], locale: Locale = "zh-CN"): string[] {
  const primary = sourceSummary
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (primary.length > 0) {
    return primary;
  }

  return locale === "en-US"
    ? ["This version does not yet include an explicit source summary."]
    : ["当前版本尚未返回明确来源摘要。"];
}
