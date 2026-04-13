/**
 * @file share.ts
 * @description URL-based result sharing for Clippy v2.0.0.
 *
 * OVERVIEW
 * --------
 * After running an analysis, users can generate a "share URL" that encodes
 * the results directly into the URL hash fragment. Anyone with the URL can
 * view the results in read-only mode — no server, no database, no account.
 *
 * URL FORMAT
 * ----------
 * The share URL looks like:
 *   https://clippy.legal/#/share/BASE64_ENCODED_JSON
 *
 * The hash fragment is handled by the client-side router (wouter with
 * useHashLocation), so ShareView.tsx reads `/#/share/:payload` and decodes
 * the payload to render the results.
 *
 * ENCODING STRATEGY
 * -----------------
 * SharePayload JSON → JSON.stringify → encodeURIComponent → btoa (base64)
 *
 * WHY NOT GZIP/COMPRESS?
 * ----------------------
 * We deliberately chose NOT to use pako/LZ-string compression because:
 *   1. Browser URL length limits: ~2000 chars in some contexts (email clients,
 *      SMS). Compression only helps if the payload is very large — for 2–3
 *      model results, raw base64 is typically under 8KB, which is within
 *      safe limits for modern browsers and most URL handlers.
 *   2. Simplicity: fewer dependencies, fewer failure modes.
 *   3. If we ever need compression for very long contracts, pako can be added
 *      as a layer without changing the URL format (just the encoding function).
 *
 * WHAT'S IN THE PAYLOAD
 * ---------------------
 * See SharePayload in schema.ts. Critically, the API key is NEVER included —
 * only the analysis results, timestamps, and metadata.
 *
 * SAFETY NOTES
 * ------------
 * - No server-side validation needed (the payload is self-contained JSON)
 * - Malformed/tampered payloads are caught by the try/catch in decodeSharePayload()
 *   and result in a "corrupted link" error message in ShareView.tsx
 * - The payload is not encrypted — share URLs are intended to be public.
 *   Users should not share if their contract is sensitive.
 */

import type { SharePayload } from "@shared/schema";

// ---------------------------------------------------------------------------
// Encode
// ---------------------------------------------------------------------------

/**
 * Encodes a SharePayload into a base64 string safe for URL hash fragments.
 *
 * The output can be appended to `/#/share/` to form the full share URL.
 * It is URL-safe (encodeURIComponent applied before btoa).
 *
 * STEPS:
 * 1. JSON.stringify the payload
 * 2. encodeURIComponent → handles Unicode characters in contract text
 * 3. btoa → base64 encode the resulting ASCII-safe string
 *
 * WHY encodeURIComponent BEFORE btoa?
 * btoa can only encode Latin-1 (byte values 0–255). encodeURIComponent
 * converts Unicode code points > 255 to %XX escape sequences first,
 * making the string safe for btoa.
 *
 * @param payload - The SharePayload object to encode
 * @returns A base64-encoded string suitable for use in a URL hash fragment
 */
export function encodeSharePayload(payload: SharePayload): string {
  // JSON → percent-encode → base64
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

// ---------------------------------------------------------------------------
// Decode
// ---------------------------------------------------------------------------

/**
 * Decodes a base64 share URL fragment back into a SharePayload.
 *
 * This is the inverse of encodeSharePayload(). It:
 * 1. atob decodes the base64 string
 * 2. decodeURIComponent restores any percent-encoded Unicode characters
 * 3. JSON.parse reconstructs the SharePayload object
 *
 * Returns null (does NOT throw) on any decoding failure — the caller
 * (ShareView.tsx) handles the null case by showing a "corrupted link" UI.
 * This keeps error handling localised and prevents uncaught exceptions.
 *
 * Possible failure modes:
 *   - atob fails: malformed base64 (truncated URL, clipboard corruption)
 *   - decodeURIComponent fails: invalid percent-encoding
 *   - JSON.parse fails: the JSON was tampered with or truncated
 *   - Schema validation fails: missing required fields (version, results, etc.)
 *
 * @param encoded - The base64 string extracted from the URL hash
 * @returns The decoded SharePayload, or null if decoding fails
 */
export function decodeSharePayload(encoded: string): SharePayload | null {
  try {
    // base64 → percent-encoded → JSON string
    const json = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(json) as SharePayload;

    // Basic schema validation — ensure required fields are present
    // We don't use Zod here to keep the ShareView dependency-light
    if (
      typeof parsed.version !== "string" ||
      typeof parsed.fileName !== "string" ||
      typeof parsed.analyzedAt !== "string" ||
      !Array.isArray(parsed.results)
    ) {
      return null;
    }

    return parsed;
  } catch {
    // Any of the above steps threw — the payload is corrupt or invalid
    return null;
  }
}

// ---------------------------------------------------------------------------
// URL builders
// ---------------------------------------------------------------------------

/**
 * Builds the full shareable URL for a given payload.
 *
 * Uses window.location.origin so the URL is correct regardless of whether
 * the app is running on localhost, clippy.legal, or the preview S3 URL.
 *
 * The wouter hash router treats `/#/share/PAYLOAD` as a route, which
 * ShareView.tsx intercepts to render the decoded results.
 *
 * @param payload - The SharePayload to encode into the URL
 * @returns Full URL string (e.g. "https://clippy.legal/#/share/eyJ...")
 */
export function buildShareUrl(payload: SharePayload): string {
  const encoded = encodeSharePayload(payload);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://clippy.legal";
  return `${origin}/#/share/${encoded}`;
}

/**
 * Extracts the base64 payload from the URL hash, if present.
 *
 * Called by ShareView.tsx on mount to check if the current URL is a share link.
 * The hash format is: `#/share/BASE64`
 *
 * Returns null if:
 *   - There is no hash fragment
 *   - The hash doesn't match the `/share/` prefix pattern
 *   - The payload segment is empty
 *
 * @returns The raw base64 payload string, or null if not a share URL
 */
export function extractPayloadFromHash(): string | null {
  if (typeof window === "undefined") return null;

  // window.location.hash includes the leading "#"
  // e.g. "#/share/eyJ..."
  const hash = window.location.hash;

  const match = hash.match(/^#\/share\/(.+)$/);
  return match ? match[1] : null;
}
