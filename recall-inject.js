/**
 * tdai-recall-inject — agent-plane recall injection row for dsh-tdai-memory.
 *
 * Mounted INSIDE an agent preset (agent.cordis.yml), this row listens on the
 * `system-prompt/assemble` waterfall in the preset's scope, so it runs for
 * every assembly of every agent joined to that preset (agent -> preset scope
 * chain). It asks the `tdaiMemory` service (provided by the root-level
 * dsh-tdai-memory plugin) for relevant long-term memories and appends them
 * as dynamic context sections (user-role snapshots):
 *
 *   - tdai:recall  — relevant L1 memories for the current user message
 *   - tdai:profile — stable persona / scene navigation context
 *
 * The recall call is bounded by this row's `timeoutMs`; failures degrade to no
 * injection and never break the assembly.
 */
import z from "@deepseek-ai/schemastery";
import { createRecallCache, recallWithTimeout } from "./recall-runtime.js";

/** Cordis plugin name. */
const name = "tdai-recall-inject";
/** Services consumed: the prompt registry and the memory core service. */
const inject = ["systemPrompt", "tdaiMemory"];

/** Runtime schema for the recall-inject row. */
const Config = z.object({
  /** Skip recall when the user message is shorter than this. */
  minUserTextChars: z.number().default(1),
  /** Per-session cache TTL for identical user text (ms). */
  cacheTtlMs: z.number().default(30_000),
  /** Assembly deadline even when the memory service does not settle. */
  timeoutMs: z.number().default(4000),
});

function apply(ctx, config) {
  const cache = createRecallCache(config.cacheTtlMs ?? 30_000);

  ctx.on("system-prompt/assemble", async (assembly, context) => {
    try {
      const agent = context?.agent;
      if (!agent) return assembly;
      const session = agent.session;
      if (!session) return assembly;
      // Only real human input triggers recall. DSH injects synthetic
      // user-role context (system reminders, runtime context, skill
      // catalogs, …) whose source.kind is not "user"; recalling on those
      // would pollute the prompt with irrelevant memories (issue #1).
      const lastUser = [...session.deriveMessages()]
        .reverse()
        .find((m) => m.role === "user" && (m.source == null || m.source.kind === "user"));
      if (!lastUser) return assembly;
      const text = extractText(lastUser.content);
      if (!text || text.length < config.minUserTextChars) return assembly;

      const cached = cache.get(session.id, text);
      if (cached !== undefined) {
        return injectRecall(assembly, cached);
      }
      const result = await recallWithTimeout(
        () => ctx.tdaiMemory.handleBeforeRecall(text, session.id), config.timeoutMs,
      );
      cache.set(session.id, text, result);
      return injectRecall(assembly, result ?? {});
    } catch {
      return assembly;
    }
  });
}

function extractText(content) {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .filter((b) => b && b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

function injectRecall(assembly, result) {
  const extras = [];
  if (result.prependContext) extras.push({ name: "tdai:recall", order: 1000, text: result.prependContext });
  if (result.appendSystemContext) extras.push({ name: "tdai:profile", order: 1001, text: result.appendSystemContext });
  if (extras.length === 0) return assembly;
  return { ...assembly, contexts: [...assembly.contexts, ...extras] };
}

export { Config, apply, inject, name };
