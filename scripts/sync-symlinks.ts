#!/usr/bin/env bun

import { $ } from "bun";
import {
  readdirSync, statSync, readlinkSync,
  existsSync, mkdirSync, rmSync,
  read,
} from "fs";
import { join, relative } from "path";
import { safeAwait } from "../src/utils";
import { readdir } from "fs/promises";
import { ok, err, ResultAsync } from "neverthrow"
// 配置
const ROOT = process.cwd();
const RESTORE_FILE = join(ROOT, ".git", "restore-list.json");
const EXCLUDE_DIRS = [".git", "node_modules"];


// 1. 递归扫描
async function scanSymlinks(dir: string): Promise<string[]> {
  const result = await ResultAsync.fromPromise(
    readdir(dir, { withFileTypes: true }),
    (error: any) => `无法访问目录 ${dir}: ${error?.message}`
  )

  if (result.isErr()) {
    console.warn(result.error);
    return []
  }

  const files = result.value
  let symlinks: string[] = []
  for (const file of files) {
    const fullPath = join(dir, file.name);
    if (EXCLUDE_DIRS.includes(file.name)) continue;
    if (file.isSymbolicLink()) {
      symlinks.push(fullPath);
    } else if (file.isDirectory()) {
      const subLinks = await scanSymlinks(fullPath);
      symlinks = symlinks.concat(subLinks);
    }
  }
  return symlinks;

}






async function main() {
  console.log("🔍 正在扫描软连接...");
  const symlinks = await scanSymlinks(ROOT);

  if (symlinks.length === 0) {
    return new Error("✅ 未发现软连接，跳过。");
  }

  const restoreMap: Record<string, string> = {};

  for (const linkPath of symlinks) {
    // 检查链接是否有效
    if (!existsSync(linkPath)) continue;

    const targetPath = readlinkSync(linkPath);
    const relativePath = relative(ROOT, linkPath);

    console.log(`🔄 实体化: ${relativePath}`);

    // 记录：相对路径 -> 源路径
    restoreMap[relativePath] = targetPath;

    // --- 核心修复：区分文件与目录 ---

    try {
      const targetStat = statSync(targetPath);

      if (targetStat.isDirectory()) {
        // === 情况 A: 这是一个目录软连接 ===
        // 1. 读取目标目录下的所有文件


        // 1. 读取目标目录下的所有文件（转换为字符串类型）
        const files = readdirSync(targetPath, { recursive: true })
          .map(file => typeof file === 'string' ? file : file.toString());


        // 2. 删除旧的软连接 (Windows 上必须删了才能重建同名文件夹)
        rmSync(linkPath, { recursive: true, force: true });

        // 3. 创建新目录
        mkdirSync(linkPath, { recursive: true });

        // 4. 复制所有文件进去
        for (const file of files) {
          const srcFile = join(targetPath, file);
          const dstFile = join(linkPath, file);

          if (statSync(srcFile).isFile()) {
            // 确保子目录存在
            mkdirSync(join(linkPath, join(file, '..')), { recursive: true });
            // Bun 文件复制
            await Bun.write(dstFile, Bun.file(srcFile));
          }
        }
      } else {
        // === 文件软连接 ===
        await Bun.write(linkPath, Bun.file(targetPath));
      }
    } catch (err) {
      console.error(`   ❌ 处理失败: ${relativePath}`, err);
      continue;
    }

    // 5. 更新 Git 索引
    await $`git add "${linkPath}"`.quiet();
  }

  // 保存恢复记录
  await Bun.write(RESTORE_FILE, JSON.stringify(restoreMap, null, 2));
  console.log("✅ 准备就绪，正在提交...");
}



main()
