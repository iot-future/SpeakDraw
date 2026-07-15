import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['packages/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-server/**',
      // 集成测试需单独启动 server 后运行
      'packages/web/tests/server/**',
    ],
    coverage: {
      provider: 'v8',
      exclude: ['**/index.ts', '**/*.test.ts', '**/__tests__/**'],
    },
  },
});
