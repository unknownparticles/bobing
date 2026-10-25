import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { getItem } from '../game/catalog';
import { godTargets } from '../game/gods';
import CardIcon from './CardIcon';
import '../styles/round-start-gods.css';

/** 轮初在桌面明确选人并确认；轮次/队首变更时由父组件的 key 清空旧选择。 */
export default function RoundStartGods({ game, dispatch }) {
  const [targetId, setTargetId] = useState('');
  const heading = useRef(null);
  const pending = game.godQueue[0];
  const actor = game.players.find(player => player.id === pending.sourceId);
  const card = getItem(pending.item);
  const yours = actor.id === 'you';
  const targets = godTargets(game, actor.id, card.id);
  const animating = !!game.visuals?.length;
  const ready = yours && !animating && targets.some(player => player.id === targetId);
  useEffect(() => { if (yours) heading.current?.focus({ preventScroll: true }); }, [yours]);

  return <section className="round-start-gods" aria-labelledby="round-start-gods-title">
    <div className="round-start-gods-heading"><CardIcon id={card.id} size={34}/><div><span>所有人行动前 · 第 {game.round} 轮</span><h2 ref={heading} tabIndex={-1} id="round-start-gods-title">轮初发动 · {card.name}</h2></div></div>
    <p>{yours ? card.id === 'matchmaker' ? '选择一位角色缔结姻缘，关系保持至本次供奉到期。' : '选择本轮目标，下轮开始可以重新指定。' : `${actor.name}正在选择目标，完成轮初发动后开始接碗。`}</p>
    {yours && <>
      <fieldset className="card-target-group" disabled={animating}><legend>{card.id === 'matchmaker' ? '选择未缔结的异性角色' : '选择本轮承受效果的对手'}</legend><div>{targets.map(player => <button key={player.id} aria-pressed={targetId === player.id} className={targetId === player.id ? 'is-selected' : ''} onClick={() => setTargetId(player.id)}>{player.name}{targetId === player.id && <Check size={14}/>}</button>)}</div></fieldset>
      <div className="round-start-gods-actions"><button className="card-confirm-button" disabled={!ready} onClick={() => dispatch({ type: 'CAST_GOD', ...pending, targetId })}>确认发动</button><button className="round-start-gods-skip" disabled={animating} onClick={() => dispatch({ type: 'SKIP_GOD', ...pending })}>本轮暂不发动</button></div>
    </>}
    <small>轮初神明处理完毕后，所有人再按顺序掷骰。</small>
  </section>;
}
