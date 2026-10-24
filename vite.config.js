import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Pages 使用仓库名作为子目录，相对路径也兼容本地预览。
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  test: {
    // 纯逻辑测试默认在 node 下运行;组件测试在文件头用 `// @vitest-environment jsdom` 切换
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}', 'scripts/**/*.test.{js,mjs}'],
    setupFiles: ['./src/test-setup.js'],
  },
});
