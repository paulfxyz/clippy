/**
 * @file share.ts
 * @description URL-based result sharing for Clippy v3.0.1.
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
 *      as a transparent layer without changing the URL format.
 *
 * WHAT'S IN THE PAYLOAD
 * ---------------------
 * See SharePayload in schema.ts. Critically, the API key is NEVER included —
 * only the analysis results, timestamps, and metadata.
 *
 * PRIVACY NOTES
 * -------------
 * - No server-side validation needed (the payload is self-contained JSON)
 * - Share URLs are intended to be public. Users should not share if their
 *   contract contains highly sensitive personal or commercial information.
 * - The payload is not encrypted — anyone with the URL can read the results.
 * - Results include verbatim clause quotes from the contract. Users should
 *   be aware that sharing the URL shares these excerpts.
 *
 * ERROR HANDLING
 * --------------
 * - Malformed/tampered payloads are caught by the try/catch in decodeSharePayload()
 *   and result in null, which ShareView.tsx renders as a "corrupted link" UI.
 * - decodeSharePayload() never throws — it always returns SharePayload | null.
 *
 * WHAT'S NEW IN v3.0.1
 * --------------------
 * - Enhanced JSDoc comments and privacy notes throughout
 * - Basic structural type guard improved (validates each result has a modelId)
 */

import type { SharePayload } from "@shared/schema";

// ---------------------------------------------------------------------------
// Encode
// ---------------------------------------------------------------------------

/**
 * Encodes a SharePayload into a base64 string safe for URL hash fragments.
 *
 * The output can be appended to `/#/share/` to form the full share URL.
 *
 * ENCODING STEPS
 * --------------
 * 1. JSON.stringify the payload → produces a JSON string
 * 2. encodeURIComponent → escapes any Unicode characters above Latin-1 (0–255)
 *    into percent-encoded sequences, making the string safe for btoa
 *    (btoa can only handle byte values 0–255; raw emoji or non-ASCII characters
 *    like Chinese or Arabic text would throw a "character out of range" error)
 * 3. btoa → encodes the ASCII-safe string to base64
 *
 * WHY encodeURIComponent BEFORE btoa?
 * btoa operates on Latin-1 strings (byte values 0–255). If the payload contains
 * Unicode characters with code points > 255 (e.g., from contract text, flag
 * descriptions, or non-Latin filenames), btoa will throw "Invalid character".
 * encodeURIComponent converts these to %XX sequences first, keeping all bytes
 * in the 0–255 range.
 *
 * @param payload - The SharePayload object to encode
 * @returns A base64-encoded string suitable for use in a URL hash fragment
 */
export function encodeSharePayload(payload: SharePayload): string {
  // JSON → percent-encode (for Unicode safety) → base64
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

// ---------------------------------------------------------------------------
// Decode
// ---------------------------------------------------------------------------

/**
 * Decodes a base64 share URL fragment back into a SharePayload.
 *
 * This is the inverse of encodeSharePayload(). Decoding steps:
 * 1. atob(encoded) → decodes base64 to percent-encoded string
 * 2. decodeURIComponent(...) → restores Unicode characters from %XX sequences
 * 3. JSON.parse(...) → reconstructs the SharePayload object
 * 4. Structural validation → checks required fields are present
 *
 * SAFETY
 * ------
 * This function NEVER throws — it catches all possible failure modes and
 * returns null instead. The caller (ShareView.tsx) handles the null case
 * by rendering a "corrupted or invalid share link" UI.
 *
 * POSSIBLE FAILURE MODES
 * ----------------------
 * - atob fails:                  malformed base64 (truncated URL, clipboard corruption)
 * - decodeURIComponent fails:    invalid percent-encoding in the decoded string
 * - JSON.parse fails:            JSON was tampered with or truncated
 * - Structural validation fails: missing required fields (version, results, etc.)
 * - results is not an array:     corrupted payload structure
 *
 * @param encoded - The base64 string extracted from the URL hash
 * @returns The decoded SharePayload, or null if decoding fails for any reason
 */
export function decodeSharePayload(encoded: string): SharePayload | null {
  try {
    // base64 → percent-encoded → JSON string
    const json = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(json) as SharePayload;

    // ---------------------------------------------------------------------------
    // Structural validation
    //
    // We validate the minimum required fields without pulling in Zod, which
    // would add a dependency to the ShareView path. This is intentionally
    // lightweight — we trust that valid share URLs were created by Clippy itself.
    // ---------------------------------------------------------------------------
    if (
      typeof parsed.version !== "string"     || // must have a version string
      typeof parsed.fileName !== "string"    || // must have a file name
      typeof parsed.analyzedAt !== "string"  || // must have a timestamp
      !Array.isArray(parsed.results)         || // must have a results array
      parsed.results.length === 0               // must have at least one result
    ) {
      return null;
    }

    // Validate each result has at minimum a modelId (basic sanity check)
    for (const result of parsed.results) {
      if (typeof result.modelId !== "string") return null;
    }

    return parsed;
  } catch {
    // Any of the above steps threw — the payload is corrupt, invalid, or
    // from a future incompatible version of Clippy
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
 * the app is running on localhost, clippy.legal, or an S3 preview URL.
 * Falls back to "https://clippy.legal" in non-browser environments.
 *
 * The wouter hash router treats `/#/share/PAYLOAD` as a route, which
 * ShareView.tsx intercepts to render the decoded results in read-only mode.
 *
 * @param payload - The SharePayload to encode into the URL
 * @returns Full URL string (e.g. "https://clippy.legal/#/share/eyJ...")
 */
export function buildShareUrl(payload: SharePayload): string {
  const encoded = encodeSharePayload(payload);
  const origin = typeof window !== "undefined"
    ? window.location.origin
    : "https://clippy.legal";
  return `${origin}/#/share/${encoded}`;
}

/**
 * Extracts the base64 payload from the URL hash, if present.
 *
 * Called by ShareView.tsx on mount to check if the current URL is a share link.
 * The hash format is: `#/share/BASE64`
 *
 * Examples of matching hashes:
 *   "#/share/eyJ..."          → returns "eyJ..."
 *   "#/share/"                → returns null (empty payload)
 *   "#/"                      → returns null (no share path)
 *   "" (no hash)              → returns null
 *
 * Returns null if:
 *   - window is not defined (server-side rendering context)
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

  // Match: # + /share/ + one or more non-whitespace characters
  const match = hash.match(/^#\/share\/(.+)$/);
  return match ? match[1] : null;
}
