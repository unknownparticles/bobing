import React from 'react';
import { X } from 'lucide-react';
import { AWARDS } from '../game/config';
import { scoreOf } from '../game/economy';
import { getItem } from '../game/catalog';
import { godStatus } from '../game/gods';
import { PUBLIC_SKILLS, publicBuffsOf, publicIdentity, publicStatesOf, usedCardsOf } from '../game/encounters';
import { Avatar } from './PaperPrimitives';
import CardIcon from './CardIcon';
import GuideDialog from './GuideDialog';

/** 玩家公开详情始终读取最新 game；奖项转移、效果到期后不会停留在打开时的快照。 */
export default function PlayerDetails({ game, playerId, onClose }) {
  const player = game.players.find(entry => entry.id === playerId);
  if (!player) return null;
  const identity = publicIdentity(player);
  const skills = PUBLIC_SKILLS.filter(skill => identity.skills.includes(skill.id));
  const used = usedCardsOf(game, player.id);
  const buffs = publicBuffsOf(game, player);
  const states = publicStatesOf(game, player);
  return <GuideDialog label={`${player.name}的公开信息`} className="player-details-dialog" onClose={onClose}>
    <header className="player-details-heading"><Avatar portrait={player.portrait} name={player.name} /><div><span className="paper-eyebrow">玩家公开信息</span><h2>{player.name}{player.id === 'you' && <small>你</small>}</h2></div><button type="button" className="guide-close" onClick={onClose} aria-label="关闭玩家详情"><X size={21} /></button></header>
    <div className="player-details-body">
      <div className="player-prize-totals"><div><span>奖项总数</span><b>{player.awards.length}<small>份</small></b></div><div><span>当前积分</span><b>{scoreOf(player)}<small>分</small></b></div></div>
      <section className="player-details-section" aria-label="当前奖项明细"><h3>当前持有奖项</h3><div className="player-award-list">{AWARDS.map(award => <div key={award.id}><span>{award.name}<small>{award.points} 分 / 份</small></span><b>× {player.awards.filter(id => id === award.id).length}</b></div>)}</div><p className="player-details-note">积分包含已生效的加成与分摊；奖项份数按当前实际持有计算。</p></section>
      <section className="player-details-section"><h3>公开技能</h3>{skills.map(skill => <div className="player-public-entry" key={skill.id}><CardIcon id={skill.icon} size={22} /><div><b>{skill.name}</b><p>{skill.description}</p></div></div>)}{!skills.length && <p className="player-details-note">暂无专属技能。</p>}</section>
      <section className="player-details-section"><h3>当前公开效果</h3>{states.map(state => <p key={state}>{state}</p>)}{buffs.map((buff, index) => {
        const item = getItem(buff.itemId || buff.id);
        const source = game.players.find(entry => entry.id === buff.sourceId);
        const target = game.players.find(entry => entry.id === buff.targetId);
        return <div className="player-public-entry" key={`${buff.id}-${index}`}><CardIcon id={item.id} size={22} /><div><b>{item.name}</b><small>{godStatus(game, buff)} · 至第 {buff.untilRound} 轮{source ? ` · 来源：${source.name}` : ''}{target && target.id !== player.id ? ` · 目标：${target.name}` : ''}</small><p>{item.description}</p></div></div>;
      })}{!states.length && !buffs.length && <p className="player-details-note">暂无持续效果。</p>}</section>
      <section className="player-details-section"><h3>本桌已公开使用</h3>{used.map(item => <div className="player-public-entry" key={item.id}><CardIcon id={item.id} size={22} /><div><b>{item.name}</b><p>{item.description}</p></div></div>)}{!used.length && <p className="player-details-note">还没有公开出牌记录。</p>}</section>
    </div>
  </GuideDialog>;
}
