import { readFileSync, existsSync, mkdirSync, symlinkSync, statSync } from 'fs';
import { join, resolve, basename } from 'path';
import { Glob } from 'bun';
import { consola } from 'consola';

const CONFIG_FILE = 'src/sources.json';



async function main() {
  if (!existsSync(CONFIG_FILE)) {
    consola.error(`找不到 ${CONFIG_FILE}`);
    process.exit(1);
  }

  const config: RootConfig = await Bun.file(CONFIG_FILE).json();
  const excludeGlobs = (config.settings.soft_link.exclude || []).map(p => new Glob(p));
  const targetDir = resolve(config.settings.soft_link.target);

  mkdirSync(targetDir, { recursive: true });

  if (process.platform === 'win32') {
    consola.info(
      'Windows 上需要管理员权限或开启开发者模式才能创建软链接',
    );
  }

  let linkCount = 0;
  const seen = new Set<string>();

  for (const includePattern of config.settings.soft_link.include) {
    const glob = new Glob(includePattern);

    for await (const match of glob.scan({ cwd: process.cwd(), onlyFiles: false })) {
      if (excludeGlobs.some(g => g.match(match))) continue;

      const sourcePath = resolve(match);
      const linkName = basename(sourcePath);
      const linkPath = join(targetDir, linkName);

      if (seen.has(linkName)) continue;
      seen.add(linkName);

      if (existsSync(linkPath)) {
        consola.info(`跳过 (已存在): ${linkName}`);
        continue;
      }

      try {
        const stats = statSync(sourcePath);
        symlinkSync(sourcePath, linkPath, stats.isDirectory() ? 'dir' : 'file');
        consola.success(`创建链接: ${linkName} → ${sourcePath}`);
        linkCount++;
      } catch (error: any) {
        consola.fail(`创建失败 ${linkName}: ${error.message}`);
      }
    }
  }

  if (linkCount === 0) {
    consola.info('没有匹配到需要链接的文件');
  } else {
    consola.success(`共创建 ${linkCount} 个软链接`);
  }
}

main();
