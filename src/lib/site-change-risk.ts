export type SiteChangeRiskLevel = "normal" | "critical";

export type SiteChangeRiskAssessment = {
  level: SiteChangeRiskLevel;
  /** Short labels shown in the admin warning (English UI). */
  topics: string[];
};

type RiskRule = { topic: string; pattern: RegExp };

const CRITICAL_RULES: RiskRule[] = [
  { topic: "environment variables or secrets", pattern: /\b(env(?:ironment)?\s*var|secret|api[_\s-]?key|cron_secret|site_agent|smtp_pass|database_url|blob|redis|kv_rest)\b/i },
  { topic: "Vercel / hosting / deploy pipeline", pattern: /\b(vercel|deployment|redeploy|rollback|откат|деплой|хостинг)\b/i },
  { topic: "Git / repository / branch protection", pattern: /\b(github|git push|force push|main branch|merge|revert commit|package\.json|package-lock)\b/i },
  { topic: "server config files", pattern: /\b(next\.config|middleware|vercel\.json|tsconfig|eslint|dockerfile|\.env)\b/i },
  { topic: "DNS / domains / SSL", pattern: /\b(dns|domain|ssl|certificate|сертификат|домен)\b/i },
  { topic: "auth / security settings", pattern: /\b(bcrypt|password hash|session secret|oauth|webhook url|disable auth)\b/i },
  { topic: "bulk data / infrastructure jobs", pattern: /\b(aggregation sync|import all|prune|delete all listings|wipe|drop table|cron job)\b/i },
  { topic: "automation / agent configuration", pattern: /\b(site[-\s]?agent|cursor automation|webhook|disable admin|SEAPS_ENABLE)\b/i },
];

export function assessSiteChangeMessage(message: string): SiteChangeRiskAssessment {
  const topics: string[] = [];
  for (const rule of CRITICAL_RULES) {
    if (rule.pattern.test(message)) {
      topics.push(rule.topic);
    }
  }
  return {
    level: topics.length > 0 ? "critical" : "normal",
    topics,
  };
}

export const SITE_CHANGE_CRITICAL_WARNING_INTRO =
  "This request may affect critical project settings (hosting, secrets, repo, or security). The agent should treat it with extra care — prefer UI-only changes unless a developer explicitly approved infrastructure work.";
