import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { consola } from 'consola';

const CONFIG_FILE = 'src/sources.json';
const SKILLS_DIR = 'skills';

/** 获取当前已有的 target 路径集合 */
function getExistingTargets(config: RootConfig): Set<string> {
  return new Set(config.sources.map(s => s.target.replace(/\\/g, '/')));
}

/** 规范化路径，确保以 ./ 开头 */
function normalizePath(p: string): string {
  return p.startsWith('.') ? p : `./${p}`;
}

function main() {
  // 1. 读取现有配置
  if (!existsSync(CONFIG_FILE)) {
    consola.error(`找不到 ${CONFIG_FILE}`);
    return;
  }

  const config: RootConfig = JSON.parse(
    readFileSync(CONFIG_FILE, 'utf-8'),
  );

  const existingTargets = getExistingTargets(config);
  const newSources: SourceConfig[] = [];

  // 2. 扫描 skills/ 目录
  if (!existsSync(SKILLS_DIR)) {
    consola.error(`找不到 ${SKILLS_DIR}/ 目录`);
    return;
  }

  const entries = readdirSync(SKILLS_DIR, { withFileTypes: true });
  const folders = entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .map(e => e.name)
    .sort();

  // 3. 找出新增的文件夹
  for (const folder of folders) {
    const targetPath = normalizePath(join(SKILLS_DIR, folder)).replace(/\\/g, '/');

    if (existingTargets.has(targetPath)) {
      consola.info(`跳过 (已存在): ${targetPath}`);
      continue;
    }

    // 检查是否是 git 子模块
    const gitModulesPath = join(process.cwd(), '.gitmodules');
    let isSubmodule = false;
    if (existsSync(gitModulesPath)) {
      const gitModules = readFileSync(gitModulesPath, 'utf-8');
      // 简单匹配: [submodule "skills/<name>"]
      isSubmodule = gitModules.includes(`"${targetPath}"`) ||
                    gitModules.includes(`"${join('skills', folder)}"`);
    }

    const source: SourceConfig = {
      name: folder,
      target: targetPath,
      type: isSubmodule ? 'remote' : 'self',
    };
    newSources.push(source);
    consola.success(`发现新技能: ${folder} → ${source.type}`);
  }

  // 4. 没有新增则退出
  if (newSources.length === 0) {
    consola.info('没有发现新技能，配置无需更新');
    return;
  }

  // 5. 追加到配置
  config.sources.push(...newSources);

  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');
  consola.success(`已追加 ${newSources.length} 个新技能到 ${CONFIG_FILE}`);
}

main();
