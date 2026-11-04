import assert from "node:assert/strict";
import test from "node:test";
import { isAnalyticsPath } from "../src/lib/analytics-paths.ts";
import * as analyticsSession from "../src/lib/analytics-session.ts";

test("public pages remain measurable", () => {
  assert.equal(isAnalyticsPath("/"), true);
  assert.equal(isAnalyticsPath("/property/vue-aston-riverside-3bed-102m2"), true);
});

test("dashboards and authentication pages stay out of public audience metrics", () => {
  assert.equal(isAnalyticsPath("/dashboard/admin"), false);
  assert.equal(isAnalyticsPath("/dashboard/agent/overview"), false);
  assert.equal(isAnalyticsPath("/auth/login"), false);
});

test("legacy and explicit probe sessions are synthetic", () => {
  assert.equal(analyticsSession.isSyntheticAnalyticsSession("seed-1-2"), true);
  assert.equal(analyticsSession.isSyntheticAnalyticsSession("synthetic"), true);
  assert.equal(analyticsSession.isSyntheticAnalyticsSession("warmup-probe-session-1"), true);
});

test("headless browsers and crawlers are not counted as visitors", () => {
  const check = analyticsSession.isAutomatedAnalyticsUserAgent;
  assert.equal(check?.("Mozilla/5.0 Chrome/131.0.0.0 HeadlessChrome/131.0.0.0 Safari/537.36"), true);
  assert.equal(check?.("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"), true);
  assert.equal(check?.(null), true);
});

test("an ordinary browser user agent remains measurable", () => {
  const check = analyticsSession.isAutomatedAnalyticsUserAgent;
  assert.equal(check?.("Mozilla/5.0 Chrome/131.0.0.0 Safari/537.36"), false);
});

test("only the server-issued analytics cookie identifies a visitor", () => {
  const read = analyticsSession.readAnalyticsSessionCookie;
  const sid = "cabf1b6e-aaaa-4bbb-8ccc-dddddddddddd";
  assert.equal(read?.(`en_session=abc; seaps_analytics_sid=${sid}`), sid);
  assert.equal(read?.("en_session=abc"), null);
  assert.equal(read?.("seaps_analytics_sid=short"), null);
  assert.equal(read?.("seaps_analytics_sid=%E0%A4%A"), null);
});
