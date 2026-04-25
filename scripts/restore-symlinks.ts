#!/usr/bin/env bun

import { rmSync, symlinkSync, existsSync, statSync } from "fs";
import { join } from "path";
import { sep } from "path";

const ROOT = process.cwd();
const RESTORE_FILE = join(ROOT, ".git", "restore-list.json");

async function main() {
  if (!existsSync(RESTORE_FILE)) {
    process.exit(0);
  }

  const restoreMap = await Bun.file(RESTORE_FILE).json() as Record<string, string>;

  console.log("🔗 正在恢复软连接...");

  for (const [relativePath, targetPath] of Object.entries(restoreMap)) {
    const fullPath = join(ROOT, relativePath);

    // 如果已经是软连接，跳过
    try {
      const stats = statSync(fullPath, { throwIfNoEntry: false });
      if (stats?.isSymbolicLink()) continue;
    } catch (_e) {
      continue;
    }

    try {
      // Windows 目录删除技巧：给目录路径加分隔符避免歧义
      const isDir = statSync(fullPath).isDirectory();
      const pathToDelete = isDir ? fullPath + sep : fullPath;

      rmSync(pathToDelete, { recursive: true, force: true });

      // 重建软连接
      symlinkSync(targetPath, fullPath);
      console.log(`   🔗 恢复: ${relativePath}`);
    } catch (e) {
      console.error(`   ❌ 恢复失败: ${relativePath}`, e);
    }
  }

  // 清理记录文件
  rmSync(RESTORE_FILE);
  console.log("✅ 恢复完成，本地环境已还原。");
}

main().catch(console.error);
