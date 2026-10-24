import React from 'react';
import { UserRound, Volume2, VolumeX } from 'lucide-react';
import { getOfficial } from '../Art';

/** 统一桌边头像：放大立绘上半部，避免把整个人物缩成难辨认的小图。 */
export function Avatar({ portrait, name, className = '' }) {
  const asset = getOfficial(portrait);
  return <span className={`paper-avatar ${className}`}>
    {asset ? <img src={asset.src} alt={`${name}的头像`} /> : <UserRound aria-label={name} size={25} />}
  </span>;
}

/** 全流程共用的标识；副标题由当前页面提供。 */
export function Brand({ subtitle = '闽南 · 中秋 · 博饼' }) {
  return <div className="paper-brand"><span className="paper-seal">博</span><div><b>今晚谁是状元</b><small>{subtitle}</small></div></div>;
}

/** 音效开关沿用原有 muted 状态，并给图标按钮提供可访问名称。 */
export function SoundButton({ muted, onToggle }) {
  return <button className="paper-icon-button" type="button" onClick={onToggle} aria-label={muted ? '开启音效' : '关闭音效'} aria-pressed={muted}>
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
export function Die({ value, rolling = false }) {
  return <span className={`paper-die ${rolling ? 'is-rolling' : ''}`}>
    <svg viewBox="0 0 24 24" role="img" aria-label={`${value}点`}>
      <rect width="24" height="24" rx="4" fill="currentColor" />
      {pipPositions[value].map(([x, y], index) => <circle key={index} cx={x} cy={y} r="1.8" fill={value === 1 || value === 4 ? '#b44230' : '#30483c'} />)}
    </svg>
  </span>;
}

/** 骰碗只负责呈现，所有点数和动画状态来自现有游戏回合。 */
export function DiceBowl({ dice, rolling = false, decorative = false }) {
  return <div className={`paper-bowl-stage ${rolling ? 'is-rolling' : ''} ${decorative ? 'is-decorative' : ''}`} aria-hidden={decorative || undefined}>
    <span className="paper-orbit orbit-outer" /><span className="paper-orbit orbit-inner" />
    <div className="paper-bowl"><div className="paper-bowl-inner"><div className="paper-dice">{dice.map((value, index) => <Die key={index} value={value} rolling={rolling} />)}</div></div></div>
  </div>;
}
