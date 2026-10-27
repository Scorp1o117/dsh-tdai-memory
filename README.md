# DSH TDAI Memory

简体中文 | [English](README.en.md)

将 TencentDB Agent Memory 的分层记忆系统接入 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)：捕获对话、提取结构化记忆，并在后续对话中检索相关内容。项目基于原 OpenClaw 插件的核心进行 DSH 适配。

## 功能

| 层级 | 用途 |
| --- | --- |
| L0 | 捕获原始对话，供后续检索 |
| L1 | 使用提取模型整理事实、偏好和事件等结构化记忆 |
| L2 / L3 | 生成场景信息与用户画像 |
| 召回与搜索 | 按当前消息召回相关记忆；提供 `tdai_memory_search` 和 `tdai_conversation_search` 工具 |

数据默认保存在 `~/.memory-tencentdb/memory-tdai`，可复用已有同目录记忆。记忆写入、提取和召回依赖启用状态、模型连接及检索结果，不保证每条信息都会被保存或召回。

## 兼容性与安装

支持 DSH Web / Desktop；仓库声明兼容 `0.2.0-rc.2`、`0.2.1-rc.1` / `rc.2` / `rc.3` 和符合 `>=0.2.0-rc.2 <0.3.0` 的版本，预发布版本范围见 [package.json](package.json)。要求 Node.js `>=22.18`。

Desktop 先在 **应用 → 管理 dsh 命令** 安装桌面版 `dsh`：

```sh
dsh plugin --profile desktop add dsh-tdai-memory
```

Web 将 `desktop` 改为 `web`。安装后重启 DSH，打开 **插件 → 已安装 → dsh-tdai-memory**。也可通过 [Enhancement Suite](https://github.com/Scorp1o117/dsh-enhancement-suite) 安装。

## 快速配置

1. 配置用于记忆提取的 **OpenAI 兼容 LLM 地址、模型和密钥**。
2. 配置 **OpenAI 兼容 Embedding 地址、模型和维度**。默认地址 `http://127.0.0.1:8088/v1` 只是配置值，你需要自行提供可用的 Embedding 服务。
3. 选择**自动记忆**并保存，重启 DSH 使记忆管线配置生效。
4. 对话后可让 Agent 搜索记忆，或检查插件日志确认提取和工具注册情况。

| 模式 | 捕获 | 提取 | 自动召回 | 搜索工具 |
| --- | --- | --- | --- | --- |
| 自动记忆 | 开 | 开 | 开 | 开 |
| 仅搜索已有记忆 | 关 | 关 | 关 | 开 |
| 暂停记忆功能 | 关 | 关 | 关 | 关 |

高级设置可单独调整开关、存储位置和调优参数；已有混合配置显示为自定义组合，不会自动覆盖。搜索工具开关可即时生效，其他管线配置按提示重启。表单只写入编辑过的字段，未修改的密钥保留。

## 使用说明

- 提取模型需要稳定输出结构化结果；提取在后台进行，耗时和质量取决于模型与服务。
- 默认关闭 LLM 去重。默认 Embedding 使用本地 OpenAI 兼容端点；远程兼容端点不需要 `node-llama-cpp`。若选择完全本地的 Embedding 后端，需要在目标 Profile 另行安装并批准可选的 `node-llama-cpp` 构建。
- 搜索工具缺失时，确认工具开关已开启，并检查 `[tdai-memory] tools registered` 日志。语言跟随 DSH。
- 捕获的对话和记忆会保存在本机；提取与 Embedding 请求会发送到你配置的服务，请自行选择合适的端点并备份数据。

## 开发、来源与反馈

- [历史详细文档](https://github.com/Scorp1o117/dsh-tdai-memory/blob/7e1dd9c9b1214f5fc531f560296e492af204c4e1/README.zh.md)保留架构、配置示例和旧版说明，其中安装命令与兼容性信息可能已过时。
- 本项目移植 TencentDB Agent Memory；随仓库分发的第三方代码和许可证请参见对应目录。
- [npm](https://www.npmjs.com/package/dsh-tdai-memory) · [问题反馈](https://github.com/Scorp1o117/dsh-tdai-memory/issues) · [MIT License](LICENSE)
