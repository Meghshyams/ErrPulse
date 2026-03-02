import {
  ErrorType,
  ErrorSource,
  Severity,
  generateEventId,
  type ErrLensEvent,
} from "@errlens/core";
import { enqueueEvent } from "../client.js";

export function installResourceErrorHandler(): () => void {
  const handler = (event: Event) => {
    const target = event.target as HTMLElement;
    if (!target || !("tagName" in target)) return;

    // Only handle resource elements (img, script, link, etc.)
    const tag = target.tagName?.toLowerCase();
    if (!["img", "script", "link", "audio", "video"].includes(tag)) return;

    const src = (target as HTMLImageElement).src || (target as HTMLLinkElement).href || "unknown";

    const errEvent: ErrLensEvent = {
      eventId: generateEventId(),
      timestamp: new Date().toISOString(),
      type: ErrorType.ResourceError,
      message: `Failed to load ${tag}: ${src}`,
      source: ErrorSource.Frontend,
      severity: Severity.Warning,
      environment: {
        runtime: "browser",
        browser: navigator.userAgent,
        url: window.location.href,
      },
      extra: { tag, src },
    };

    enqueueEvent(errEvent);
  };

  // Use capture phase to catch resource errors
  window.addEventListener("error", handler, true);
  return () => window.removeEventListener("error", handler, true);
}
