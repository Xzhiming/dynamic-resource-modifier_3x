# Magic Resource Modifier

A batch resource modification plugin for Cocos Creator 3.x (**TypeScript** source code, `tsc` output to `dist/`). **Current version: 3.2.0** (based on the `version` in `package.json`; see [CHANGELOG-1.0.md](./CHANGELOG/CHANGELOG-1.0.md) for change notes). The product version number is aligned with Creator's 2.x sister extension, [`dynamic-resource-modifier_2x`](../../2.x/dynamic-resource-modifier_2x). Milestone comparisons for both versions can be found at the top of [CHANGELOG-2.0.md](./CHANGELOG/CHANGELOG-2.0.md) and [CHANGELOG-1.0.md](./CHANGELOG/CHANGELOG-1.0.md) at **v3.2.0**. Four types of operations are provided through a separate panel:

1. **Batch rename resource names:** Supports five modes: find and replace, prefix, suffix, sequential numbering, and regular expressions. Automatically follows `.meta` migration; a "preview" is available before operation.

2. **Rename resource directory:** Renames the entire target directory, with `.meta` migration synchronized.

3. **Modify Resource UUIDs**: Supports three scopes—single resource, non-recursive within a directory, and recursive across all resources within a directory; generates v4 UUIDs (optionally confuse-co with the same primary salt) and removes duplicates from existing UUIDs in the project; the `6c48a` / `f9941` sub-items in the `subMetas` of `image` resources follow the **`primary UUID@subkey`** specification. By default, it synchronously replaces `.scene` / `.prefab` / `.anim` / `.material` and text in `settings/` and `profiles/` (Build/Release, etc.); supports path glob, 32-bit compact UUID, and compound `@6c48a` / `@f9941` strings for replacement. After modifying the UUID in a directory, a full `reimport-asset` option is available; see the changelog for details.

4. **Modify Resource MD5:** Two strategies: Modify only `.meta.ver` (recommended), append content to change the physical MD5; optional: "Do both". `.json` files automatically revert to `bump-meta-ver` in `touch-content` mode.

## Development and Build

1. Install dependencies: `npm install`

2. Compile: `npm run build` (generates/updates `dist/`)

3. Clean up build artifacts (optional): `npm run clean`

4. (Optional) Desktop preview panel: `npm run desktop` (requires running `npm run desktop:electron` to install Electron first)

When developing from source code, after each modification to files under `src/`, you need to re-run `npm run build` and then reload the extension in Creator.

If using only a distribution package that includes `dist/`, you can directly copy the entire extension directory without installing Node.js.

## Usage

1. Copy the plugin directory to your project's `extensions/` directory or the Creator global extension directory (if cloning from source code, please complete the "Development and Build" section in the previous section first).

2. Enable the plugin in Creator's menu **Extensions → Extension Manager**.

3. Open the panel in the menu **Project → Magic Resource Modifier**.

4. Select the target directory → Configure the parameters for each group → Preview before executing.

## Security Tips

- **All operations directly modify resource files and `.meta` tags on your disk.** It is strongly recommended to commit a Git post or make a backup before performing any operations.

- After modifying the UUID, please refresh/restart Creator to avoid cache inconsistencies.

- The `touch-content` strategy for audio files may be ignored by some strict decoders after appending bytes; it is recommended to use `bump-meta-ver` instead.

## Functionality Completeness

| Function | Status | Description |

| --- | --- | --- |

| ① Batch Renaming (5 modes) | ✅ | Implements all replace / prefix / suffix / sequence / regex commands |

| ① Preview Function | ✅ | Limited to 200 entries, marked with truncated flag |

| ① .meta file renaming | ✅ | `BatchRenameService` internally synchronizes renaming with `.meta` |

| ① Case-sensitive renaming (Windows/Mac) | ✅ | Two-stage temp rename |

| ② Directory renaming + .meta synchronization | ✅ | `FolderRenameService.renameFolder` |

| ③ UUID Modification (three scopes) | ✅ | `UuidModifier.modifyUuid`: single / dir-flat / dir-all |

| ③ Deduplicating UUIDs across the entire project | ✅ | `UuidModifier.collectAllUuids` scans all .meta files |

③ subMetas UUIDs | ✅ | Sub-items are replaceable; `6c48a` / `f9941` are in the form of `primary UUID@key` to avoid missing entries |

③ scene UUID reference synchronization | ✅ | Scans assets/ + settings/ + profiles/ |

④ MD5 modification (bump-meta-ver) | ✅ | `Md5Modifier`: increments the ver field |

④ MD5 modification (touch-content) | ✅ | Appends bytes / newline / 0x20 by type; .json automatically rolls back to bump-meta-ver |

④ MD5 modification (both) | ✅ | Both can be executed simultaneously |

General directory selection / reset | ✅ | Pulls default values ​​from `assets/` during panel initialization |

package.json message registration | ✅ | All 10 messages are registered and correspond to methods in `dist/main.js` (including `get-mrm-locale` and `append-result-log`) |

| Initial values ​​for panel checkboxes | ✅ | Force `.value = true` in `ready()` |

## Note

- **`version` (e.g., 3.2.0)** and the Creator **2.x** sister extension [`dynamic-resource-modifier_2x`](../../2.x/dynamic-resource-modifier_2x) are **product milestone aligned** for easy comparison of releases on both platforms; functionality and implementation are subject to the respective engine version branches.

- If you still encounter "The asset ... is missing!" or resource errors after modifying the entire repository's UUID, you can close the project, delete `library/` and `temp/`, and then reopen it, or use the menu **Resources → Re-import Resources**. If you previously messed up the entire repository using version 1.2.4 or earlier, it is recommended to **restore from Git/backup** and then run the project with the current version.

- Please handle `profiles/` with caution; generally, **do not** delete the entire directory without understanding the consequences, unless explicitly required by the documentation or engine process.

## License

MIT