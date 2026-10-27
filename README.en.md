# DSH TDAI Memory

[简体中文](README.md) | English

Bring TencentDB Agent Memory's layered memory system to [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): capture conversations, extract structured memories and retrieve relevant context in later conversations. This project adapts the original OpenClaw plugin's core to DSH.

## Features

| Layer | Purpose |
| --- | --- |
| L0 | Capture raw conversations for later search |
| L1 | Use an extraction model to organize facts, preferences and events |
| L2 / L3 | Produce scene information and a user profile |
| Recall and search | Retrieve relevant memory for the current message; expose `tdai_memory_search` and `tdai_conversation_search` |

Data defaults to `~/.memory-tencentdb/memory-tdai`, allowing existing data in that directory to be reused. Capture, extraction and recall depend on enabled settings, model connections and retrieval results; saving or recalling every detail is not guaranteed.

## Compatibility and installation

Supports DSH Web / Desktop. The repository declares compatibility with `0.2.0-rc.2`, `0.2.1-rc.1` / `rc.2` / `rc.3` and versions matching `>=0.2.0-rc.2 <0.3.0`; see [package.json](package.json) for the complete prerelease range. Node.js `>=22.18` is required.

For Desktop, install its `dsh` command through **Application → Manage dsh Command** first:

```sh
dsh plugin --profile desktop add dsh-tdai-memory
```

Replace `desktop` with `web` for Web. Restart DSH and open **Plugins → Installed → dsh-tdai-memory**. You can also install it through the [Enhancement Suite](https://github.com/Scorp1o117/dsh-enhancement-suite).

## Quick setup

1. Configure an **OpenAI-compatible LLM address, model and key** for memory extraction.
2. Configure an **OpenAI-compatible embedding address, model and dimensions**. The default `http://127.0.0.1:8088/v1` is a configuration value, not an included service; provide a working embedding service yourself.
3. Select **Automatic memory**, save and restart DSH to apply pipeline changes.
4. After a conversation, ask the Agent to search memory or check the plugin logs for extraction and tool registration.

| Mode | Capture | Extraction | Automatic recall | Search tools |
| --- | --- | --- | --- | --- |
| Automatic memory | On | On | On | On |
| Search existing memory only | Off | Off | Off | On |
| Pause memory features | Off | Off | Off | Off |

Advanced settings expose individual switches, storage location and tuning. Existing mixed settings appear as a custom combination and are not overwritten automatically. The search-tool switch applies immediately; restart as prompted for other pipeline changes. The form writes edited fields only and retains unchanged keys.

## Usage notes

- The extraction model needs to produce reliable structured output. Extraction runs in the background; latency and quality depend on the model and service.
- LLM deduplication is off by default. The default embedding configuration points to a local OpenAI-compatible endpoint; remote compatible endpoints do not require `node-llama-cpp`. For the fully local embedding backend, install and approve the optional `node-llama-cpp` build in the target profile separately.
- If search tools are missing, check that they are enabled and look for `[tdai-memory] tools registered` in the logs. The interface follows the DSH language setting.
- Captured conversations and memories are stored locally; extraction and embedding requests go to your configured services. Choose appropriate endpoints and back up your data.

## Development, attribution and feedback

- The [historical detailed documentation](https://github.com/Scorp1o117/dsh-tdai-memory/blob/7e1dd9c9b1214f5fc531f560296e492af204c4e1/README.md) preserves architecture, configuration examples and older notes; its install commands and compatibility information may be outdated.
- This project ports TencentDB Agent Memory. See the corresponding directories for third-party code and license notices included with the repository.
- [npm](https://www.npmjs.com/package/dsh-tdai-memory) · [Issues](https://github.com/Scorp1o117/dsh-tdai-memory/issues) · [MIT License](LICENSE)
