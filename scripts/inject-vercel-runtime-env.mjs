#!/usr/bin/env node
/**
 * Bake deploy-only server env into the Nitro Vercel function so DATABASE_URL
 * is present at runtime (Vercel file deploys cannot set project env vars).
 * No-ops when those vars are unset (sandbox / preview builds).
 */
import { existsSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const keys = [
  "DATABASE_URL",
  "BETTER_AUTH_URL",
  "BETTER_AUTH_SECRET",
  "GROK_AUTH_CLIENT_ID",
  "GROK_AUTH_CLIENT_SECRET",
  "GROK_AUTH_ISSUER",
];

const pairs = keys
  .map((key) => {
    const value = process.env[key]?.trim() ?? "";
    return value ? [key, value] : null;
  })
  .filter(Boolean);

if (pairs.length === 0) {
  console.log("[inject-env] no deploy env — skip");
  process.exit(0);
}

const funcDir = join(".vercel", "output", "functions", "__server.func");
const entry = join(funcDir, "index.mjs");
if (!existsSync(entry)) {
  console.log("[inject-env] no vercel server function — skip");
  process.exit(0);
}

const lines = pairs.map(
  ([key, value]) => `process.env.${key} ||= ${JSON.stringify(value)};`,
);

const injectPath = join(funcDir, "__aea_env.mjs");
writeFileSync(injectPath, `${lines.join("\n")}\n`);

const src = readFileSync(entry, "utf8");
if (src.includes("__aea_env.mjs")) {
  console.log("[inject-env] already wired");
  process.exit(0);
}
writeFileSync(entry, `import "./__aea_env.mjs";\n${src}`);
console.log("[inject-env] wired runtime env into server function");
