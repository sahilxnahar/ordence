/**
 * Device-capability policy for expensive scenery.
 *
 * The Living Ledger is 883 KB of three.js — roughly four times the rest
 * of the page put together. On a desktop with a fast connection that is a
 * fair trade for the signature moment. On a mid-range phone on a metered
 * Indian mobile connection it is not, and our customers are mostly on
 * phones.
 *
 * So heavy scenes are opt-in by capability rather than shipped to
 * everyone: the lightweight gradient fallback is not a degraded
 * experience, it is the correct one for that device.
 */

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

export function allowsHeavyScene(): boolean {
  if (typeof window === "undefined") return false;

  // Explicit user preferences win outright.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }

  // "Save data" is a direct request to stop spending the user's money.
  const connection = (
    navigator as Navigator & { connection?: NetworkInformation }
  ).connection;
  if (connection?.saveData) return false;
  if (
    connection?.effectiveType &&
    ["slow-2g", "2g", "3g"].includes(connection.effectiveType)
  ) {
    return false;
  }

  // Low-memory devices struggle with a WebGL context plus a particle system.
  const memory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;
  if (typeof memory === "number" && memory < 4) return false;

  // A fine pointer and a wide viewport is a good proxy for "desktop-class,
  // probably plugged in, probably on wifi".
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const wideViewport = window.matchMedia("(min-width: 1024px)").matches;

  return finePointer && wideViewport;
}
