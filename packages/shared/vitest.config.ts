import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      // 排除 barrel re-export 的 index.ts（无业务逻辑，不应计入覆盖率）
      // 注: thresholds 门禁配置按用户约定不纳入 git（与测试文件不入库保持一致），
      //     如需本地验证覆盖率，临时加回 thresholds 即可
      exclude: ['**/index.ts', '**/*.test.ts', '**/__tests__/**'],
    },
  },
});
