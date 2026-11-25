/**
 * @file lib/vault.js
 * Keeps the GitHub access key on this device, encrypted with a password the
 * owner chooses (PBKDF2 → AES-GCM via the browser's Web Crypto API).
 *
 * - The key never leaves the browser except in requests to api.github.com.
 * - After unlocking, the decrypted key is kept in sessionStorage so reloading
 *   the tab doesn't ask again; it disappears when the tab closes.
 * - "Forget this device" wipes everything.
 *
 * Security note: the real protection is GitHub itself — only someone with
 * write access to the repository can publish. The password simply stops
 * anyone with access to this computer from using the stored key.
 */

const VAULT_KEY = 'admin-vault-v1';
const SESSION_KEY = 'admin-session-v1';
const ITERATIONS = 310000;

const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (bytes) => btoa(String.fromCharCode(...bytes));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(password, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function read(storage, key) {
  try {
    return JSON.parse(storage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

export const vault = {
  /** Public info about the saved login (no secrets), or null. */
  info() {
    return read(localStorage, VAULT_KEY)?.meta || null;
  },

  /** Encrypt and store the token. `meta` is non-secret display info. */
  async save(token, password, meta = {}) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(token)));
    localStorage.setItem(VAULT_KEY, JSON.stringify({ salt: b64(salt), iv: b64(iv), data: b64(data), meta }));
    this.startSession(token);
  },

  /** Decrypt the token with the password; throws on a wrong password. */
  async unlock(password) {
    const stored = read(localStorage, VAULT_KEY);
    if (!stored) throw new Error('No saved login on this device.');
    try {
      const key = await deriveKey(password, unb64(stored.salt));
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(stored.iv) }, key, unb64(stored.data));
      const token = dec.decode(plain);
      this.startSession(token);
      return token;
    } catch {
      throw new Error('That password didn’t work. Try again.');
    }
  },

  startSession(token) {
    sessionStorage.setItem(SESSION_KEY, token);
  },

  /** Token for this tab, if already unlocked. */
  session() {
    return sessionStorage.getItem(SESSION_KEY);
  },

  /** Lock: forget the decrypted token for this tab. */
  lock() {
    sessionStorage.removeItem(SESSION_KEY);
  },

  /** Remove every trace of the login from this device. */
  forget() {
    this.lock();
    localStorage.removeItem(VAULT_KEY);
  },
};
