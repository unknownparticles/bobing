import React, { useEffect, useRef } from 'react';
import { BriefcaseBusiness, Calculator, ClipboardCheck, CodeXml, Crown, Dices, Handshake, Megaphone, Network, Package, Palette, ShieldCheck, ShoppingBag, Users, X } from 'lucide-react';
import { getOfficial } from '../Art';
import { AWARDS } from '../game/config';
import { careerOf, careerStatus } from '../game/careers';
import { getItem } from '../game/catalog';
import { scoreOf } from '../game/economy';
import { publicBuffsOf, publicStatesOf, usedCardsOf } from '../game/encounters';
import { Avatar } from './PaperPrimitives';
import CardIcon from './CardIcon';
import '../styles/encounter-guide.css';
import '../styles/career-rivals.css';

const occupationIcons = {
  procurement: ShoppingBag, boss: Crown, hr: Users, tech: CodeXml, finance: Calculator,
  sales: Handshake, project: Network, qa: ClipboardCheck, admin: Package, risk: ShieldCheck,
  xu: ShieldCheck, ye: Palette, liang: Megaphone, fei: ClipboardCheck, jie: Dices,
};

/** 有正式立绘就沿用；新同事用姓名和职业图标，避免冒用其他角色的形象。 */
export function RivalAvatar({ player }) {
  if (getOfficial(player.portrait)) return <Avatar portrait={player.portrait} name={player.name} />;
  const Icon = occupationIcons[player.career] || occupationIcons[player.id] || BriefcaseBusiness;
  return <span className="paper-avatar career-avatar" aria-label={`${player.name}的职业头像`}><b>{player.name.slice(0, 1)}</b><Icon size={15} aria-hidden="true" /></span>;
}

/** 对手的公开职业与行为倾向不预设卡牌组合。 */
export function rivalStyle(player) {
  return player.style || '根据手牌和局势出招';
}

/** 展示最新公开状态；不缓存打开时的资源，电脑行动后详情仍与规则一致。 */
export default function RivalDetails({ game, playerId, onClose }) {
  const dialog = useRef(null);
  const closeButton = useRef(null);
  const player = game.players.find(entry => entry.id === playerId);
  useEffect(() => {
    const modal = dialog.current;
    if (!modal) return undefined;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.showModal();
    closeButton.current?.focus();
    return () => {
      if (modal.open) modal.close();
      document.body.style.overflow = previousOverflow;
      // 原生 dialog 已有焦点约束；显式恢复入口，兼容由 React 卸载来关闭的情况。
      if (trigger?.isConnected) trigger.focus();
    };
  }, [playerId]);
  if (!player) return null;
  const career = careerOf(player);
  const state = player.careerState || {};
  const contact = game.players.find(entry => entry.id === state.contactId);
  const used = usedCardsOf(game, player.id);
  const buffs = publicBuffsOf(game, player);
  const states = publicStatesOf(game, player);
  return <dialog ref={dialog} className="guide-dialog player-details-dialog career-details-dialog" aria-label={`${player.name}的职业与公开信息`} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="career-dialog-content">
      <header className="player-details-heading"><RivalAvatar player={player} /><div><span className="paper-eyebrow">{player.title}</span><h2>{player.name}</h2><p className="career-style">{rivalStyle(player)}</p></div><button ref={closeButton} type="button" className="guide-close" onClick={onClose} aria-label="关闭对手详情"><X size={21} /></button></header>
      <div className="player-details-body">
        <div className="player-prize-totals career-totals"><div><span>当前积分</span><b>{scoreOf(player)}<small>分</small></b></div><div><span>实际金币</span><b>{player.coins}<small>金币</small></b></div></div>
        <section className="player-details-section" aria-label="职业技能与资源"><h3>{career ? '专属职业技能' : '基础打法'}</h3>{career ? <><div className="player-public-entry"><CardIcon id={career.icon} size={23} /><div><b>{career.name}</b>{(Array.isArray(career.description) ? career.description : [career.description]).map((text, index) => <p key={index}>{text}</p>)}</div></div><p className="player-details-note">职业主动技能被封印时不能发动；被动收入、补给与资源增长仍照常结算。</p><p className="career-live-status" role="status">{careerStatus(game, player)}</p><dl className="career-resources">
          {player.career === 'hr' && <><div><dt>人脉</dt><dd>{state.contacts} / 3</dd></div><div><dt>人脉对象</dt><dd>{contact ? `${contact.name}${contact.id === 'you' ? '（你）' : ''}` : '尚未指定'}</dd></div></>}
          {player.career === 'tech' && <div><dt>资历</dt><dd>{state.experience} / 3</dd></div>}
          {player.career === 'project' && <div><dt>剩余调度</dt><dd>{state.swapsLeft} 次</dd></div>}
        </dl>{player.career === 'hr' && contact?.id === 'you' && <p className="career-contact-warning">你是当前人脉对象：符合条件的单目标负面技能可能转给你。你向其出招时不能转回给你。</p>}</> : <p>{player.style}。{player.careerTier === 'group' ? '没有职业专属技能；开局有一张通用重掷券。' : '没有专属职业技能；通过商店拿牌出招。'}</p>}</section>

        <section className="player-details-section" aria-label="当前奖项明细"><h3>当前持有奖项 · {player.awards.length} 份</h3><div className="player-award-list">{AWARDS.map(award => <div key={award.id}><span>{award.name}<small>{award.points} 分 / 份</small></span><b>× {player.awards.filter(id => id === award.id).length}</b></div>)}</div></section>
        <section className="player-details-section"><h3>当前公开效果</h3>{states.map(stateText => <p key={stateText}>{stateText}</p>)}{buffs.map((buff, index) => {
          const item = getItem(buff.itemId || buff.id);
          const source = game.players.find(entry => entry.id === buff.sourceId);
          const target = game.players.find(entry => entry.id === buff.targetId);
          return <div className="player-public-entry" key={`${buff.id}-${index}`}><CardIcon id={item.id} size={22} /><div><b>{item.name}</b><small>{buff.fromRound > game.round ? '下轮生效' : '生效中'} · 至第 {buff.untilRound} 轮{source ? ` · 来源：${source.name}` : ''}{target && target.id !== player.id ? ` · 目标：${target.name}` : ''}</small><p>{item.description}</p></div></div>;
        })}{!states.length && !buffs.length && <p className="player-details-note">暂无持续效果。</p>}</section>
        <section className="player-details-section"><h3>本桌已公开使用</h3>{used.map(item => <div className="player-public-entry" key={item.id}><CardIcon id={item.id} size={22} /><div><b>{item.name}</b><p>{item.description}</p></div></div>)}{!used.length && <p className="player-details-note">还没有公开出牌记录。</p>}</section>
      </div>
    </div>
  </dialog>;
}
