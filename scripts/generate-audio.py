"""离线合成博饼音频包；需要 NumPy、FFmpeg，不调用网络或读取密钥。"""

import hashlib
import html
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import wave

import numpy as np


RATE = 44100
ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'public' / 'audio'
RNG = np.random.default_rng(20261024)


def pitch(note):
    """把 MIDI 音高转换成 Hz；仅用于本脚本内的固定乐谱。"""
    return 440 * 2 ** ((note - 69) / 12)


def tone(frequency, duration, voice='pluck'):
    """合成带自然衰减的单音；所有音色都是电子模拟。"""
    t = np.arange(round(duration * RATE)) / RATE
    attack = 1 - np.exp(-t / .004)
    if voice == 'flute':
        phase = 2 * np.pi * frequency * t + .025 * np.sin(2 * np.pi * 5 * t)
        sound = np.sin(phase) + .16 * np.sin(2 * phase) + .035 * np.sin(3 * phase)
        envelope = (1 - np.exp(-t / .065)) * np.minimum((duration - t) / .14, 1)
        return sound * envelope * .62
    if voice == 'bell':
        sound = sum(weight * np.sin(2 * np.pi * frequency * ratio * t) * np.exp(-t * decay)
                    for ratio, weight, decay in ((1, 1, 4), (2.76, .25, 7), (5.4, .09, 12)))
    elif voice == 'wood':
        sound = np.sin(2 * np.pi * frequency * t) * np.exp(-t * 55)
        sound += .4 * np.sin(2 * np.pi * frequency * 2.3 * t) * np.exp(-t * 85)
    else:
        # 高频泛音衰减更快，模拟拨弦后由清脆转为温暖的声尾。
        sound = sum(np.sin(2 * np.pi * frequency * harmonic * t)
                    * np.exp(-t * (2.6 + harmonic * 1.8)) / harmonic ** 1.35
                    for harmonic in range(1, 8))
        sound += .12 * np.sin(2 * np.pi * frequency * 1.002 * t) * np.exp(-t * 4)
    release = np.minimum((duration - t) / .035, 1)
    return sound * attack * release


def noise(duration, decay=8):
    """带淡入和衰减的噪声，用于纸张、风声和轻打击。"""
    t = np.arange(round(duration * RATE)) / RATE
    samples = RNG.standard_normal(len(t))
    samples = np.convolve(samples, np.ones(5) / 5, mode='same')
    return samples * (1 - np.exp(-t / .003)) * np.exp(-decay * t) * np.minimum((duration - t) / .03, 1)


def mix(track, sound, start, gain=1, pan=0, loop=False):
    """把单声道混入立体声；循环编曲把越界声尾绕回起点以保持连续。"""
    position = round(start * RATE)
    stereo = sound[:, None] * np.array([np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)]) * gain
    if loop:
        indices = (np.arange(len(sound)) + position) % len(track)
        np.add.at(track, indices, stereo)
    else:
        count = min(len(sound), len(track) - position)
        if count > 0:
            track[position:position + count] += stereo[:count]


def track_for(duration):
    """按秒创建浮点立体声工作缓冲。"""
    return np.zeros((round(duration * RATE), 2), dtype=np.float64)


