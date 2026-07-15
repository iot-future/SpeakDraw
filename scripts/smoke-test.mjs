#!/usr/bin/env node

/**
 * 发布前烟雾测试（Smoke Test）
 *
 * 验证编译产物（dist/）在 Node.js ESM 下可正常运行。
 * 不依赖 LLM API key，只测试纯本地逻辑通路。
 *
 * 用法:
 *   node scripts/smoke-test.mjs
 *
 * 前提: 先执行 pnpm build
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// 工具
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${e.message}`);
    failed++;
  }
}

function run(cmd, opts = {}) {
  return execSync(cmd, {
    cwd: ROOT,
    timeout: 10_000,
    encoding: 'utf8',
    stdio: 'pipe',
    env: { ...process.env, NODE_OPTIONS: '--no-warnings' },
    ...opts,
  });
}

// ---------------------------------------------------------------------------
// 测试
// ---------------------------------------------------------------------------

console.log('🔥 发布前烟雾测试\n');

// ── 1. 编译产物存在性 ────────────────────────────────────────────
console.log('1. 编译产物存在性');

test('shared/dist/index.js 存在', () => {
  const p = resolve(ROOT, 'packages/shared/dist/index.js');
  if (!existsSync(p)) throw new Error(`文件不存在: ${p}`);
});

test('core/dist/index.js 存在', () => {
  const p = resolve(ROOT, 'packages/core/dist/index.js');
  if (!existsSync(p)) throw new Error(`文件不存在: ${p}`);
});

test('cli/dist/index.js 存在', () => {
  const p = resolve(ROOT, 'packages/cli/dist/index.js');
  if (!existsSync(p)) throw new Error(`文件不存在: ${p}`);
});

test('mcp-server/dist/index.js 存在', () => {
  const p = resolve(ROOT, 'packages/mcp-server/dist/index.js');
  if (!existsSync(p)) throw new Error(`文件不存在: ${p}`);
});

// ── 2. 模块运行时导入 ─────────────────────────────────────────────
console.log('\n2. 模块运行时导入');

test('@speakdraw/shared 可导入', () => {
  const distPath = resolve(ROOT, 'packages/shared/dist/index.js');
  run(`node -e "import('${distPath}').then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1)})"`);
});

test('@speakdraw/core 可导入', () => {
  const distPath = resolve(ROOT, 'packages/core/dist/index.js');
  run(`node -e "import('${distPath}').then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1)})"`);
});

// ── 3. CLI 功能 ────────────────────────────────────────────────────
console.log('\n3. CLI 功能');

test('speakdraw --help 正常输出', () => {
  const out = run('node packages/cli/dist/index.js --help', { env: { ...process.env, FORCE_COLOR: '0' } });
  if (!out.includes('Usage: speakdraw') || !out.includes('generate')) {
    throw new Error(`help 输出不完整: ${out.substring(0, 100)}`);
  }
});

test('speakdraw generate（无 API key）可走到业务逻辑层', () => {
  // 预期: 报缺少 API key 错误（非模块解析错误），证明代码路径走到业务层
  try {
    run('node packages/cli/dist/index.js generate "hello" --provider openai',
      { env: { ...process.env, OPENAI_API_KEY: '' } });
  } catch (e) {
    const stderr = (e.stderr || e.message || '').toString();
    // 确认不是模块解析错误
    if (stderr.includes('ERR_MODULE_NOT_FOUND')) {
      throw new Error(`模块解析错误，不应该: ${stderr.substring(0, 200)}`);
    }
    if (stderr.includes('ERR_UNSUPPORTED_DIR_IMPORT')) {
      throw new Error(`目录导入错误，不应该: ${stderr.substring(0, 200)}`);
    }
    // 预期: API key 相关错误
    if (!stderr.includes('KEY') && !stderr.includes('key') && !stderr.includes('API')) {
      throw new Error(`非预期错误: ${stderr.substring(0, 200)}`);
    }
  }
});

test('speakdraw validate 可走到业务逻辑层', () => {
  // 不带任何参数 — 预期 commander 报参数错误，非模块解析错误
  try {
    run('node packages/cli/dist/index.js validate',
      { env: { ...process.env, FORCE_COLOR: '0' } });
  } catch (e) {
    const stderr = (e.stderr || e.message || '').toString();
    if (stderr.includes('ERR_MODULE_NOT_FOUND')) {
      throw new Error(`模块解析错误: ${stderr.substring(0, 200)}`);
    }
    // 预期: commander 参数错误
    if (!stderr.includes('missing required argument') && !stderr.includes('error')) {
      throw new Error(`非预期输出: ${stderr.substring(0, 200)}`);
    }
  }
});

// ── 4. MCP Server 可导入 ───────────────────────────────────────────
console.log('\n4. MCP Server');

test('@speakdraw/mcp-server 可导入', () => {
  const distPath = resolve(ROOT, 'packages/mcp-server/dist/index.js');
  run(`node -e "import('${distPath}').then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1)})"`);
});

// ── 结果 ───────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(50)}`);
const total = passed + failed;
console.log(`结果: ${passed}/${total} 通过`);

if (failed > 0) {
  console.log('❌ 烟雾测试失败，请修复后重试。');
  process.exit(1);
}

console.log('✅ 所有烟雾测试通过！编译产物可正常运行。');
