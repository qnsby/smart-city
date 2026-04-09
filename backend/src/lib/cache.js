/**
 * Simple in-memory TTL cache.
 * No external dependencies — just a Map with expiry timestamps.
 */

const store = new Map();

function get(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

function set(key, value, ttlMs) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function del(key) {
  store.delete(key);
}

/** Delete all keys that start with `prefix`. */
function delByPrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** Wrap an async fn so its result is cached under `key` for `ttlMs` ms. */
async function wrap(key, ttlMs, fn) {
  const hit = get(key);
  if (hit !== undefined) {
    return hit;
  }
  const value = await fn();
  set(key, value, ttlMs);
  return value;
}

module.exports = { get, set, del, delByPrefix, wrap };
