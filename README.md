# Magic Resource Modifier

Cocos Creator 3.x 资源批量修改插件（**TypeScript** 源码，`tsc` 输出至 `dist/`）。**当前版本：3.2.1**（以 `package.json` 的 `version` 为准；变更说明见 [CHANGELOG-1.0.md](./CHANGELOG/CHANGELOG-1.0.md)）。**产品版本号**与 Creator **2.x** 姊妹扩展 [`dynamic-resource-modifier_2x`](../../2.x/dynamic-resource-modifier_2x)（*动态资源修改器*）对齐；双端里程碑对照见 [CHANGELOG-2.0.md](./CHANGELOG/CHANGELOG-2.0.md) 与 [CHANGELOG-1.0.md](./CHANGELOG/CHANGELOG-1.0.md) 顶部 **v3.2.0**。通过独立面板提供四类操作：

1. **批量修改资源名称**：支持查找替换 / 前缀 / 后缀 / 顺序编号 / 正则五种模式，自动跟随 `.meta` 迁移；操作前可"预览"。
2. **修改资源目录名称**：对目标目录整体重命名，`.meta` 同步迁移。
3. **修改资源 UUID**：支持三种作用域 —— 单个资源、目录下不递归、目录下递归全部；生成 v4 UUID（可选 confuse-co 同源主盐）并与项目现有 UUID 去重；`image` 资源的 `subMetas` 中 `6c48a` / `f9941` 子项为 **`主UUID@子键`** 规范。默认同步替换 `.scene / .prefab / .anim / .material` 等及 `settings/`、`profiles/` 下文本（Build/发布等）；支持路径 glob、32 位紧凑 UUID、复合 `@6c48a` / `@f9941` 串替换。目录改 UUID 后可选全量 `reimport-asset` 等，详见变更日志。
4. **修改资源 MD5**：两种策略 —— 仅改 `.meta.ver`（推荐）、追加内容改变物理 md5；可选"两者都做"。`.json` 文件在 `touch-content` 模式下自动回退为 `bump-meta-ver`。


## 开发构建

1. 安装依赖：`npm install`
2. 编译：`npm run build`（生成/更新 `dist/`）
3. 清理编译产物（可选）：`npm run clean`
4. （可选）桌面预览面板：`npm run desktop`（需先按需执行 `npm run desktop:electron` 安装 Electron）

从源码开发时，每次修改 `src/` 下文件后需重新执行 `npm run build`，再在 Creator 中重载扩展。

若仅使用已带 `dist/` 的发布包，可直接拷贝整个扩展目录，无需安装 Node。

## 使用

1. 拷贝插件目录到项目 `extensions/` 下或 Creator 全局扩展目录（若从源码克隆，请先完成上一节「开发构建」）
2. 在 Creator 菜单 **扩展 → 扩展管理器** 启用本插件
3. 菜单 **项目 → Magic Resource Modifier** 打开面板
4. 选择目标目录 → 配置各分组参数 → 先"预览"再"执行"

## 安全提示

- **所有操作均直接修改磁盘上的资源文件与 `.meta`**。强烈建议操作前提交 Git 或做好备份。
- UUID 修改后请刷新 / 重启 Creator，避免缓存不一致。
- 音频文件的 `touch-content` 策略追加字节后可能被部分严格解码器忽略，建议优先使用 `bump-meta-ver`。

## 功能完整性

| 功能 | 状态 | 说明 |
| --- | --- | --- |
| ① 批量改名（5种模式） | ✅ | replace / prefix / suffix / sequence / regex 全部实现 |
| ① 预览功能 | ✅ | 限制 200 条，带 truncated 标志 |
| ① .meta 跟随改名 | ✅ | `BatchRenameService` 内部与 `.meta` 同步重命名 |
| ① 大小写改名（Windows/Mac） | ✅ | 两阶段 temp rename |
| ② 目录改名 + .meta 同步 | ✅ | `FolderRenameService.renameFolder` |
| ③ UUID 修改（三种 scope） | ✅ | `UuidModifier.modifyUuid`：single / dir-flat / dir-all |
| ③ 全项目 UUID 去重 | ✅ | `UuidModifier.collectAllUuids` 扫描所有 .meta |
| ③ subMetas UUID | ✅ | 子项可替换；`6c48a` / `f9941` 为 `主UUID@键` 形式，避免 missing |
| ③ scene UUID 引用同步 | ✅ | 扫描 assets/ + settings/ + profiles/ |
| ④ MD5 修改（bump-meta-ver） | ✅ | `Md5Modifier`：递增 ver 字段 |
| ④ MD5 修改（touch-content） | ✅ | 按类型 append bytes / 换行 / 0x20；.json 自动回退 bump-meta-ver |
| ④ MD5 修改（both） | ✅ | 两者同时执行 |
| 通用目录选择 / 重置 | ✅ | 面板初始化时从 `assets/` 拉默认值 |
| package.json 消息注册 | ✅ | 10 条 message 全部注册且对应 `dist/main.js` 中方法（含 `get-mrm-locale`、`append-result-log`） |
| 面板 checkbox 初始值 | ✅ | `ready()` 中强制 `.value = true` |


## 注意

- **`version`（如 3.2.0）** 与 Creator **2.x** 姊妹扩展 [`dynamic-resource-modifier_2x`](../../2.x/dynamic-resource-modifier_2x) 为**产品里程碑对齐**，便于双端对照发版；功能与实现以各引擎版本分支为准。
- 整库改 UUID 后若仍有 **`The asset ... is missing!`** 或资源异常，可关闭项目后**删除** `library/`、`temp/` 再打开，或使用菜单 **资源 → 重新导入资源**；若曾用 1.2.4 及以前整库改坏，建议**从 Git/备份还原**后使用当前版本再跑。
- 请谨慎处理 `profiles/`；一般**勿**在不了解后果时整目录删除，除非文档或引擎流程明确要求。
## License

MIT
