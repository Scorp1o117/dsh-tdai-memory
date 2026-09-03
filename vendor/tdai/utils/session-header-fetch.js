/**
 * Fetch wrapper that injects a stable session-id header (`x-opencode-session`)
 * into outgoing LLM requests.
 *
 * OpenCode Go (and other OpenAI-compatible gateways) require every request to
 * carry a stable per-conversation id; requests without it started erroring
 * after 2026-09-06. The value is:
 *
 *   1. An explicit configured `sessionId`, when set;
 *   2. Otherwise a persistent per-instance random id. The id is generated once
 *      and stored under the TDAI data dir (`<dataDir>/session-id`), so it
 *      survives restarts — one stable id per plugin instance, which is exactly
 *      what the gateway asks for when the client has no real conversation.
 *
 * Embedding and other non-chat traffic still gets the header (harmless, and
 * gateways may require it on every request). When disabled, returns
 * `globalThis.fetch` unchanged.
 */
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const SESSION_ID_FILE = "session-id";

let cachedId = "";
/** Load-or-create a persistent per-instance session id under `dataDir`. */
export async function resolvePersistentSessionId(dataDir) {
    if (cachedId)
        return cachedId;
    if (!dataDir) {
        cachedId = `tdai-memory-${randomUUID()}`;
        return cachedId;
    }
    try {
        const file = join(dataDir, SESSION_ID_FILE);
        const existing = await readFile(file, "utf8").catch(() => "");
        const trimmed = existing.trim();
        if (trimmed) {
            cachedId = trimmed;
            return cachedId;
        }
        const fresh = `tdai-memory-${randomUUID()}`;
        await mkdir(dataDir, { recursive: true });
        await writeFile(file, fresh, "utf8");
        cachedId = fresh;
        return cachedId;
    }
    catch {
        // Any persistence failure degrades to a per-process id.
        cachedId = `tdai-memory-${randomUUID()}`;
        return cachedId;
    }
}

/**
 * Build a session-id header value for a request.
 * @param {object} opts { send, headerName, sessionId, persistentId }
 * @returns {Record<string,string>|undefined} header object, or undefined when disabled.
 */
export function sessionHeaderOf({ send, headerName, sessionId, persistentId }) {
    if (send === false)
        return undefined;
    const id = (sessionId && String(sessionId).trim()) || persistentId || "";
    if (!id)
        return undefined;
    return { [headerName || "x-opencode-session"]: id };
}

/**
 * Create a fetch wrapper that injects the session-id header into every request.
 * @param {object} opts { send, headerName, sessionId, persistentId }
 * @returns {typeof globalThis.fetch}
 */
export function createSessionHeaderFetch({ send, headerName, sessionId, persistentId }) {
    if (send === false)
        return globalThis.fetch;
    const header = sessionHeaderOf({ send, headerName, sessionId, persistentId });
    if (!header)
        return globalThis.fetch;
    return (async (input, init) => {
        const next = init ? { ...init } : {};
        next.headers = new Headers(init?.headers);
        for (const [k, v] of Object.entries(header)) {
            next.headers.set(k, v);
        }
        return globalThis.fetch(input, next);
    });
}