def music(theme):
    """用固定五声音阶乐谱制作 24 小节循环；返回音频与节拍信息。"""
    bpm = {'home': 88, 'table': 96, 'shop': 104}[theme]
    beat = 60 / bpm
    track = track_for(24 * 4 * beat)
    # 每个数字是一拍，-1 表示休止；重复时改变配器，保留可辨认的旋律。
    motifs = (
        (0, 2, 3, 2), (1, 0, -1, 1), (2, 4, 3, 2), (1, 0, -1, -1),
        (3, 4, 5, 4), (3, 2, 1, -1), (2, 1, 3, 1), (0, -1, -1, -1),
    )
    scale = (62, 64, 66, 69, 71, 74)
    chords = ((50, 57, 62, 66), (47, 54, 59, 62), (43, 50, 57, 62), (45, 52, 57, 64))
    shift = {'home': 0, 'table': 2, 'shop': 4}[theme]
    for bar in range(24):
        start = bar * 4 * beat
        chord = chords[(bar // 2) % len(chords)]
        mix(track, tone(pitch(chord[0]), 2.5), start, .17, -.1, True)
        for eighth in range(8):
            note = chord[1 + eighth % 3] + (12 if theme == 'shop' and eighth % 2 else 0)
            mix(track, tone(pitch(note), 1.5), start + eighth * beat / 2,
                .12 if eighth % 2 == 0 else .075, (-1) ** eighth * .38, True)
        for step, degree in enumerate(motifs[(bar + shift) % 8]):
            if degree < 0:
                continue
            note = scale[degree]
            voice = 'flute' if theme != 'shop' and bar % 8 < 4 else 'pluck'
            duration = beat * .85 if voice == 'flute' else 1.4
            mix(track, tone(pitch(note), duration, voice), start + step * beat,
                .15 if voice == 'flute' else .23, .16, True)
        # 木质切分点保持轻巧，避免反复掷骰时音乐压过游戏音效。
        for offset in (1, 3):
            mix(track, tone(700 if theme == 'shop' else 540, .15, 'wood'),
                start + offset * beat, .055, -.35, True)
        if bar % 2:
            mix(track, noise(.09, 55), start + 3.5 * beat, .035, .5, True)
    dry = track.copy()
    # 按整首周期环绕的短延迟同时保留起点和终点的混响状态。
    for seconds, gain in ((.079, .11), (.151, .065)):
        track += np.roll(dry[:, ::-1], round(seconds * RATE), axis=0) * gain
    return track, {'bpm': bpm, 'bars': 24, 'loop': True}


def chime(notes, duration, spacing=.12, voice='pluck'):
    """给短反馈编写简单音型，结尾为衰减预留空间。"""
    track = track_for(duration)
    for index, note in enumerate(notes):
        start = index * spacing
        mix(track, tone(pitch(note), min(1.3, duration - start), voice), start,
            .55, -.2 + .4 * index / max(1, len(notes) - 1))
    return track


def impact(duration=.15, ceramic=False):
    """用非整数倍共振近似骰子或瓷碗碰撞；不代表实录。"""
    t = np.arange(round(duration * RATE)) / RATE
    base = RNG.uniform(1600, 2400) if ceramic else RNG.uniform(600, 1000)
    sound = sum(weight * np.sin(2 * np.pi * base * ratio * t) * np.exp(-t * decay)
                for ratio, weight, decay in ((1, .7, 55), (1.53, .4, 70), (2.17, .2, 110)))
    return sound * (1 - np.exp(-t / .0005)) * np.minimum((duration - t) / .02, 1)


def dice(duration, rolling):
    """不规则密集敲击逐渐稀疏，模拟摇碗或骰子落定。"""
    track = track_for(duration)
    times = np.linspace(.008, duration - .22, 28 if rolling else 5)
    for index, at in enumerate(times):
        start = max(0, at + RNG.uniform(-.007, .007))
        mix(track, impact(.16, index % 3 == 0), start,
            RNG.uniform(.2, .55) * (1 - .45 * index / len(times)), RNG.uniform(-.65, .65))
    return track


def effects():
    """创建 19 项反馈；每项 key 与之前确认的资源清单保持一致。"""
    clips = {
        'dice.roll': ('摇碗', dice(1.2, True)),
        'dice.settle': ('骰子落定', dice(.5, False)),
        'reward.win': ('普通中奖', chime((74, 78, 81), 1.2)),
        'reward.champion': ('状元', chime((62, 66, 69, 74, 78, 81, 86), 3, .16)),
        'ui.click': ('按钮点击', chime((79,), .12, voice='wood')),
        'ui.confirm': ('确认', chime((74, 81), .4, .08, 'wood')),
        'ui.back': ('返回', chime((69, 62), .3, .06, 'wood')),
        'item.cast': ('技能生效', chime((74, 81, 86), .7, .09)),
        'item.attack': ('干扰技能', chime((66, 62, 57), .6, .07, 'wood')),
        'item.shield': ('抵挡与护盾', chime((74, 81), .9, .04, 'bell')),
        'item.transfer': ('奖项转移', chime((69, 74, 78, 81), .9, .11)),
        'blessing.activate': ('神明生效', chime((74, 81, 86), 1.5, .18, 'bell')),
        'field.change': ('场地变化', chime((50, 57, 62), 1.2, .14)),
        'shop.open': ('进入商店', chime((69, 78, 81), .8, .08, 'bell')),
        'shop.buy': ('购买成功', chime((86, 90, 93), .7, .065, 'bell')),
        'shop.refresh': ('商品刷新', chime((81, 78, 74, 69), .6, .07, 'wood')),
        'result.round': ('轮次结算', chime((62, 66, 69, 74), 1.8, .17)),
        'result.victory': ('整局获胜', chime((62, 66, 69, 74, 78, 81, 86, 81, 86), 4, .23)),
        'result.defeat': ('整局收尾', chime((74, 71, 69, 66, 62), 2.5, .23)),
    }
    for name in ('item.cast', 'item.attack', 'item.transfer', 'field.change', 'shop.refresh'):
        track = clips[name][1]
        mix(track, noise(.35, 10), 0, .18, -.2)
    # 状元与最终胜利增加和弦尾音，区分普通中奖的短上行。
    for name, delay in (('reward.champion', 1.1), ('result.victory', 2)):
        for note in (62, 69, 78):
            mix(clips[name][1], tone(pitch(note), 1.7, 'bell'), delay, .2)
    return clips


def write_audio(track, destination, loop=False):
    """去直流、保留约 5 dB 峰值余量；MP3 编码由已有 FFmpeg 完成。"""
    track = track - np.mean(track, axis=0)
    if not loop:
        fade = min(round(.004 * RATE), len(track) // 2)
        track[:fade] *= np.linspace(0, 1, fade)[:, None]
        track[-fade:] *= np.linspace(1, 0, fade)[:, None]
    peak = float(np.max(np.abs(track)))
    track *= (.46 if loop else .56) / max(peak, 1e-9)
    pcm = np.rint(track * 32767).astype('<i2')
    with tempfile.TemporaryDirectory(prefix='bobing-audio-') as temporary:
        wav_path = Path(temporary) / 'audio.wav'
        with wave.open(str(wav_path), 'wb') as output:
            output.setparams((2, 2, RATE, 0, 'NONE', 'not compressed'))
            output.writeframes(pcm.tobytes())
        if destination.suffix == '.mp3':
            subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
                            '-i', str(wav_path), '-codec:a', 'libmp3lame', '-b:a', '160k',
                            str(destination)], check=True)
        else:
            shutil.copyfile(wav_path, destination)
    return {
        'durationSeconds': round(len(track) / RATE, 6),
        'peakDbfsBeforeEncoding': round(20 * np.log10(np.max(np.abs(track))), 2),
        'loopBoundaryDeltaBeforeEncoding': round(float(np.max(np.abs(track[0] - track[-1]))), 8) if loop else None,
        'bytes': destination.stat().st_size,
        'sha256': hashlib.sha256(destination.read_bytes()).hexdigest(),
    }


def write_preview(assets):
    """生成原生音频控件试听页，不自动播放，不需要前端依赖。"""
    cards = []
    for asset in assets:
        filename = asset['src'].removeprefix('/audio/')
        loop = ' loop' if asset['loop'] else ''
        cards.append(f'<article><h2>{html.escape(asset["name"])}</h2>'
                     f'<code>{asset["key"]}</code><p>{asset["durationSeconds"]:.2f} 秒</p>'
                     f'<audio controls preload="none"{loop} src="{filename}"></audio></article>')
    page = '''<!doctype html><html lang="zh-CN"><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>博饼音频试听</title><style>
body{margin:32px auto;padding:0 20px;max-width:1000px;background:#f6efdf;color:#493622;font-family:system-ui,sans-serif}
h1{font-family:serif}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:16px}
article{padding:18px;background:#fffaf0;border:1px solid #cfbd9c;border-radius:12px}
h2{margin:0 0 8px;font-size:18px}code{font-size:13px}p{line-height:1.6}audio{width:100%}
</style><h1>博饼 · 国风轻快音频包</h1>
<p>3 首背景乐 · 19 个音效 · 全部无人声。所有乐器、骰子和瓷碗声均为本地电子合成。
背景乐控件会循环播放，请逐项试听。</p><main>'''
    (OUTPUT / 'index.html').write_text(page + '\n'.join(cards) + '</main></html>\n')


def main():
    """生成正式资源、稳定 key 清单与试听页；重复运行使用同一随机种子。"""
    OUTPUT.mkdir(parents=True, exist_ok=True)
    assets = []
    for theme, name in (('home', '月下迎客'), ('table', '一碗好彩头'), ('shop', '灯下小铺')):
        track, metadata = music(theme)
        filename = f'bgm-{theme}.mp3'
        stats = write_audio(track, OUTPUT / filename, loop=True)
        assets.append({'key': f'bgm.{theme}', 'name': name, 'src': f'/audio/{filename}',
                       'source': 'local-synthesis', **metadata, **stats})
    for key, (name, track) in effects().items():
        filename = key.replace('.', '-') + '.wav'
        stats = write_audio(track, OUTPUT / filename)
        assets.append({'key': 'sfx.' + key, 'name': name, 'src': '/audio/' + filename,
                       'source': 'local-synthesis', 'loop': False, **stats})
    manifest = {'version': 1, 'sampleRate': RATE, 'channels': 2, 'assets': assets}
    (OUTPUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    write_preview(assets)
    print(f'Generated {len(assets)} assets in {OUTPUT}')


if __name__ == '__main__':
    main()
