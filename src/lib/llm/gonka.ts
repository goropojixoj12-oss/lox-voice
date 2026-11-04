/**
 * Gonka router client (OpenAI-compatible). Server-side only: the key comes from
 * GONKA_API_KEY and must never reach the browser bundle.
 */

export type GonkaRole = "system" | "user" | "assistant";

export type GonkaChatMessage = { role: GonkaRole; content: string };

export type GonkaChatOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 60_000;

function envTrim(name: string): string {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export function gonkaBaseUrl(): string {
  return (envTrim("GONKA_BASE_URL") || "https://api.gonkarouter.io/v1").replace(/\/+$/, "");
}

export function gonkaApiKey(): string {
  return envTrim("GONKA_API_KEY");
}

export function isGonkaConfigured(): boolean {
  return gonkaApiKey().length > 0;
}

export function defaultGonkaModel(): string {
  return envTrim("GONKA_MODEL");
}

async function gonkaFetch(path: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  if (!isGonkaConfigured()) {
    throw new Error("GONKA_API_KEY is not set");
  }
  const response = await fetch(`${gonkaBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${gonkaApiKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 400);
    throw new Error(`Gonka ${response.status} ${path}: ${detail}`);
  }
  return response;
}

export async function listGonkaModels(): Promise<string[]> {
  const body = (await gonkaFetch("/models", { method: "GET" }, DEFAULT_TIMEOUT_MS)).json() as Promise<{
    data?: { id: string }[];
  }>;
  const models = (await body).data ?? [];
  return models.map((model) => model.id);
}

export async function gonkaChat(
  messages: GonkaChatMessage[],
  options: GonkaChatOptions = {},
): Promise<string> {
  const model = options.model ?? defaultGonkaModel();
  if (!model) {
    throw new Error("No Gonka model: pass options.model or set GONKA_MODEL");
  }
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const response = (await gonkaFetch(
    "/chat/completions",
    {
      method: "POST",
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxTokens ?? 800,
      }),
    },
    timeoutMs,
  ).then((r) => r.json())) as { choices?: { message?: { content?: string } }[] };
  const content = response.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error(`Gonka returned no content for model ${model}`);
  }
  return content.trim();
}
