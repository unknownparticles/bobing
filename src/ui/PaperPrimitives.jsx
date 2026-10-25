import React, { lazy, Suspense, useState } from 'react';
import { UserRound, Volume2, VolumeX } from 'lucide-react';
import { ArtworkImage, getOfficial } from '../Art';
import '../styles/bowl3d.css';

// 首屏仍能先画静态骰碗；3D 库加载失败也不阻断入席或结算。
const BowlCanvas = lazy(() => import('../scene/bowl3d/BowlCanvas.jsx').catch(error => {
  console.warn('3D 骰碗资源未加载，保留静态呈现。', error);
  return { default: () => null };
}));

/** 统一桌边头像：放大立绘上半部，避免把整个人物缩成难辨认的小图。 */
export function Avatar({ portrait, name, className = '' }) {
  const asset = getOfficial(portrait);
  return <span className={`paper-avatar ${className}`}>
    {/* 最大头像宽 54px，CSS 将立绘放大到 290%；按约 157px 选图以保留头肩细节。 */}
    {asset ? <ArtworkImage asset={asset} alt={`${name}的头像`} sizes="157px" loading="eager" /> : <UserRound aria-label={name} size={25} />}
  </span>;
}

/** 全流程共用的标识；副标题由当前页面提供。 */
export function Brand({ subtitle = '闽南 · 中秋 · 博饼' }) {
  return <div className="paper-brand"><span className="paper-seal paper-brand-mark" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}icons/bobing-mark.svg`} width={40} height={40} alt="" /></span><div><b>今晚谁是状元</b><small>{subtitle}</small></div></div>;
}

/** 音乐与音效共用开关，并给图标按钮提供可访问名称。 */
export function SoundButton({ muted, onToggle }) {
  return <button className="paper-icon-button" type="button" data-audio-toggle onClick={onToggle} aria-label={muted ? '开启声音' : '关闭声音'} aria-pressed={muted}>
    {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
  </button>;
}

const pipPositions = {
  1: [[12, 12]], 2: [[6, 6], [18, 18]], 3: [[6, 6], [12, 12], [18, 18]],
  4: [[6, 6], [18, 6], [6, 18], [18, 18]],
  5: [[6, 6], [18, 6], [12, 12], [6, 18], [18, 18]],
  6: [[6, 5], [18, 5], [6, 12], [18, 12], [6, 19], [18, 19]],
};

/** 圆角象牙骰面；1 和 4 使用博饼传统的红色点数。 */
export function Die({ value, rolling = false, changing = false, revealing = false, highlighted = false }) {
  return <span className={`paper-die ${rolling ? 'is-rolling' : ''} ${changing ? 'is-changing' : ''} ${revealing ? 'is-revealing' : ''} ${highlighted ? 'is-highlighted' : ''}`}>
    <svg viewBox="0 0 24 24" role="img" aria-label={`${value}点`}>
      <rect width="24" height="24" rx="4" fill="currentColor" />
      {pipPositions[value].map(([x, y], index) => <circle key={index} cx={x} cy={y} r="1.8" fill={value === 1 || value === 4 ? '#b44230' : '#30483c'} />)}
    </svg>
  </span>;
}

/** 红釉金纹骰碗共用于首页和对局，点数与局部动画始终由游戏回合提供。 */
export function DiceBowl({ dice, rolling = false, rollingIndices, changedIndices = [], changing = false, revealing = false, decorative = false }) {
  const [ready, setReady] = useState(false);
  const allRolling = rolling && (!rollingIndices || rollingIndices.length === dice.length);
  const state = { dice, rolling, rollingIndices, changedIndices, changing, revealing };
  return <div className={`paper-bowl-stage bowl3d-stage ${ready ? 'has-webgl' : ''} ${allRolling ? 'is-rolling' : ''} ${decorative ? 'is-decorative' : ''}`} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : `红釉金纹博饼碗，骰子点数：${dice.join('、')}`} aria-hidden={decorative || undefined}>
    <span className="paper-orbit orbit-outer" /><span className="paper-orbit orbit-inner" />
    <div className="bowl3d-fallback" aria-hidden="true">
      <svg viewBox="0 0 500 330" className="bowl3d-fallback-art">
        <defs><radialGradient id={decorative ? 'bowl-red-home' : 'bowl-red-game'}><stop stopColor="#d64a40" /><stop offset="1" stopColor="#741824" /></radialGradient></defs>
        <ellipse cx="250" cy="290" rx="155" ry="20" fill="#54301b" opacity=".12" />
        <path d="M40 124C54 249 139 294 250 297C361 294 446 249 460 124Z" fill="#96212b" stroke="#d7ae59" strokeWidth="5" />
        <path d="M77 213Q250 316 423 213M89 226Q250 318 411 226" fill="none" stroke="#ddb765" strokeWidth="3" />
        {[140, 250, 360].map(x => <path key={x} d={`M${x - 23} 247q23 -40 46 0q-23 25 -46 0m23 -23v43m-21 -22h42`} fill="none" stroke="#e4bc69" strokeWidth="3" />)}
        <ellipse cx="250" cy="124" rx="210" ry="97" fill="#d9b165" />
        <ellipse cx="250" cy="124" rx="202" ry="89" fill={`url(#${decorative ? 'bowl-red-home' : 'bowl-red-game'})`} stroke="#f6d694" strokeWidth="2" />
        <ellipse cx="250" cy="128" rx="183" ry="73" fill="none" stroke="#dda84c" strokeWidth="2" opacity=".7" />
      </svg>
      <div className="paper-dice">{dice.map((value, index) => <Die key={index} value={value} rolling={rolling && (!rollingIndices || rollingIndices.includes(index))} changing={changing && changedIndices.includes(index)} revealing={revealing && changedIndices.includes(index)} highlighted={changedIndices.includes(index)} />)}</div>
    </div>
    <div className="bowl3d-surface" aria-hidden="true"><Suspense fallback={null}><BowlCanvas {...state} onReady={setReady} /></Suspense></div>
  </div>;
}
