#!/usr/bin/env node
import { Command } from 'commander';
import { runGenerate } from './commands/generate';
import { runValidate } from './commands/validate';
import { runExport } from './commands/export';
import { runLayoutOnly } from './commands/layout-only';

const program = new Command();

program
  .name('ai-diagram')
  .description('AI-powered diagram generation — 自然语言 → .drawio')
  .version('0.1.0')
  .exitOverride();

/** 统一的退出码，由各命令的 action 设置，顶层 main() 统一退出 */
let cliExitCode = 0;

// generate 命令
program
  .command('generate [description]')
  .description('从自然语言描述生成 .drawio 文件')
  .option('-f, --file <path>', '从文件读取描述文本')
  .option('-o, --output <path>', '输出文件路径（默认: diagram.drawio）')
  .option('-p, --provider <name>', 'LLM provider (openai/anthropic/deepseek/hunyuan)', 'openai')
  .option('-m, --model <name>', '模型名称')
  .option('--verbose', '输出详细中间结果（IR JSON、布局信息）', false)
  .option('-q, --quiet', '静默模式，仅输出最终文件路径', false)
  .action(async (description: string | undefined, options: Record<string, unknown>) => {
    cliExitCode = await runGenerate(description ?? '', {
      file: options['file'] as string | undefined,
      output: options['output'] as string | undefined,
      provider: options['provider'] as string,
      model: options['model'] as string | undefined,
      verbose: Boolean(options['verbose']),
      quiet: Boolean(options['quiet']),
    });
  });

// validate 命令
program
  .command('validate <file>')
  .description('对 .drawio 文件做静态几何校验')
  .option('-t, --tolerance <px>', 'AABB 容忍误差（默认 1px）', parseInt)
  .option('--label-check', '启用标签溢出检测', false)
  .option('--verbose', '输出详细冲突信息', false)
  .option('-q, --quiet', '静默模式', false)
  .action(async (file: string, options: Record<string, unknown>) => {
    cliExitCode = await runValidate(file, {
      tolerance: options['tolerance'] as number | undefined,
      enableLabelCheck: Boolean(options['labelCheck']),
      verbose: Boolean(options['verbose']),
      quiet: Boolean(options['quiet']),
    });
  });

// export 命令
program
  .command('export <file>')
  .description('导出 .drawio 为 PNG/SVG（Phase 3 完整支持）')
  .option('-f, --format <fmt>', '导出格式 (png/svg)', 'png')
  .option('-o, --output <path>', '输出文件路径')
  .option('--verbose', '详细输出', false)
  .option('-q, --quiet', '静默模式', false)
  .action(async (file: string, options: Record<string, unknown>) => {
    const format = options['format'] as string;
    if (format !== 'png' && format !== 'svg') {
      process.stderr.write(`错误: 不支持的格式 "${format}"，仅支持 png/svg\n`);
      cliExitCode = 1;
      return;
    }
    cliExitCode = await runExport(file, {
      format: format as 'png' | 'svg',
      output: options['output'] as string | undefined,
      verbose: Boolean(options['verbose']),
      quiet: Boolean(options['quiet']),
    });
  });

// layout-only 命令
program
  .command('layout-only <ir-file>')
  .description('从 IR JSON 文件直接生成 .drawio（跳过 LLM）')
  .option('-o, --output <path>', '输出文件路径（默认: 同目录同名 .drawio）')
  .option('-d, --direction <dir>', '布局方向 (LR/TB)', 'LR')
  .option('--verbose', '输出 IR 详细信息', false)
  .option('-q, --quiet', '静默模式', false)
  .action(async (irFile: string, options: Record<string, unknown>) => {
    const direction = options['direction'] as string;
    if (direction !== 'LR' && direction !== 'TB') {
      process.stderr.write(`错误: 不支持的布局方向 "${direction}"，仅支持 LR/TB\n`);
      cliExitCode = 1;
      return;
    }
    cliExitCode = await runLayoutOnly(irFile, {
      output: options['output'] as string | undefined,
      direction: direction as 'LR' | 'TB',
      verbose: Boolean(options['verbose']),
      quiet: Boolean(options['quiet']),
    });
  });

// 无参数时显示帮助
if (process.argv.length <= 2) {
  program.outputHelp();
  process.exit(0);
}

async function main(): Promise<void> {
  try {
    await program.parseAsync();
    process.exit(cliExitCode);
  } catch (err: unknown) {
    const e = err as { exitCode?: number; code?: string; message?: string };
    // commander 内部 help/version 显示后抛出的异常 → 正常退出
    if (e.code === 'commander.helpDisplayed' || e.code === 'commander.version') {
      process.exit(0);
    }
    process.stderr.write(`致命错误: ${e.message ?? '未知错误'}\n`);
    process.exit(e.exitCode ?? 1);
  }
}

main();
