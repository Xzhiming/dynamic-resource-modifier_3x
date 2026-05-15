"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifyMd5 = exports.modifyUuid = exports.replaceUuidInProject = exports.collectAllUuids = exports.renameFolder = exports.batchRenameFiles = exports.collectRenameTargets = exports.buildExtFilter = exports.computeRename = exports.newUuid = exports.walk = exports.isFile = exports.isDir = exports.Md5Modifier = exports.UuidModifier = exports.FolderRenameService = exports.BatchRenameService = exports.UuidCrypto = exports.buildPathFilter = exports.DEFAULT_SKIP_FILE_SUFFIXES = exports.FsUtils = void 0;
/**
 * 聚合导出：保持与拆分前相同的 API，供 `main.ts`、面板等引用。
 */
var fs_utils_1 = require("./lib/fs-utils");
Object.defineProperty(exports, "FsUtils", { enumerable: true, get: function () { return fs_utils_1.FsUtils; } });
var path_filter_1 = require("./lib/path-filter");
Object.defineProperty(exports, "DEFAULT_SKIP_FILE_SUFFIXES", { enumerable: true, get: function () { return path_filter_1.DEFAULT_SKIP_FILE_SUFFIXES; } });
Object.defineProperty(exports, "buildPathFilter", { enumerable: true, get: function () { return path_filter_1.buildPathFilter; } });
var uuid_crypto_1 = require("./lib/uuid-crypto");
Object.defineProperty(exports, "UuidCrypto", { enumerable: true, get: function () { return uuid_crypto_1.UuidCrypto; } });
var batch_rename_1 = require("./batch-rename/batch-rename");
Object.defineProperty(exports, "BatchRenameService", { enumerable: true, get: function () { return batch_rename_1.BatchRenameService; } });
var folder_rename_1 = require("./rename/folder-rename");
Object.defineProperty(exports, "FolderRenameService", { enumerable: true, get: function () { return folder_rename_1.FolderRenameService; } });
var uuid_modifier_1 = require("./uuid/uuid-modifier");
Object.defineProperty(exports, "UuidModifier", { enumerable: true, get: function () { return uuid_modifier_1.UuidModifier; } });
var md5_modifier_1 = require("./md5/md5-modifier");
Object.defineProperty(exports, "Md5Modifier", { enumerable: true, get: function () { return md5_modifier_1.Md5Modifier; } });
// ── 与历史 API 兼容的函数别名 ─────────────────────────────────
const fs_utils_2 = require("./lib/fs-utils");
const uuid_crypto_2 = require("./lib/uuid-crypto");
const batch_rename_2 = require("./batch-rename/batch-rename");
const folder_rename_2 = require("./rename/folder-rename");
const uuid_modifier_2 = require("./uuid/uuid-modifier");
const md5_modifier_2 = require("./md5/md5-modifier");
exports.isDir = fs_utils_2.FsUtils.isDir.bind(fs_utils_2.FsUtils);
exports.isFile = fs_utils_2.FsUtils.isFile.bind(fs_utils_2.FsUtils);
exports.walk = fs_utils_2.FsUtils.walk.bind(fs_utils_2.FsUtils);
exports.newUuid = uuid_crypto_2.UuidCrypto.newUuid.bind(uuid_crypto_2.UuidCrypto);
exports.computeRename = batch_rename_2.BatchRenameService.computeRename.bind(batch_rename_2.BatchRenameService);
exports.buildExtFilter = batch_rename_2.BatchRenameService.buildExtFilter.bind(batch_rename_2.BatchRenameService);
exports.collectRenameTargets = batch_rename_2.BatchRenameService.collectRenameTargets.bind(batch_rename_2.BatchRenameService);
exports.batchRenameFiles = batch_rename_2.BatchRenameService.batchRenameFiles.bind(batch_rename_2.BatchRenameService);
exports.renameFolder = folder_rename_2.FolderRenameService.renameFolder.bind(folder_rename_2.FolderRenameService);
exports.collectAllUuids = uuid_modifier_2.UuidModifier.collectAllUuids.bind(uuid_modifier_2.UuidModifier);
exports.replaceUuidInProject = uuid_modifier_2.UuidModifier.replaceUuidInProject.bind(uuid_modifier_2.UuidModifier);
exports.modifyUuid = uuid_modifier_2.UuidModifier.modifyUuid.bind(uuid_modifier_2.UuidModifier);
exports.modifyMd5 = md5_modifier_2.Md5Modifier.modifyMd5.bind(md5_modifier_2.Md5Modifier);
//# sourceMappingURL=resource-modifier.js.map