import ora, { type Ora } from 'ora';
import chalk from 'chalk';

export interface LoggerOptions {
  verbose: boolean;
  quiet: boolean;
  stdout?: NodeJS.WriteStream;
}

export interface CliLogger {
  /** 普通信息（quiet 模式下不输出） */
  info(message: string): void;
  /** 成功信息（绿色） */
  success(message: string): void;
  /** 警告信息（黄色） */
  warn(message: string): void;
  /** 错误信息（红色，stderr） */
  error(message: string): void;
  /** 仅 verbose 模式输出 */
  verbose(message: string): void;
  /** 原始输出（quiet 模式下仍输出，用于管道） */
  raw(message: string): void;
  /** 启动 spinner（quiet 模式返回 null） */
  startSpinner(text: string): Ora | null;
  /** 停止 spinner */
  stopSpinner(spinner: Ora | null, successText?: string): void;
}

/**
 * 创建 CLI 日志记录器实例。
 *
 * 支持普通模式、verbose（调试）模式和 quiet（静默）模式。
 * quiet 模式下仅 `raw()` 和 `error()` 会输出，
 * verbose 模式额外输出 `verbose()` 消息。
 *
 * @param options - 日志选项
 * @returns CliLogger 实例
 */
export function createLogger(options: LoggerOptions): CliLogger {
  const { verbose, quiet } = options;
  const stdout = options.stdout ?? process.stdout;

  return {
    info(message: string): void {
      if (quiet) return;
      stdout.write(`${message}\n`);
    },

    success(message: string): void {
      if (quiet) return;
      stdout.write(`${chalk.green('✓')} ${message}\n`);
    },

    warn(message: string): void {
      if (quiet) return;
      stdout.write(`${chalk.yellow('⚠')} ${message}\n`);
    },

    error(message: string): void {
      process.stderr.write(`${chalk.red('✗')} ${message}\n`);
    },

    verbose(message: string): void {
      if (!verbose) return;
      stdout.write(`${chalk.dim(message)}\n`);
    },

    raw(message: string): void {
      stdout.write(message);
    },

    startSpinner(text: string): Ora | null {
      if (quiet) return null;
      const spinner = ora({ text, color: 'cyan' }).start();
      return spinner;
    },

    stopSpinner(spinner: Ora | null, successText?: string): void {
      if (!spinner) return;
      if (successText) {
        spinner.succeed(successText);
      } else {
        spinner.stop();
      }
    },
  };
}
