/**
 * Verifies the Gonka router connection from the environment, never from a key in git.
 * Usage: npm run llm:check
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

process.chdir(path.resolve(import.meta.dirname, ".."));

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (match && process.env[match[1]] === undefined) {
    process.env[match[1]] = match[2];
  }
}

const { gonkaBaseUrl, isGonkaConfigured, listGonkaModels, gonkaChat, defaultGonkaModel } =
  await import(pathToFileURL(path.join(process.cwd(), "src/lib/llm/gonka.ts")).href);

if (!isGonkaConfigured()) {
  console.error("FAIL: GONKA_API_KEY is missing from .env.local");
  process.exit(1);
}

console.log("base url:", gonkaBaseUrl());
console.log("GONKA_MODEL:", defaultGonkaModel() || "(not set)");

const models = await listGonkaModels();
console.log("models:", models.join(", "));

const model = process.argv[2] || defaultGonkaModel() || models[0];
const answer = await gonkaChat(
  [
    { role: "system", content: "Answer with exactly the requested token, nothing else." },
    { role: "user", content: "Reply with the word: connected" },
  ],
  { model, maxTokens: 8 },
);
console.log(`chat (${model}):`, answer);
