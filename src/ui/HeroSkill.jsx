import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { canUseHeroReroll, heroOf } from '../game/heroes';
import { Die } from './PaperPrimitives';
import CardIcon from './CardIcon';

/** 主角基础技能独立于卡牌和神明，公开展示当前轮的剩余资格。 */
export default function HeroSkill({ game, dispatch }) {
  const you = game.players.find(player => player.id === 'you');
  const hero = heroOf(you);
  const [open, setOpen] = useState(false);
  const available = canUseHeroReroll(game);
  useEffect(() => { if (!available) setOpen(false); }, [available]);
  if (!hero) return null;
  const status = hero.id === 'hero-a' ? you.heroRerollRound === game.round ? '本轮已用' : '本轮剩余1次' : hero.id === 'hero-b' ? you.heroGuardRound === game.round ? '本轮已抵挡' : '本轮可自动抵挡1次' : '每次进店首刷免费';
  return <>
    {hero.id === 'hero-a' ? <button className="paper-skill hero-talent-button" type="button" disabled={!available} onClick={() => setOpen(true)} title={hero.description} aria-label={`基础技能${hero.skill}，${status}`}><CardIcon id={hero.icon} size={18} /><span><b>{hero.skill}</b><small>{you.heroRerollRound === game.round ? '本轮已用' : available ? '免费选骰 · 1次' : '看结果后使用'}</small></span></button> : <div className="paper-skill hero-talent-passive" role="status" aria-label={`基础技能${hero.skill}，${status}`} title={hero.description}><CardIcon id={hero.icon} size={18} /><span><b>{hero.skill}</b><small>{hero.id === 'hero-b' ? you.heroGuardRound === game.round ? '本轮已抵挡' : '自动护奖 · 1次' : '进店首刷免费'}</small></span></div>}
    {open && <HeroDiePicker game={game} onClose={() => setOpen(false)} onSelect={index => { dispatch({ type: 'HERO_REROLL', diceIndex: index }); setOpen(false); }} />}
  </>;
}

/** 原生对话框隔离焦点；只有明确选择一颗骰子后才消耗本轮免费次数。 */
function HeroDiePicker({ game, onClose, onSelect }) {
  const dialog = useRef(null);
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => { if (element.open) element.close(); };
  }, []);
  return <dialog ref={dialog} className="hero-die-dialog" aria-labelledby="hero-die-title" onCancel={onClose} onClose={onClose}>
    <button className="card-dialog-close" type="button" aria-label="取消免费重掷" onClick={onClose}><X size={18} /></button>
    <span className="paper-eyebrow">基础技能 · 每轮一次</span><h2 id="hero-die-title">再搏一次</h2><p>选择一颗骰子免费重掷，其余点数保持。不消耗手牌。</p>
    <div className="hero-die-options">{game.dice.map((value, index) => <button key={index} type="button" aria-label={`免费重掷第${index + 1}颗，${value}点`} aria-pressed={selected === index} onClick={() => setSelected(index)}><Die value={value} /><small>第{index + 1}颗</small></button>)}</div>
    <button className="card-confirm-button" type="button" disabled={selected === null} onClick={() => onSelect(selected)}><Check size={17} />确认免费重掷</button>
  </dialog>;
}
