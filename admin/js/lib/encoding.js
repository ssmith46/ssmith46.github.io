/**
 * @file lib/encoding.js
 * Base64 and hashing helpers for talking to the GitHub API from the browser.
 */

/** Uint8Array → base64 (chunked so large files don't blow the stack). */
export function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

/** base64 → Uint8Array */
export function base64ToBytes(b64) {
  const binary = atob(String(b64).replace(/\s+/g, ''));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/** UTF-8 text → base64 */
export function textToBase64(text) {
  return bytesToBase64(new TextEncoder().encode(text));
}

/** base64 → UTF-8 text */
export function base64ToText(b64) {
  return new TextDecoder().decode(base64ToBytes(b64));
}

/**
 * Git blob SHA-1 of some bytes — identical to the SHA GitHub reports, which
 * lets the admin track file versions without re-downloading them.
 * @param {Uint8Array|string} data
 */
export async function gitBlobSha(data) {
  const body = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const header = new TextEncoder().encode(`blob ${body.length}\0`);
  const all = new Uint8Array(header.length + body.length);
  all.set(header);
  all.set(body, header.length);
  const digest = await crypto.subtle.digest('SHA-1', all);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
