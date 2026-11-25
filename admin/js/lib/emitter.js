/**
 * @file lib/emitter.js
 * Minimal event emitter used by the workspace and other stateful modules.
 */
export class Emitter {
  #handlers = new Map();

  /** Subscribe; returns an unsubscribe function. */
  on(event, fn) {
    if (!this.#handlers.has(event)) this.#handlers.set(event, new Set());
    this.#handlers.get(event).add(fn);
    return () => this.#handlers.get(event)?.delete(fn);
  }

  emit(event, payload) {
    for (const fn of this.#handlers.get(event) || []) {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[emitter] "${event}" handler failed`, err);
      }
    }
  }
}
