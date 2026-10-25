import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [react(), VitePWA({
    // 新版本等待旧窗口关闭后启用，避免刷新正在进行的对局。
    registerType: 'prompt',
    injectRegister: 'script',
    manifest: {
      id: './',
      name: '今晚谁是状元',
      short_name: '博饼',
      description: '六颗骰子，围坐一桌争状元。支持故事、快速和经典博饼。',
      lang: 'zh-CN',
      start_url: './',
      scope: './',
      display: 'standalone',
      background_color: '#f3eddb',
      theme_color: '#f3eddb',
      icons: [
        { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'icons/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      // 连未浏览过的角色和商店图片也一起缓存，首次安装完成即可完整离线。
      globPatterns: ['**/*.{html,js,css,svg,png,webp,ico,woff,woff2,mp3,ogg,wav,m4a}'],
      globIgnores: ['**/README.md'],
      navigateFallback: 'index.html',
      cleanupOutdatedCaches: true,
      skipWaiting: false,
      clientsClaim: true,
    },
  })],
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
