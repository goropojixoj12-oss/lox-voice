export const ANALYTICS_SESSION_COOKIE = "seaps_analytics_sid";
export const ANALYTICS_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function isSyntheticAnalyticsSession(sessionKey: string): boolean {
  return sessionKey.startsWith("seed-") || sessionKey === "synthetic";
}
