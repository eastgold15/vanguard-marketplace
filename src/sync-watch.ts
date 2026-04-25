import {
  watch,
  existsSync,
  mkdirSync,
  copyFileSync,
  rmSync,
  readdirSync,
  readFileSync,
  statSync,
} from 'fs';
import { join, dirname, resolve } from 'path';
import { consola } from 'consola';

const CONFIG_FILE = 'src/sources.json';
const DEBOUNCE_MS = 300;

const pending = new Map<string, ReturnType<typeof setTimeout>>();

function getConfigPaths() {
  const config: RootConfig = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
  const softLink = config.settings?.soft_link;
  if (!softLink?.include?.length || !softLink?.target) {
    consola.error('配置缺少 soft_link.include 或 soft_link.target');
    process.exit(1);
  }

  // 从 include 模式提取源目录: "C:/Users/boer/.agents/skills/*" → "C:/Users/boer/.agents/skills"
  const sourcePattern = softLink.include[0];
  const sourceDir = resolve(sourcePattern!.replace(/\/\*$/, ''));
  const targetDir = resolve(softLink.target);

  return { sourceDir, targetDir };
}

/** 递归复制目录 */
function copyRecursive(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

/** 初始全量同步 */
async function initialSync(sourceDir: string, targetDir: string) {
  consola.info('正在进行初始同步...');
  copyRecursive(sourceDir, targetDir);
  consola.success(`初始同步完成`);
  consola.info(`  源: ${sourceDir}`);
  consola.info(`  目标: ${targetDir}`);
}

/** 启动文件监听 */
function startWatcher(sourceDir: string, targetDir: string) {
  consola.info('开始监听文件变化...');

  watch(sourceDir, { recursive: true }, (_event, filename) => {
    if (!filename) return;

    const relativePath = filename.replace(/\\/g, '/');
    const sourcePath = join(sourceDir, relativePath);
    const targetPath = join(targetDir, relativePath);

    // 防抖，避免保存时多次触发
    if (pending.has(relativePath)) clearTimeout(pending.get(relativePath));

    pending.set(
      relativePath,
      setTimeout(() => {
        pending.delete(relativePath);

        try {
          if (!existsSync(sourcePath)) {
            // 文件/目录被删除
            if (existsSync(targetPath)) {
              rmSync(targetPath, { recursive: true, force: true });
              consola.info(`删除: ${relativePath}`);
            }
          } else if (statSync(sourcePath).isFile()) {
            // 文件新增或修改
            mkdirSync(dirname(targetPath), { recursive: true });
            copyFileSync(sourcePath, targetPath);
            consola.info(`同步: ${relativePath}`);
          } else if (statSync(sourcePath).isDirectory()) {
            // 目录新增
            mkdirSync(targetPath, { recursive: true });
          }
        } catch (err: any) {
          consola.warn(`处理失败 ${relativePath}: ${err.message}`);
        }
      }, DEBOUNCE_MS),
    );
  });
}

async function main() {
  const { sourceDir, targetDir } = getConfigPaths();

  mkdirSync(targetDir, { recursive: true });

  // 1. 先全量同步一次
  await initialSync(sourceDir, targetDir);

  // 2. 监听变化增量同步
  startWatcher(sourceDir, targetDir);

  // 3. 保持进程运行
  consola.info('按 Ctrl+C 停止监听');
  process.on('SIGINT', () => {
    consola.info('停止监听');
    process.exit(0);
  });
}

main().catch(consola.error);
