# 博饼完整音频包

状态：已完成本地电子合成并接入游戏。22 个音频文件包含 3 首背景乐与 19 个音效；音色均为电子模拟，无人声。

游戏使用 `src/audio.js` 统一管理播放、静音、浏览器首次交互解锁和 BGM 淡入淡出；`src/game/useGameAudio.js` 根据已提交的游戏状态与骰子动画触发音效，避免非法点击误播。首页、角色设置、剧情与图鉴使用首页音乐，对局与结算使用桌面音乐，轮间商店切换商店音乐。掷骰、落定、发奖、状元、卡牌攻防与转移、神明、场地、购买刷新、轮末和终局均已建立触发映射。

`public/audio/` 下的资源会由 Vite/PWA 构建复制并预缓存；运行测试覆盖自动播放解锁、静音、曲目切换和视觉事件映射。

用户已确认：完整包，国风轻快，骰子与瓷碗实录感、木质按钮声、古筝与笛子配轻打击乐，全包无人声。

实际资源位于 `public/audio/`，总计约 7.31 MiB。稳定 key 与文件摘要见 `public/audio/manifest.json`；试听页为 `public/audio/index.html`。下表列出实际文件名和时长。

| 资源 key | 实际文件名 | 用途与声音要求 | 实际时长 |
| --- | --- | --- | --- |
| `bgm.home` | `bgm-home.mp3` | 首页：温暖古筝、笛子，轻快迎客，避免强烈开场 | 65.45 秒 |
| `bgm.table` | `bgm-table.mp3` | 对局：古筝、琵琶与轻木鱼，约 96 BPM，给音效留出空间 | 60.00 秒 |
| `bgm.shop` | `bgm-shop.mp3` | 商店：俏皮拨弦、小打击乐，轻松挑选商品 | 55.38 秒 |
| `sfx.dice.roll` | `dice-roll.wav` | 多颗骰子在瓷碗内滚动碰撞，节奏自然，无背景乐 | 1.20 秒 |
| `sfx.dice.settle` | `dice-settle.wav` | 骰子最后几次清脆碰撞并停稳，无背景乐 | 0.50 秒 |
| `sfx.reward.win` | `reward-win.wav` | 短促明亮的上行拨弦，普通中奖反馈 | 1.20 秒 |
| `sfx.reward.champion` | `reward-champion.wav` | 古筝上行、明亮小锣与轻鼓，状元庆祝 | 3.00 秒 |
| `sfx.ui.click` | `ui-click.wav` | 柔和干净的短木质敲击，适合频繁点击 | 0.12 秒 |
| `sfx.ui.confirm` | `ui-confirm.wav` | 两个清脆木质音配短拨弦，确认成功 | 0.40 秒 |
| `sfx.ui.back` | `ui-back.wav` | 轻柔低木音，关闭或返回 | 0.30 秒 |
| `sfx.item.cast` | `item-cast.wav` | 纸牌轻挥与短拨弦，通用技能生效 | 0.70 秒 |
| `sfx.item.attack` | `item-attack.wav` | 短促空气划过与木质落点，干扰技能 | 0.60 秒 |
| `sfx.item.shield` | `item-shield.wav` | 温润金属泛音，防护或抵挡反馈 | 0.90 秒 |
| `sfx.item.transfer` | `item-transfer.wav` | 轻滑音与柔和落点，奖项转移或交换 | 0.90 秒 |
| `sfx.blessing.activate` | `blessing-activate.wav` | 空灵小钟与古筝短上行，神明效果生效 | 1.50 秒 |
| `sfx.field.change` | `field-change.wav` | 轻风、纸张与低鼓，场地切换 | 1.20 秒 |
| `sfx.shop.open` | `shop-open.wav` | 轻木铃与纸张展开，进入轮间小铺 | 0.80 秒 |
| `sfx.shop.buy` | `shop-buy.wav` | 少量钱币轻碰，购买成功，避免尖锐高频 | 0.70 秒 |
| `sfx.shop.refresh` | `shop-refresh.wav` | 纸牌翻动与木质短敲，商品刷新 | 0.60 秒 |
| `sfx.result.round` | `result-round.wav` | 温暖简短拨弦收束，轮次结算 | 1.80 秒 |
| `sfx.result.victory` | `result-victory.wav` | 喜庆古筝、笛子与轻鼓，整局获胜 | 4.00 秒 |
| `sfx.result.defeat` | `result-defeat.wav` | 温柔下降拨弦，轻松收尾，避免悲伤挫败感 | 2.50 秒 |

## 生成与验收要求

- 全部原创，无歌词、说话、哼唱、群众声；音效不夹带背景音乐。
- 背景乐需剪辑并实际检查循环接缝；不能仅凭提示词把文件标为可无缝循环。
- 音效开头不留明显空白，结尾保留自然衰减，避免切断声尾产生爆音。
- 保存原始生成结果及处理记录，验证文件可解码、时长合理、音量无明显削波后再纳入正式资源清单。
- 此版本全部在本地合成，不使用平台接口；骰子、瓷碗、古筝和笛音均为合成近似声。
- `python3 scripts/verify-audio.py` 已完整解码 22 个文件，时长、峰值余量、零削波和循环边界检查通过，详见 `docs/audio-verification.json`。技术检查不代表人工听感验收。

## 已验证的接口状态

- 指定 API 的模型列表可读取，列出 `suno-v4.5`、`suno-v4.5+`、`suno-v6`。
- 使用 `POST /v1/chat/completions`、`messages` 和 `stream: false` 试生成一首背景乐时，`suno-v4.5` 与 `suno-v4.5+` 均返回 HTTP 500、`suno_task_failed`，各重试一次后结果相同。
- `suno-v6` 返回 HTTP 400、`billing_expression_invalid`，重试一次后结果相同；错误码指向计费表达式，但响应没有提供进一步原因。
- HTTP 500 未提供失败原因或任务编号，不能据此断定是请求参数、账号权限或平台上游故障。
- 密钥仅从用户指定的本地文件读取，不写入项目。

### 用户提供的 chirp 模型名补测

已保持接口、提示词和其余参数一致，仅将请求中的 `model` 分别改为 `chirp-v3`、`chirp-v3-5`、`chirp-v4`、`chirp-v4-5`、`chirp-v4-5+`、`chirp-v5`。每个模型实际调用两次，全部返回 HTTP 503、`shell_api_error`，无音频或任务编号。

响应只提供 request id，没有说明是模型名、接口协议、账号路由还是上游服务导致失败。不能据此声称这些模型名不存在，也不能断定平台应把它们映射到哪些 `suno-*` 名称。

完整请求体与各模型第二次响应已保存到 [audio-api-diagnostics.json](audio-api-diagnostics.json)，不包含密钥，可据 request id 查询平台日志。

### Suno 专用任务协议重试

依据 [New API Suno 文档](https://doc.newapi.pro/en/api/suno-music/)，改用 `POST https://api.openai-next.com/suno/submit/music`，请求包含 `mv`、`gpt_description_prompt`、`make_instrumental: true`。

`chirp-v4`、`chirp-v4-5`、`chirp-v5` 各调用两次，均返回 HTTP 503、`shell_api_error`；没有任务 ID，因此无法继续查询或下载音频。请求和第二次响应已补充到诊断文件的 `suno_task_protocol` 字段。仍无法从响应判断该平台是否完整支持这份协议或失败发生在哪一层。
