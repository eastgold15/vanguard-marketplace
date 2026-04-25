// 定义 JSON 配置的类型
/** self = 本地技能，无需同步；remote = 远程技能，需要下载合并 */
type SourceType = 'self' | 'remote';

interface SourceConfig {
  name: string;
  /** 远程仓库地址（self 类型不需要） */
  repo_url?: string;
  /** 源仓库中的子目录（如 "better-auth"） */
  resource?: string;
  /** 本地目标路径（如 "./skills/better-auth"） */
  target: string;
  branch?: string;
  /** 技能类型，self 表示纯本地技能，无需同步 */
  type?: SourceType;
}

interface Settings {
  base_path?: string;
  soft_link: SoftLinkConfig;
}

interface RootConfig {
  settings: Settings;
  sources: SourceConfig[];
}


// 软链接配置
interface SoftLinkConfig {
  /** 扫描的 glob 模式列表 */
  include: string[];
  /** 排除的 glob 模式列表 */
  exclude?: string[];
  /** 软链接目标目录（默认 ./skills） */
  target: string;
}