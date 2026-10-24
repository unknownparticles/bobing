import React, { useEffect, useRef } from 'react';
import { Hand, X } from 'lucide-react';
import { scoreOf } from '../game/state';
import { Avatar } from './PaperPrimitives';

/** 使用原生对话框保留焦点、Escape 关闭和背景不可操作，目标仍由规则层筛选。 */
export default function PaperTargets({ targets, onSelect, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  return <dialog ref={dialog} className="paper-target-picker" aria-labelledby="paper-target-title" onCancel={onClose}>
    <button className="paper-target-close paper-icon-button" onClick={onClose} aria-label="关闭目标选择"><X size={18} /></button>
    <span className="paper-eyebrow">顺手牵羊 · 选个对手</span><h2 id="paper-target-title">这一招，对谁出？</h2><p>夺取对方最高积分的奖项。受保护的同事不参与选择。</p>
    <div>{targets.map((player, index) => <button autoFocus={index === 0} key={player.id} onClick={() => onSelect(player.id)}><Avatar portrait={player.portrait} name={player.name} /><b>{player.name}</b><span>{scoreOf(player)} 分</span><Hand size={17} /></button>)}</div>
    <button className="paper-text-button" onClick={onClose}>先不出招</button>
  </dialog>;
}
