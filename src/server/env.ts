/**
 * Runtime environment access for server (prerender = false) routes.
 *
 * On Vercel these read the project's configured environment variables at
 * request time. `requireEnv` throws if a secret is missing so a
 * misconfiguration fails loudly rather than silently mis-signing keys.
 */

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
