# dsh-tdai-memory

## Configuration page (DSH 0.2.0-rc.2 and later)

Open **Plugins → Installed → dsh-tdai-memory** from the homepage sidebar to configure and save this plugin. The page uses the official `plugins.bundle.config` interface, without a duplicate entry in global Settings. Web and Desktop share the page. This version requires DSH 0.2.0-rc.2 or a later 0.2.x host; existing configuration is retained.

Choose **Automatic memory** for capture, extraction, recall and search together; **Search existing memory only** disables capture, extraction and automatic recall while keeping search tools; **Pause memory features** disables all four. The main page contains the two model connections. Individual switches, storage paths and tuning remain under **Advanced**. Existing mixed switch values appear as **Custom combination** and are preserved. Select a mode, Save, then restart DSH for pipeline changes (the search-tool switch applies immediately). Only edited fields are written; blank keys and untouched advanced options remain unchanged.

[![中文文档](https://img.shields.io/badge/%E4%B8%AD%E6%96%87%E6%96%87%E6%A1%A3-blue)](README.zh.md)

**GitHub**: [Scorp1o117/dsh-tdai-memory](https://github.com/Scorp1o117/dsh-tdai-memory) · **npm**: [dsh-tdai-memory](https://www.npmjs.com/package/dsh-tdai-memory)

[![Enhancement Suite](https://img.shields.io/badge/part%20of-Enhancement%20Suite-3964fe)](https://github.com/Scorp1o117/dsh-enhancement-suite) [![npm](https://img.shields.io/npm/v/dsh-enhancement-suite)](https://www.npmjs.com/package/dsh-enhancement-suite)

Part of the [DeepSeek Harness Enhancement Suite](https://github.com/Scorp1o117/dsh-enhancement-suite) — Vision · Soul/Persona · Long-term Memory · Plugin Marketplace.

A port of **TencentDB Agent Memory** (Tencent Cloud's open-source four-layer
memory system, originally an OpenClaw plugin) into DeepSeek Harness.

## Compatibility (v0.4.1)

Verified with DSH `0.1.7-rc.2` (Web) and `0.2.0-rc.2` (Desktop runtime) in isolated profiles. The Desktop app uses its own `desktop` profile. Other DSH prereleases remain unverified.

## Desktop install

Use the Desktop-installed `dsh` command (Application → Manage dsh Command), or the app’s Plugins page. Then install into the Desktop profile:

```powershell
dsh plugin --profile desktop add dsh-tdai-memory@0.3.6
```

Restart the Desktop app to load the client bundle. Desktop keeps its profile under `$DSH_HOME/profiles/desktop`.


## Features

- **L0 conversation capture**: every turn (turn end, request boundary) is
  written to raw conversation storage (JSONL + SQLite + FTS + vectors)
- **L1 structured memory**: a background pipeline uses an LLM to extract
  facts / preferences / events (persona / episodic / instruction) from
  conversations, stored in `records/` + SQLite + FTS + vectors
- **L2 scenes / L3 persona**: scene blocks and user profile generation
  (pipeline-scheduled)
- **Automatic recall injection**: on every prompt assembly, relevant memories
  and the user profile are retrieved by the current user message and injected
  as dynamic context (the model "just remembers")
- **Tools**: `tdai_memory_search` (L1 structured search),
  `tdai_conversation_search` (L0 raw-text search)

The data directory reuses the existing `~/.memory-tencentdb/memory-tdai`, so
**previously accumulated memories carry over seamlessly**.

## Architecture (porting approach)

| Layer | Content |
|---|---|
| Core | The host-neutral core of `tdai-memory-openclaw-plugin` (`src/core`, `src/utils`), tsc-compiled to ESM (`dist-dsh/`), zero changes |
| Host adapter | `StandaloneHostAdapter` (official standalone mode, direct OpenAI-compatible calls) |
| dsh shell | `index.js`: config mapping, `session/event` + `session/flush` capture, `system-prompt/assemble` recall injection on `agent.ctx`, tool registration, lifecycle |
| Fallback | `recall-inject.js`: preset-row recall injection (used when mounted inside an agent preset) |

Recall caches expire after 30 seconds and retain at most 128 sessions per
injection instance. Failed or timed-out recalls are retried on the next assembly.
The preset row also accepts `timeoutMs` (default 4000); reaching this deadline
continues prompt assembly without memory context. Deadline timers are cleared
when recall settles early. Underlying recall work may continue after the deadline.

Hard-won wiring details:

- **Capture**: `session/flush` listener (await semantics; must complete before
  headless exits); `turn/start` timestamps as the L0 cursor floor; turn-id dedup
- **Headless one-shot runs**: wait for `core.handleSessionEnd()` inside flush
  (L1 extraction finishes before exit; otherwise the 5s shutdown timeout kills it)
- **Recall injection**: must be registered on **`agent.ctx`** (assembly runs in
  the agent scope; root listeners never see it); attach one tick after
  `session/created` by resolving the agent from the `agents` service

## Configuration (profile patch + settings)

Configuration is stored in the `tdai-memory` entry of the active Profile patch.
On first launch, DSH imports the old `$DSH_HOME/settings.yaml` values into that
entry. The **Web UI Settings → 记忆**
section edits every field (v0.2.0, write-only keys); TdaiCore is built at
startup, so changes apply **after a restart**.

```yaml
# $DSH_HOME/profiles/web/cordis.patch.yml
- id: tdai-memory
  name: 'dsh-tdai-memory'
  config:
    extraction:
      enabled: true
      enableDedup: false      # dedup LLM output parsing is flaky; off by default
    llm:                      # L1/L2/L3 extraction model (OpenAI-compatible)
      baseUrl: 'https://opencode.ai/zen/go/v1'
      model: 'mimo-v2.5'      # deepseek-v4-flash produces invalid extraction JSON
      sendSessionHeader: true # send x-opencode-session on LLM requests (required by OpenCode Go & similar gateways)
      sessionId: ''           # fixed session id; empty = persistent auto id under the data dir
    embedding:                # vectors (OpenAI-compatible /v1/embeddings)
      baseUrl: 'http://127.0.0.1:8088/v1'
      model: 'Qwen3-Embedding-0.6B'
      dimensions: 1024
      sendDimensions: false
```

## Install

```bash
dsh plugin --profile web add dsh-tdai-memory
```

then mount it in `$DSH_HOME/profiles/web/cordis.patch.yml`:

```yaml
- insert:
    - id: tdai-memory
      name: 'dsh-tdai-memory'
      config: {}          # fill through Settings → 记忆
```

and restart `dsh web`. LLM/embedding API keys can be set in the Web UI
settings page (记忆 / Memory) or in the `tdai-memory` Profile patch entry.

> **Note for users**
> - This plugin is a standard **profile bundle** (`dsh.bundle.patch`):
>   `dsh plugin --profile web add dsh-tdai-memory` installs and mounts it in
>   one step — no manual `cordis.patch.yml` edits needed.
> - DSH exposes the registered `tdai-memory` settings namespace directly; the
>   plugin does not modify files in the host installation.
> - Settings changes apply **after a restart** (TdaiCore is built at startup).
> - Version 0.2.13 and newer require DSH `0.1.0-rc.7` or newer and are tested
>   against `0.1.0-rc.7`, `0.1.0-rc.8`, and `0.1.1-rc.1`.
> - DSH `0.1.0-rc.6` users must pin `dsh-tdai-memory@0.2.11`, the last release
>   carrying the legacy settings-allowlist compatibility patch.

`node-llama-cpp` is an optional peer used only by the fully local embedding
backend. It is intentionally not installed by default because its native build
requires explicit pnpm build approval. Remote OpenAI-compatible embeddings do
not need it. Users who select the local backend should install and approve
`node-llama-cpp` in the target DSH profile separately.

## Known trade-offs

- **Extraction model**: `mimo-v2.5` extracts correctly but takes 20-30s per
  call (background execution, does not block the conversation);
  `deepseek-v4-flash` is fast but its JSON output is non-compliant (extracts 0)
- **dedup**: LLM conflict-detection output parsing is unstable (once caused
  stored=0); off by default; enable only with a more reliable model
- **L1 memory vectors**: written with storage (8088 embedding is fast); L0
  vectors run as a background task, drained by `destroy()` on headless exit
- **Search tools** (`toolsEnabled`, on by default): the switch lives in the
  Plugins page and applies in place — the row config is `volatile`, so the
  plugin re-syncs its registration without a restart. If both tools are
  missing, look for the plugin's
  `[tdai-memory] tools registered: tdai_memory_search, tdai_conversation_search`
  log line (v0.4.1+). Before v0.4.1 it read `config.toolsEnabled` off the
  Volatile wrapper cordis hands to `apply` — a property that never exists — so
  the failure was completely silent (issue #3)
- **Upgrades**: after pulling new upstream code, rerun
  `npx tsc -p dsh-tsconfig.json` in the tdai project dir (output in `dist-dsh/`)

## License

MIT


Saves use the configuration form API. Rejected writes retain the draft and show an error. Changing a model preserves credentials, and disabling a default-on option explicitly stores `false`.
