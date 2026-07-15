#!/usr/bin/env node

/**
 * ESM 模块解析校验脚本
 *
 * 校验项目中所有可能导致 Node.js ESM 运行时解析失败的常见问题：
 *   1. 相对导入缺 .js 扩展名
 *   2. package.json main/exports 指向 .ts 源码而非 dist/ 输出
 *   3. 无 exports 映射的第三方包子路径导入缺扩展名
 *   4. 编译后入口文件的运行时导入可解析性
 *
 * 用法:
 *   node scripts/validate-esm.mjs [--fix] [--check-runtime]
 *
 *   --fix            尝试自动修复问题（添加扩展名等）
 *   --check-runtime  编译后尝试验证运行时模块解析（需要先 build）
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, relative, basename, join } from 'node:path';
import { globSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// ---------------------------------------------------------------------------
// 配置
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

/** 需要检查的包目录（monorepo packages） */
const PACKAGE_DIRS = ['packages/shared', 'packages/core', 'packages/mcp-server'];

/** 已知无 exports 映射、需要完整子路径导入的第三方包（扩展名白名单检查） */
const KNOWN_NO_EXPORTS_PACKAGES = [
  'elkjs',
];

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

function log(level, msg) {
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'ok' ? '✅' : '  ';
  const method = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
  console[method](`${prefix} ${msg}`);
}

function findFiles(pattern, cwd) {
  const files = [];
  const entries = globSync(pattern, { cwd });
  for (const entry of entries) {
    if (!entry.includes('node_modules') && !entry.includes('/dist/')) {
      files.push(resolve(cwd, entry));
    }
  }
  return files;
}

/** 提取文件中的 import/export from 语句 */
function extractImports(content) {
  const results = [];
  // 匹配: import ... from '...'  /  export ... from '...'
  // 也匹配: import('...') 动态导入
  const importRegex = /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
  const dynamicRegex = /import\(['"]([^'"]+)['"]\)/g;

  let m;
  while ((m = importRegex.exec(content)) !== null) {
    results.push(m[1]);
  }
  while ((m = dynamicRegex.exec(content)) !== null) {
    results.push(m[1]);
  }
  return results;
}

/** 判断导入路径是否为相对路径 */
function isRelative(p) {
  return p.startsWith('./') || p.startsWith('../');
}

// ---------------------------------------------------------------------------
// 校验 1: 相对导入必须有 .js 扩展名
// ---------------------------------------------------------------------------

function checkRelativeImports(packageDir, fix = false) {
  const srcDir = resolve(ROOT, packageDir, 'src');
  if (!existsSync(srcDir)) return { errors: [], fixed: 0 };

  const tsFiles = findFiles('**/*.ts', srcDir)
    .filter(f => !f.includes('.test.') && !f.includes('.spec.') && !f.endsWith('.d.ts'));

  const errors = [];
  const filesToFix = [];
  let fixed = 0;

  for (const file of tsFiles) {
    const content = readFileSync(file, 'utf8');
    const imports = extractImports(content);

    for (const imp of imports) {
      if (!isRelative(imp)) continue;

      // 相对导入必须有 .js 扩展名（Node ESM 要求）
      if (!imp.endsWith('.js') && !imp.endsWith('.json') && !imp.endsWith('.mjs')) {
        const rel = relative(ROOT, file);
        const lineContent = content.split('\n').find(l => l.includes(`'${imp}'`) || l.includes(`"${imp}"`))?.trim();

        // 判断是否为 barrel 目录导入（路径不含扩展名、对应目录存在 index.ts）
        const barrel = imp.replace(/\/$/, '');
        const barrelDir = resolve(dirname(file), barrel);
        const hasIndex = existsSync(resolve(barrelDir, 'index.ts'));

        errors.push({
          file: rel,
          import: imp,
          isBarrel: hasIndex,
          snippet: lineContent?.substring(0, 80),
        });
        filesToFix.push(file);
      }
    }
  }

  if (fix && filesToFix.length > 0) {
    const uniqueFiles = [...new Set(filesToFix)];
    for (const file of uniqueFiles) {
      let content = readFileSync(file, 'utf8');
      const imports = extractImports(content);
      let changed = false;

      for (const imp of imports) {
        if (!isRelative(imp)) continue;
        if (imp.endsWith('.js') || imp.endsWith('.json') || imp.endsWith('.mjs')) continue;

        const barrelDir = resolve(dirname(file), imp);
        const hasIndex = existsSync(resolve(barrelDir, 'index.ts'));
        const newPath = hasIndex ? `${imp}/index.js` : `${imp}.js`;
        const escOld = imp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // 修复 from '...' 静态导入
        const fromRegex = new RegExp(`(from\\s+['"])${escOld}(['"])`, 'g');
        const new1 = content.replace(fromRegex, `$1${newPath}$2`);
        if (new1 !== content) { content = new1; changed = true; }

        // 修复 import('...') 动态导入
        const dynamicRegex = new RegExp(`(import\\(['"])${escOld}(['"]\\))`, 'g');
        const new2 = content.replace(dynamicRegex, `$1${newPath}$2`);
        if (new2 !== content) { content = new2; changed = true; }
      }

      if (changed) {
        writeFileSync(file, content);
        fixed++;
      }
    }
  }

  return { errors, fixed };
}

