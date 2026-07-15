import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/server/**', // 集成测试需单独启动 server 后运行
    ],
  },
});
