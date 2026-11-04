export const ANALYTICS_SESSION_COOKIE = "seaps_analytics_sid";
export const ANALYTICS_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function isSyntheticAnalyticsSession(sessionKey: string): boolean {
  return (
    sessionKey.startsWith("seed-") ||
    sessionKey.startsWith("warmup-probe-") ||
    sessionKey === "synthetic"
  );
}

export function isAutomatedAnalyticsUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return true;
  return /headlesschrome|phantomjs|playwright|puppeteer|lighthouse|(?:bot|crawler|spider)(?:[\/; +]|$)/i.test(
    userAgent,
  );
}

export function readAnalyticsSessionCookie(cookieHeader: string | null): string | null {
  const raw = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ANALYTICS_SESSION_COOKIE}=`))
    ?.slice(ANALYTICS_SESSION_COOKIE.length + 1);
  if (!raw) return null;
  try {
    const sessionKey = decodeURIComponent(raw);
    return sessionKey.length >= 8 && sessionKey.length <= 64 ? sessionKey : null;
  } catch {
    return null;
  }
}
