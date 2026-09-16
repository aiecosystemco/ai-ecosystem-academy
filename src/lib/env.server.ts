export function env(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}

/**
 * Map Vercel system env onto the auth knobs the Better Auth server reads at
 * import time. No-ops in the sandbox (those vars are unset) and no-ops when
 * the platform already injected BETTER_AUTH_*. Must run before `auth/server`
 * evaluates — `db.ts` imports this module first.
 */
export function applyDeployEnv(): void {
  if (typeof process === "undefined") return;

  if (!process.env.BETTER_AUTH_URL?.trim()) {
    const host =
      process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
      process.env.VERCEL_URL?.trim();
    if (host) {
      process.env.BETTER_AUTH_URL = host.startsWith("http")
        ? host
        : `https://${host}`;
    }
  }

  if (!process.env.BETTER_AUTH_SECRET?.trim()) {
    const seed = process.env.VERCEL_PROJECT_ID?.trim();
    if (seed) process.env.BETTER_AUTH_SECRET = `aea-auth-${seed}`;
  }
}

applyDeployEnv();

/**
 * Workspace preview vs deployed app. The deployer writes GROK_PROJECT_ID on
 * every publish; the sandbox preview never has it. Single source of truth for
 * the split — gate audience, gate endpoints and connector-token semantics all
 * key off this predicate.
 */
export function isWorkspacePreview(): boolean {
  return !env("GROK_PROJECT_ID");
}
