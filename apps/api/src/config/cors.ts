import { env } from "./env";

/**
 * Allow the configured web origin, any Cloud Run URL (*.run.app — both URL
 * formats Cloud Run issues), and localhost during dev. Requests with no Origin
 * (curl, same-origin, server-to-server) are allowed.
 */
export function isAllowedOrigin(origin?: string | null): boolean {
  if (!origin) return true;
  if (origin === env.webOrigin) return true;
  try {
    const host = new URL(origin).hostname;
    return host.endsWith(".run.app") || host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}
