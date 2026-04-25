import { existsSync, mkdirSync, rmSync, cpSync, readdirSync } from 'fs';
import { join } from 'path';
import { $ } from 'bun';
import { consola } from 'consola';
import { downloadTemplate } from 'giget';

const CONFIG_FILE = 'src/sources.json';
const TEMP_DIR = '.sync_temp';

const config: RootConfig = await Bun.file(CONFIG_FILE).json();

/** 递归列出目录下所有文件（相对路径） */
function listFiles(dir: string, prefix = ''): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath, relPath));
    } else if (entry.isFile()) {
      files.push(relPath);
    }
  }
  return files;
}

async function syncSkill(skill: SourceConfig, baseDir: string) {
  const { name, repo_url, resource, target, branch = 'main' } = skill;

  const targetPath = join(process.cwd(), target);
  const tempPath = join(
    process.cwd(),
    TEMP_DIR,
    name.replace(/[/\\?%*:|"<>]/g, '_'),
  );

  consola.start(`同步: ${name}`);
  consola.info(`目标: ${targetPath}`);

  let gigetUrl = repo_url;
  if (!gigetUrl) return
  if (resource) gigetUrl = `${gigetUrl}/${resource}`;
  if (branch && !gigetUrl.includes('#')) gigetUrl = `${gigetUrl}#${branch}`;

  try {
    // 1. 下载到临时目录
    if (existsSync(tempPath)) rmSync(tempPath, { recursive: true, force: true });
    mkdirSync(tempPath, { recursive: true });

    consola.info('正在下载最新版本...');
    await downloadTemplate(gigetUrl, {
      dir: tempPath,
      force: true,
      cwd: process.cwd(),
    });

    const sourcePath = tempPath;

    if (!existsSync(sourcePath) || readdirSync(sourcePath).length === 0) {
      consola.error('错误: 下载内容为空');
      return;
    }

    // 2. 目标不存在 → 直接初始化
    if (!existsSync(targetPath)) {
      consola.info('目标不存在，直接初始化...');
      mkdirSync(targetPath, { recursive: true });
      cpSync(sourcePath, targetPath, { recursive: true });
      consola.success(`✓ ${name} 初始化完成`);
      return;
    }

    // 3. 目标存在 → 逐个文件对比内容
    consola.info('检测到本地已有文件，正在分析差异...');

    const localFiles = listFiles(targetPath);
    const remoteFiles = listFiles(sourcePath);

    const localSet = new Set(localFiles);
    const remoteSet = new Set(remoteFiles);

    const changedFiles: string[] = [];
    for (const file of localFiles) {
      if (!remoteSet.has(file)) continue;
      const [localContent, remoteContent] = await Promise.all([
        Bun.file(join(targetPath, file)).text(),
        Bun.file(join(sourcePath, file)).text(),
      ]);
      if (localContent !== remoteContent) changedFiles.push(file);
    }

    const onlyLocal = localFiles.filter(f => !remoteSet.has(f));
    const onlyRemote = remoteFiles.filter(f => !localSet.has(f));

    // 无差异
    if (changedFiles.length === 0 && onlyRemote.length === 0 && onlyLocal.length === 0) {
      consola.info('✓ 与远程版本一致，无需更新');
      return;
    }

    consola.info(
      `差异: ${changedFiles.length} 个文件修改, ${onlyRemote.length} 个新增, ${onlyLocal.length} 个删除`,
    );

    // 4. 用 VS Code 逐个打开 diff
    if (changedFiles.length > 0) {
      consola.info(`正在打开 ${changedFiles.length} 个 VS Code diff 标签页...`);
      for (const file of changedFiles) {
        try {
          await $`code --diff "${join(targetPath, file)}" "${join(sourcePath, file)}"`.quiet();
        } catch {
          consola.warn('无法启动 VS Code (请确保 code 命令在 PATH 中)');
          break;
        }
      }
    }

    if (onlyRemote.length > 0) {
      consola.info('新增文件 (远程有，本地无):');
      onlyRemote.forEach(f => console.log(`  + ${f}`));
    }
    if (onlyLocal.length > 0) {
      consola.info('已删除文件 (远程已移除):');
      onlyLocal.forEach(f => console.log(`  - ${f}`));
    }

    // 5. 等待用户确认
    console.log('');
    await consola.prompt('请在 VS Code 中查看差异，完成后按 Enter 继续', {
      type: 'text',
    });

    // 6. 询问是否覆盖
    const overwrite = await consola.prompt('是否用远程版本覆盖本地?', {
      type: 'confirm',
    });

    if (overwrite) {
      rmSync(targetPath, { recursive: true, force: true });
      mkdirSync(targetPath, { recursive: true });
      cpSync(sourcePath, targetPath, { recursive: true });
      consola.success(`✓ ${name} 已覆盖更新`);
    } else {
      consola.info('已跳过，本地文件保持不变');
    }
  } catch (error: any) {
    consola.fail(`同步失败: ${error.message}`);
  } finally {
    if (existsSync(tempPath)) {
      rmSync(tempPath, { recursive: true, force: true });
    }
  }
}

async function main() {
  if (!existsSync(CONFIG_FILE)) {
    consola.error(`找不到 ${CONFIG_FILE}`);
    return;
  }

  const basePath = config.settings?.base_path;
  if (!basePath) return consola.error('请在配置文件中指定 base_path');

  consola.box(`技能中心: ${basePath}`);

  for (const source of config.sources) {
    if (source.type === 'self') {
      consola.info(`跳过 (本地技能): ${source.name}`);
      continue;
    }
    await syncSkill(source, basePath);
    console.log('---');
  }

  consola.success('所有任务完成');
}

main().catch(consola.error);
