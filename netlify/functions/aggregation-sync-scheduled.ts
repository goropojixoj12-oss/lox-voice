/**
 * Netlify Scheduled Function: GET /api/aggregations/sync every 20 minutes (UTC).
 * Requires AGGREGATION_SYNC_SECRET (or CRON_SECRET) and site URL (URL / DEPLOY_PRIME_URL).
 */
export default async () => {
  const base =
    process.env.URL?.replace(/\/$/, "") ??
    process.env.DEPLOY_PRIME_URL?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  const secret =
    process.env.AGGREGATION_SYNC_SECRET ?? process.env.CRON_SECRET;

  if (!base) {
    console.error("[aggregation-sync-scheduled] Missing URL / DEPLOY_PRIME_URL");
    return new Response(JSON.stringify({ error: "Missing site URL" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!secret) {
    console.error(
      "[aggregation-sync-scheduled] Missing AGGREGATION_SYNC_SECRET or CRON_SECRET",
    );
    return new Response(JSON.stringify({ error: "Missing sync secret" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const target = `${base}/api/aggregations/sync`;
  const res = await fetch(target, {
    method: "GET",
    headers: { Authorization: `Bearer ${secret}` },
  });

  const text = await res.text();
  console.log(
    `[aggregation-sync-scheduled] ${res.status} ${target}`,
    text.slice(0, 400),
  );

  return new Response(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
    },
  });
};

export const config = {
  schedule: "*/20 * * * *",
};
