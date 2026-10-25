# 博饼音频资源

本地电子合成，国风轻快、无人声，包含 3 首背景乐和 19 个短音效。所有拨弦、笛音、骰子及瓷碗声音均为模拟合成，不是实录或真实乐器采样。不使用外部音源，不需要 API 密钥。

- `manifest.json`：稳定资源 key、实际 URL、时长、文件摘要及来源。
- `index.html`：使用浏览器原生音频控件逐项试听；背景乐开启循环，默认不自动播放。
- `bgm-*.mp3`：44.1 kHz 立体声、160 kbps，约 55–65 秒。
- 其余 `.wav`：44.1 kHz、16 bit 立体声 PCM，短音效避免有损编码带来的起音延迟。

在项目根目录运行 `npm run dev` 后打开 `/audio/`。该目录可以作为静态资源独立使用。游戏尚未接入这些文件；接入 GitHub Pages 时应通过 `import.meta.env.BASE_URL` 拼接清单中的路径，避免忽略 `/bobing/` 部署前缀。

## 重新生成

需要 Python 3、NumPy、FFmpeg；网站运行不需要这些工具。

```sh
python3 scripts/generate-audio.py
python3 scripts/verify-audio.py
```

生成脚本使用固定乐谱与随机种子；在相同工具环境中可重复生成。清单和试听页由脚本一并生成。验证结果写到 `docs/audio-verification.json`。

背景乐在合成时环绕混入声尾，并检查编码后解码采样的循环边界。实际浏览器的 MP3 循环调度仍可能产生间隔，正式接入时宜解码为 AudioBuffer 后循环。技术检查不代替实际试听。
