#!/usr/bin/env node
/**
 * Bake deploy-only server env into the Nitro Vercel function so DATABASE_URL
 * is present at runtime (Vercel file deploys cannot set project env vars).
 * No-ops when those vars are unset (sandbox / preview builds).
 */
import { existsSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
const authUrl = process.env.BETTER_AUTH_URL?.trim() ?? "";
const authSecret = process.env.BETTER_AUTH_SECRET?.trim() ?? "";

if (!databaseUrl && !authUrl && !authSecret) {
  console.log("[inject-env] no deploy env — skip");
  process.exit(0);
}

const funcDir = join(".vercel", "output", "functions", "__server.func");
const entry = join(funcDir, "index.mjs");
if (!existsSync(entry)) {
  console.log("[inject-env] no vercel server function — skip");
  process.exit(0);
}

const lines = [];
if (databaseUrl) lines.push(`process.env.DATABASE_URL ||= ${JSON.stringify(databaseUrl)};`);
if (authUrl) lines.push(`process.env.BETTER_AUTH_URL ||= ${JSON.stringify(authUrl)};`);
if (authSecret) lines.push(`process.env.BETTER_AUTH_SECRET ||= ${JSON.stringify(authSecret)};`);

const injectPath = join(funcDir, "__aea_env.mjs");
writeFileSync(injectPath, `${lines.join("\n")}\n`);

const src = readFileSync(entry, "utf8");
if (src.includes("__aea_env.mjs")) {
  console.log("[inject-env] already wired");
  process.exit(0);
}
writeFileSync(entry, `import "./__aea_env.mjs";\n${src}`);
console.log("[inject-env] wired runtime env into server function");
