export type CorrelationTarget = string | RegExp;

// Hostnames that are safe to send the correlation header to by default:
// local dev servers are almost always the user's own backend, while any
// other cross-origin host may reject the custom header at CORS preflight.
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]", "0.0.0.0"]);

let customTargets: CorrelationTarget[] | undefined;

export function setCorrelationPropagationTargets(targets: CorrelationTarget[] | undefined): void {
  customTargets = targets;
}

function isLocalHostname(hostname: string): boolean {
  return LOCAL_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost");
}

/**
 * Decide whether the correlation header may be attached to a request.
 * Pure function — exported for tests.
 *
 * With no custom targets: same-origin requests and local-dev hosts only.
 * With custom targets: string targets match as substrings of the resolved
 * URL, RegExp targets are tested against it (replacing the defaults).
 */
export function isCorrelationTarget(
  url: string,
  pageUrl: string,
  targets?: CorrelationTarget[]
): boolean {
  let resolved: URL;
  try {
    resolved = new URL(url, pageUrl);
  } catch {
    return false;
  }

  if (targets) {
    const href = resolved.href;
    return targets.some((t) => (typeof t === "string" ? href.includes(t) : t.test(href)));
  }

  if (isLocalHostname(resolved.hostname)) return true;

  try {
    return resolved.origin === new URL(pageUrl).origin;
  } catch {
    return false;
  }
}

export function shouldAttachCorrelationHeader(url: string): boolean {
  if (typeof window === "undefined") return false;
  return isCorrelationTarget(url, window.location.href, customTargets);
}
