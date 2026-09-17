export function env(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}

function onVercel(): boolean {
  return Boolean(
    process.env.VERCEL?.trim() ||
      process.env.VERCEL_ENV?.trim() ||
      process.env.VERCEL_URL?.trim() ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim(),
  );
}

/**
 * Map Vercel system env onto the auth knobs the Better Auth server reads at
 * import time. No-ops in the sandbox (those vars are unset) and no-ops when
 * the platform already injected BETTER_AUTH_*. Must run before `auth/server`
 * evaluates — `db.ts` imports this module first.
 *
 * Google/X federate through the Grok broker. The shared `grok_preview` client
 * only allows `*.grok-sandbox.com` callbacks, which is why Continue with
 * Google/X on the Vercel URL returned Invalid redirect URI. The per-app
 * client from provider setup is used on Vercel only; live preview keeps
 * `grok_preview`.
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

  if (onVercel() && !process.env.GROK_AUTH_CLIENT_ID?.trim()) {
    process.env.GROK_AUTH_CLIENT_ID =
      "grok_c1d24f937fb0470f9f2d7b22fdcbeb4f";
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
