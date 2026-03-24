import { useEffect, useRef, useCallback, useState } from "react";
import { useWebSocket } from "../hooks/useWebSocket";

const FAVICON_SIZE = 32;
const BADGE_RADIUS = 6;
const ORIGINAL_FAVICON = "/favicon.svg";

function drawBadge(count: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = FAVICON_SIZE;
  canvas.height = FAVICON_SIZE;
  const ctx = canvas.getContext("2d")!;

  // Draw base favicon as rounded rect with pulse line
  // Background
  ctx.beginPath();
  ctx.roundRect(0.5, 0.5, 31, 31, 9.5);
  ctx.fillStyle = "rgba(244, 63, 94, 0.15)";
  ctx.fill();
  ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Pulse line
  ctx.beginPath();
  ctx.moveTo(6, 18);
  ctx.lineTo(10, 18);
  ctx.lineTo(13, 12);
  ctx.lineTo(16, 22);
  ctx.lineTo(19, 8);
  ctx.lineTo(22, 18);
  ctx.lineTo(26, 18);
  ctx.strokeStyle = "#f43f5e";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  // Draw notification badge
  const cx = FAVICON_SIZE - BADGE_RADIUS - 1;
  const cy = BADGE_RADIUS + 1;

  // Badge background with slight border
  ctx.beginPath();
  ctx.arc(cx, cy, BADGE_RADIUS + 1, 0, Math.PI * 2);
  ctx.fillStyle = "#09090b";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, BADGE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = "#ef4444";
  ctx.fill();

  // Badge text
  if (count > 0) {
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${count > 9 ? 7 : 8}px -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(count > 99 ? "99" : String(count), cx, cy + 0.5);
  }

  return canvas.toDataURL("image/png");
}

function setFavicon(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/png";
  link.href = href;
}

function resetFavicon() {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/svg+xml";
  link.href = ORIGINAL_FAVICON;
}

export function FaviconBadge() {
  const [errorCount, setErrorCount] = useState(0);
  const isHiddenRef = useRef(false);

  // Track tab visibility
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        isHiddenRef.current = true;
      } else {
        isHiddenRef.current = false;
        setErrorCount(0);
        resetFavicon();
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Update favicon when count changes
  useEffect(() => {
    if (errorCount > 0) {
      setFavicon(drawBadge(errorCount));
    }
  }, [errorCount]);

  // Listen for new errors
  const handleMessage = useCallback((msg: { type: string }) => {
    if (msg.type === "new_error" && isHiddenRef.current) {
      setErrorCount((c) => c + 1);
    }
  }, []);

  useWebSocket(handleMessage);

  return null;
}
