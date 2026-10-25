# 网页图标与链接分享资源

用户确认沿用现有骰碗形象，补齐资源与接入。

从现有 512px 骰碗 PNG 缩制 16、32px PNG 和多尺寸 favicon.ico，不重绘图标。保留已有 SVG、Apple 触摸图标及 PWA 图标，统一网页引用的部署目录处理。

生成 1200×630 的 PNG 分享封面：米纸底色、朱红标题、青瓷骰碗，标明游戏名称、围坐博饼与故事/快速/经典三种模式。用 Pillow 排版并保存生成脚本，字体取本机已验证的宋体与黑体；可通过参数指定其他中文字体。

首页加入 Open Graph、Twitter 分享元数据及 canonical。绝对分享地址取 README 中现有的 https://unknownparticles.github.io/bobing/，本地和子目录图标仍使用 Vite BASE_URL。更换域名时明确说明需更新分享地址。

验收图标真实尺寸、ICO 多帧、封面排版与文字、生产构建和 /bobing/ 构建路径。此改动属于静态资源和 HTML 配置，不添加业务测试。
