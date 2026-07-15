import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** CLI 配置项 */
export interface CliConfig {
  provider: string;
  model?: string;
  outputDir: string;
  layoutDirection: 'LR' | 'TB';
  verbose: boolean;
  quiet: boolean;
}

/** API Key 环境变量名映射 */
const API_KEY_ENV_MAP: Record<string, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  hunyuan: 'HUNYUAN_API_KEY',
};

/** 默认配置 */
const DEFAULTS: CliConfig = {
  provider: 'openai',
  outputDir: '.',
  layoutDirection: 'LR',
  verbose: false,
  quiet: false,
};

/**
 * 尝试从 cwd 加载 `speakdraw.config.json`（可选）。
 * 文件不存在时返回空对象，不抛错。
 */
function loadConfigFile(cwd: string): Partial<CliConfig> {
  try {
    const raw = readFileSync(resolve(cwd, 'speakdraw.config.json'), 'utf-8');
    return JSON.parse(raw) as Partial<CliConfig>;
  } catch {
    return {};
  }
}

/**
 * 从环境变量读取配置。
 */
function loadEnvConfig(): Partial<CliConfig> {
  const cfg: Partial<CliConfig> = {};
  if (process.env['SPEAKDRAW_PROVIDER']) cfg.provider = process.env['SPEAKDRAW_PROVIDER'];
  if (process.env['SPEAKDRAW_MODEL']) cfg.model = process.env['SPEAKDRAW_MODEL'];
  if (process.env['SPEAKDRAW_OUTPUT_DIR']) cfg.outputDir = process.env['SPEAKDRAW_OUTPUT_DIR'];
  if (process.env['SPEAKDRAW_DIRECTION']) {
    const dir = process.env['SPEAKDRAW_DIRECTION'];
    if (dir === 'LR' || dir === 'TB') cfg.layoutDirection = dir;
  }
  return cfg;
}

/**
 * 加载完整配置，优先级（低→高）：
 * 默认值 → speakdraw.config.json → 环境变量 → CLI flags
 *
 * @param cliFlags - 命令行传入的标志
 * @returns 合并后的配置
 */
export function loadConfig(cliFlags?: Partial<CliConfig>): CliConfig {
  const fileConfig = loadConfigFile(process.cwd());
  const envConfig = loadEnvConfig();
  return { ...DEFAULTS, ...fileConfig, ...envConfig, ...cliFlags };
}

/**
 * 按 provider 名称读取对应的 API Key 环境变量。
 *
 * @param provider - LLM provider 名称（openai / anthropic / deepseek / hunyuan）
 * @returns API Key 字符串，未配置时返回 undefined
 */
export function parseEnvApiKey(provider: string): string | undefined {
  const envVar = API_KEY_ENV_MAP[provider.toLowerCase()];
  if (!envVar) return undefined;
  return process.env[envVar];
}
