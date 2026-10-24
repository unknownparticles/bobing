# 博饼 · 今晚谁是状元

六颗骰子，五位同事，围坐一桌争状元。使用 React 和 Vite 构建，支持电脑和手机浏览器。

在线游玩：[unknownparticles.github.io/bobing](https://unknownparticles.github.io/bobing/)

## 本地运行

需要 Node.js 24.15 或更新的 24.x 版本。

```sh
npm ci
npm run dev
```

## 验证与构建

```sh
npm test
npm run build
npm run preview
```

## 发布

推送到 `main` 分支后，GitHub Actions 会运行测试、构建静态网站并发布到 GitHub Pages。
首次发布需在仓库的 **Settings → Pages → Source** 中选择 **GitHub Actions**。
构建资源采用相对路径，支持 GitHub Pages 的 `/bobing/` 子目录。
