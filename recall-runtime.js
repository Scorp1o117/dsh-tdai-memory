/** Bound recall latency without leaving a timer behind after a fast result.
 * The underlying operation may continue; late failures remain handled. */
export async function recallWithTimeout(operation, timeoutMs = 4000) {
  const delay = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 4000;
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise(resolve => { timer = setTimeout(() => resolve(null), delay); }),
    ]);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Expiring, capacity-limited per-session cache for long-running hosts. */
export function createRecallCache(ttlMs = 30_000, capacity = 128, now = Date.now) {
  const entries = new Map();
  function prune() {
    const time = now();
    for (const [key, entry] of entries) {
      if (time - entry.ts >= ttlMs) entries.delete(key);
    }
  }
  return {
    get(sessionId, text) {
      prune();
      const entry = entries.get(sessionId);
      return entry?.text === text ? entry.result : undefined;
    },
    set(sessionId, text, result) {
      prune();
      if (ttlMs <= 0 || capacity <= 0 || result == null) return;
      entries.delete(sessionId);
      entries.set(sessionId, { text, result, ts: now() });
      while (entries.size > capacity) entries.delete(entries.keys().next().value);
    },
    clear() { entries.clear(); },
  };
}
