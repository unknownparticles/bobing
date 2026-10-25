"""解码检查音频清单，输出可复查的时长、音量与循环边界数据。"""

import hashlib
import json
from pathlib import Path
import subprocess

import numpy as np


ROOT = Path(__file__).resolve().parent.parent


def main():
    """验证实际编码文件；任何缺失、削波或错误长度都会中止检查。"""
    manifest = json.loads((ROOT / 'public/audio/manifest.json').read_text())
    assets = manifest['assets']
    assert len(assets) == 22, '完整包必须包含 22 项资源'
    assert len({asset['key'] for asset in assets}) == len(assets), '资源 key 重复'
    assert sum(asset['loop'] for asset in assets) == 3, '必须包含 3 首背景乐'
    results = []
    for asset in assets:
        source = ROOT / 'public' / asset['src'].lstrip('/')
        assert source.is_file(), f'文件不存在：{source}'
        assert hashlib.sha256(source.read_bytes()).hexdigest() == asset['sha256'], '摘要不一致'
        process = subprocess.run([
            'ffmpeg', '-v', 'error', '-i', str(source), '-f', 'f32le', '-ac', '2',
            '-ar', str(manifest['sampleRate']), 'pipe:1',
        ], capture_output=True, check=True)
        samples = np.frombuffer(process.stdout, dtype='<f4').reshape(-1, 2)
        assert np.isfinite(samples).all(), f'存在非法采样：{asset["key"]}'
        duration = len(samples) / manifest['sampleRate']
        peak = float(np.max(np.abs(samples)))
        rms = float(np.sqrt(np.mean(samples ** 2)))
        assert abs(duration - asset['durationSeconds']) < .001, '解码后时长错误'
        assert 0 < peak < .9, f'音量为零或缺少峰值余量：{asset["key"]}'
        assert rms > .001, f'接近静音：{asset["key"]}'
        boundary = float(np.max(np.abs(samples[0] - samples[-1])))
        if asset['loop']:
            # 该数值检测循环拼接处的突变，不能替代实际听感验收。
            assert boundary < .01, f'循环边界突变过大：{asset["key"]}'
        else:
            assert max(np.max(np.abs(samples[0])), np.max(np.abs(samples[-1]))) < .001, '音效边界未归零'
        results.append({
            'key': asset['key'], 'src': asset['src'], 'durationSeconds': round(duration, 6),
            'peakDbfs': round(20 * np.log10(peak), 2), 'rmsDbfs': round(20 * np.log10(rms), 2),
            'clippedSamples': int(np.count_nonzero(np.abs(samples) >= 1)),
            'loopBoundaryDelta': round(boundary, 8) if asset['loop'] else None,
            'decoded': True,
        })
    report = {
        'date': '2026-10-24', 'assetCount': len(results), 'allChecksPassed': True,
        'totalBytes': sum(asset['bytes'] for asset in assets),
        'limitations': ['技术检查不代表人工试听通过；合成音色未标为实录。',
                        '循环检测针对解码采样；不同浏览器的 MP3 循环调度仍可能产生间隔。'],
        'results': results,
    }
    destination = ROOT / 'docs/audio-verification.json'
    destination.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(f'PASS: {len(results)} assets decoded; no clipped samples; duration and boundary checks passed.')
    print(f'Total size: {report["totalBytes"] / 1024 / 1024:.2f} MiB; report: {destination}')


if __name__ == '__main__':
    main()
