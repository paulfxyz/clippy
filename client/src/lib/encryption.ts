/**
 * @file encryption.ts
 * @description Browser-native AES-GCM encryption for the OpenRouter API key.
 *
 * WHY THIS EXISTS
 * ---------------
 * The OpenRouter API key is sensitive. While Clippy never persists it to
 * localStorage, sessionStorage, or any server, we want to demonstrate to the
 * user that their key is treated with care — and provide a clear visual
 * "locked" indicator in the UI once the key has been entered.
 *
 * HOW IT WORKS
 * ------------
 * We use the Web Crypto API (window.crypto.subtle), which is available in all
 * modern browsers and runs entirely in the JavaScript engine with no native
 * binaries. The key is encrypted with AES-GCM (256-bit), which provides both
 * confidentiality and authentication (it detects tampering).
 *
 * The encryption is session-scoped: we derive a random 256-bit AES key at
 * startup (stored in module scope). This key is never exported or stored
 * anywhere — it only lives in the JS heap for the duration of the browser tab.
 *
 * WHAT THIS ACHIEVES
 * ------------------
 * - The raw API key string is never held in React state after it's "locked"
 * - The encrypted blob (base64) is held in state for the "locked" UI indicator
 * - To actually use the key, we decrypt it from the blob at analysis time
 * - This prevents the key from being trivially visible in React DevTools state
 *
 * WHAT THIS DOES NOT ACHIEVE
 * --------------------------
 * - This is NOT protection against a malicious browser extension
 *   (extensions can read JS heap memory regardless)
 * - This is NOT protection against XSS
 *   (XSS can call our decrypt() function directly)
 * - The encryption key itself lives in memory — a sufficiently motivated
 *   attacker with JS heap access can always recover the raw key
 *
 * The goal is defence-in-depth and user trust signalling, not cryptographic
 * secrecy against a capable adversary.
 *
 * ALGORITHM PARAMETERS
 * --------------------
 * - Algorithm:    AES-GCM (NIST SP 800-38D)
 * - Key length:   256 bits
 * - IV length:    96 bits (12 bytes) — recommended for GCM
 * - Tag length:   128 bits (GCM default)
 * - IV strategy:  Random per encryption — never reused
 */

// ---------------------------------------------------------------------------
// Session encryption key
//
// Generated once at module load time. The key lives in the JS engine's memory
// heap for the entire browser session (tab lifetime). It is never exported,
// never serialised to a string, and never leaves the module scope.
// ---------------------------------------------------------------------------

/** The module-level CryptoKey used for all encrypt/decrypt operations. */
let SESSION_KEY: CryptoKey | null = null;

/**
 * Initialises the session encryption key.
 * Called lazily on first use — we don't pay for key generation until needed.
 *
 * @returns A Promise resolving to the AES-GCM CryptoKey.
 */
async function getSessionKey(): Promise<CryptoKey> {
  if (SESSION_KEY) return SESSION_KEY;

  // Generate a fresh 256-bit AES-GCM key.
  // extractable: false — the raw key bytes can never be exported from the
  // crypto subsystem, even if an attacker calls crypto.subtle.exportKey().
  SESSION_KEY = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,        // not extractable
    ["encrypt", "decrypt"]
  );

  return SESSION_KEY;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Encrypts a plaintext string with AES-GCM using the session key.
 *
 * The output is a base64-encoded blob that contains:
 *   [ 12-byte IV | ciphertext | 16-byte GCM auth tag ]
 *
 * The IV is prepended to the ciphertext so that decrypt() can recover it
 * without any out-of-band storage.
 *
 * @param plaintext - The raw string to encrypt (e.g. "sk-or-v1-...")
 * @returns A base64-encoded encrypted blob, safe to store in React state.
 * @throws If Web Crypto is unavailable (ancient browser or non-HTTPS context).
 */
export async function encryptKey(plaintext: string): Promise<string> {
  const key = await getSessionKey();

  // Generate a fresh 12-byte IV for each encryption.
  // Reusing an IV with the same key would be catastrophic for GCM security,
  // so we always generate a new random one.
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encode the plaintext string to UTF-8 bytes
  const encoded = new TextEncoder().encode(plaintext);

  // Encrypt — produces ciphertext + GCM auth tag concatenated
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  // Prepend the IV to the ciphertext so decrypt() can find it
  // Layout: [ iv (12 bytes) | ciphertext+tag (N+16 bytes) ]
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);

  // Convert to base64 for safe storage in React state (strings are safer
  // than Uint8Arrays in state for serialisation/comparison purposes).
  // Array.from() is used instead of spread (...) because TypeScript requires
  // --downlevelIteration for spread on typed arrays below ES2015 targets.
  return btoa(String.fromCharCode(...Array.from(combined)));
}

/**
 * Decrypts a base64-encoded AES-GCM blob back to the original plaintext.
 *
 * This is the inverse of encryptKey(). It:
 * 1. Decodes the base64 blob to bytes
 * 2. Extracts the 12-byte IV from the front
 * 3. Decrypts the remaining bytes
 * 4. Returns the UTF-8 decoded string
 *
 * @param encrypted - The base64 blob produced by encryptKey()
 * @returns The original plaintext string.
 * @throws If decryption fails (wrong key, tampered ciphertext, or wrong blob).
 */
export async function decryptKey(encrypted: string): Promise<string> {
  const key = await getSessionKey();

  // Decode base64 → bytes
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));

  // Split IV (first 12 bytes) from ciphertext+tag (remainder)
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  // Decrypt — throws if the auth tag doesn't match (tampering detected)
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Masks an API key for display in the UI.
 * Shows the first 12 characters and replaces the rest with dots.
 *
 * Example: "sk-or-v1-abc123..." → "sk-or-v1-abc•••••••••••••••"
 *
 * @param key - The raw API key string.
 * @returns A partially-masked string safe to show in the UI.
 */
export function maskKey(key: string): string {
  if (key.length <= 12) return "•".repeat(key.length);
  return key.slice(0, 12) + "•".repeat(Math.min(key.length - 12, 20));
}