// ---------------------------------------------------------------------------
// 校验 2: package.json main/exports 必须指向 dist/ 编译输出
// ---------------------------------------------------------------------------

function checkPackageExports(packageDir) {
  const pkgPath = resolve(ROOT, packageDir, 'package.json');
  if (!existsSync(pkgPath)) return [];

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const errors = [];

  const checkField = (field, value) => {
    if (!value) return;
    if (typeof value === 'string') {
      if (value.startsWith('./src/')) {
        errors.push(`"${field}" 指向源码: "${value}" → 应改为 "./dist/${value.replace('./src/', '')}"`);
      }
    } else if (typeof value === 'object') {
      // 递归检查对象结构
      for (const [key, val] of Object.entries(value)) {
        checkField(`${field}.${key}`, val);
      }
    }
  };

  // 只对非 private 包或 typescript 默认配置检查（所有 monorepo 内包）
  if (pkg.main) checkField('main', pkg.main);
  if (pkg.types) checkField('types', pkg.types);
  if (pkg.exports) checkField('exports', pkg.exports);

  return errors;
}

// ---------------------------------------------------------------------------
// 校验 3: 无 exports 映射的第三方包子路径导入必须有扩展名
// ---------------------------------------------------------------------------

function checkThirdPartySubpathImports(packageDir) {
  const srcDir = resolve(ROOT, packageDir, 'src');
  if (!existsSync(srcDir)) return [];

  const tsFiles = findFiles('**/*.ts', srcDir)
    .filter(f => !f.endsWith('.d.ts'));

  const errors = [];

  for (const file of tsFiles) {
    const content = readFileSync(file, 'utf8');
    const imports = extractImports(content);

    for (const imp of imports) {
      if (isRelative(imp)) continue;
      if (imp.startsWith('@')) continue;  // scoped packages typically have exports
      if (imp.startsWith('node:')) continue;

      // 检查是否从已知无 exports 的包导入子路径且缺扩展名
      for (const pkgName of KNOWN_NO_EXPORTS_PACKAGES) {
        if (imp.startsWith(pkgName + '/') && !imp.endsWith('.js') && !imp.endsWith('.mjs')) {
          const rel = relative(ROOT, file);
          const lineContent = content.split('\n').find(l => l.includes(`'${imp}'`) || l.includes(`"${imp}"`))?.trim();
          errors.push({
            file: rel,
            import: imp,
            snippet: lineContent?.substring(0, 80),
          });
        }
      }
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// 校验 4 (可选): 编译后运行时模块解析
// ---------------------------------------------------------------------------

async function checkRuntimeResolution() {
  const results = [];
  const checkOrder = ['packages/shared', 'packages/core', 'packages/mcp-server'];

  for (const packageDir of checkOrder) {
    const distIndex = resolve(ROOT, packageDir, 'dist', 'index.js');
    if (!existsSync(distIndex)) {
      results.push({ package: packageDir, ok: false, error: `dist/index.js 未找到，请先运行 build` });
      continue;
    }

    try {
      execSync(`node -e "import('${distIndex}').then(()=>process.exit(0)).catch(()=>process.exit(0))"`, {
        cwd: ROOT,
        timeout: 5000,
        stdio: 'pipe',
        env: { ...process.env, NODE_OPTIONS: '--no-warnings' },
      });
      results.push({ package: packageDir, ok: true });
    } catch (e) {
      const stderr = e.stderr?.toString() || '';
      const msgMatch = stderr.match(/ERR_MODULE_NOT_FOUND[^\n]*/);
      results.push({
        package: packageDir,
        ok: false,
        error: msgMatch ? msgMatch[0] : stderr.substring(0, 200),
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');
  const checkRuntime = args.includes('--check-runtime');

  console.log('🔍 ESM 模块解析校验\n');
  let totalErrors = 0;
  let totalFixed = 0;

  // --- Check 1: Relative imports extensions ---
  console.log('━'.repeat(60));
  console.log('检查 1: 相对导入 .js 扩展名\n');
  for (const pkg of PACKAGE_DIRS) {
    const { errors, fixed: f } = checkRelativeImports(pkg, fix);
    totalFixed += f;
    if (errors.length === 0 && f === 0) {
      log('ok', `${pkg} — 全部正常`);
    } else {
      for (const err of errors) {
        const label = err.isBarrel ? '（barrel 目录 → 需 /index.js）' : '';
        log('error', `${err.file}: "${err.import}" 缺少 .js 扩展名 ${label}`);
        if (err.snippet) console.log(`        ${err.snippet}`);
        totalErrors++;
      }
      if (f > 0) {
        log('ok', `${pkg} — 已自动修复 ${f} 个文件`);
      }
    }
  }

  // --- Check 2: package.json exports ---
  console.log('\n' + '━'.repeat(60));
  console.log('检查 2: package.json main/exports 指向 dist/\n');
  for (const pkg of PACKAGE_DIRS) {
    const errors = checkPackageExports(pkg);
    if (errors.length === 0) {
      log('ok', `${pkg}/package.json — 全部正常`);
    } else {
      for (const err of errors) {
        log('error', `${pkg}/package.json: ${err}`);
        totalErrors++;
      }
    }
  }

  // --- Check 3: Third-party subpath imports ---
  console.log('\n' + '━'.repeat(60));
  console.log('检查 3: 无 exports 映射的第三方包子路径导入\n');
  let check3Errors = 0;
  for (const pkg of PACKAGE_DIRS) {
    const errors = checkThirdPartySubpathImports(pkg);
    if (errors.length === 0) {
      log('ok', `${pkg} — 全部正常`);
    } else {
      for (const err of errors) {
        log('error', `${err.file}: "${err.import}" 缺少扩展名（${KNOWN_NO_EXPORTS_PACKAGES.find(k => err.import.startsWith(k + '/'))} 无 exports 映射）`);
        if (err.snippet) console.log(`        ${err.snippet}`);
        check3Errors++;
        totalErrors++;
      }
    }
  }

  // --- Check 4 (optional): Runtime resolution ---
  if (checkRuntime) {
    console.log('\n' + '━'.repeat(60));
    console.log('检查 4: 编译后运行时模块解析\n');
    const results = await checkRuntimeResolution();
    for (const r of results) {
      if (r.ok) {
        log('ok', `${r.package} — 解析成功`);
      } else {
        log('error', `${r.package}: ${r.error}`);
        totalErrors++;
      }
    }
  }

  // --- Summary ---
  console.log('\n' + '━'.repeat(60));
  if (totalErrors === 0) {
    console.log('✅ 全部检查通过！ESM 模块解析配置正确。');
    if (totalFixed > 0) {
      console.log(`   (已自动修复 ${totalFixed} 个文件)`);
    }
    if (!checkRuntime) {
      console.log('   💡 提示：使用 --check-runtime 可额外验证编译后运行时解析。');
    }
    process.exit(0);
  } else {
    console.log(`❌ 发现 ${totalErrors} 个问题。`);
    if (!fix && checkRelativeImports(PACKAGE_DIRS[0]).errors.length > 0) {
      console.log('   💡 使用 --fix 可自动修复相对导入扩展名问题。');
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('脚本执行失败:', e);
  process.exit(2);
});
