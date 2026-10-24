import React, { useEffect, useState } from 'react';
import { Check, Circle, Coins, Crown, Diamond, Dices, Gem, Hand, Leaf, Medal, RotateCcw, Shield, Smartphone, Sparkles } from 'lucide-react';
import { Avatar, Brand, DiceBowl, SoundButton } from './PaperPrimitives';
import { AWARDS, MAX_ROUNDS } from '../game/config';
import { canReroll, scoreOf, rankOf } from '../game/state';
import { SKILLS, getItem } from '../game/catalog';
import CardInventory from './CardInventory';
import CardIcon from './CardIcon';
import Shop from '../game/Shop';
import PaperSummary from './PaperSummary';
import HeroSkill from './HeroSkill';
import EffectLayer from './EffectLayer';

const awardIcons = { crown: Crown, leaf: Leaf, circle: Circle, diamond: Diamond, medal: Medal, gem: Gem };

/** 六种奖项共用同一组图标，未知图标仍提供明确的通用标记。 */
function AwardIcon({ type, size = 15 }) {
  const Icon = awardIcons[type] || Gem;
  return <Icon size={size} aria-hidden="true" />;
}

/** 对局展示层：只派发已有动作，库存、购买限制和发奖仍由游戏规则校验。 */
export default function PaperGame({ game, dispatch, dice, profile, muted, onToggleSound, targetOpen, setTargetOpen, shakeReady, requestMotion, motionMessage, rollButton, playItem, onRestart, onHome }) {
  const active = game.players[game.turnIndex];
  const you = game.players.find(player => player.id === 'you');
  const isYourTurn = active.id === you.id;
  const rolling = game.stage === 'rolling';
  const ready = isYourTurn && game.stage === 'ready';
  const reviewing = isYourTurn && game.stage === 'review';
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const handCount = SKILLS.reduce((total, card) => total + (you.items[card.id] || 0), 0);
  useEffect(() => {
    if (!isYourTurn || ['shop', 'finished'].includes(game.stage)) setInventoryOpen(false);
  }, [isYourTurn, game.stage]);
  const yourScore = scoreOf(you);
  // 同分显示相同名次，避免视觉排名暗中引入新的胜负规则。
  const place = game.players.filter(player => scoreOf(player) > yourScore || scoreOf(player) === yourScore && rankOf(player) > rankOf(you)).length + 1;
  const leaders = Math.max(...game.players.map(scoreOf));

  return <main className={`paper-page paper-game ${game.stage === 'shop' ? 'paper-shop' : ''} ${game.stage === 'finished' ? 'paper-finished' : ''}`}>
    <header className="paper-header"><Brand subtitle="第一章 · 公司中秋晚宴" /><div className="paper-round">第 <b>{String(game.round).padStart(2, '0')}</b> / {MAX_ROUNDS} 轮<span>{game.stage === 'finished' ? '今晚成绩 · 好彩头落定' : game.stage === 'shop' ? '轮间小铺 · 备点好招' : '六人同桌 · 逆时针接碗'}</span></div><SoundButton muted={muted} onToggle={onToggleSound} /></header>
    {game.stage !== 'finished' && <div className={`paper-match-goal ${game.round === MAX_ROUNDS ? 'is-final' : ''}`}>
      <span><Crown size={14} />{game.round === MAX_ROUNDS ? '最后一轮 · 六人行动后揭晓状元' : game.stage === 'shop' ? `还剩 ${MAX_ROUNDS - game.round} 轮 · 为下一碗备好招` : `含本轮还剩 ${MAX_ROUNDS - game.round + 1} 轮`}</span>
      <span>八轮结束，按奖项积分争第一</span>
    </div>}
    {game.stage === 'finished' ? <PaperSummary game={game} onRestart={onRestart} onHome={onHome} /> : game.stage === 'shop' ? <Shop game={game} dispatch={dispatch} /> : <>
      <div className="paper-game-layout">
        <section className="paper-play-area" aria-label="博饼桌面">
          <div className="paper-rivals" aria-label="逆时针接碗的对手顺序">{game.players.filter(player => player.id !== you.id).map(player => {
            const score = scoreOf(player);
            return <article key={player.id} className={`paper-rival ${active.id === player.id ? 'is-active' : ''}`} aria-current={active.id === player.id ? 'step' : undefined}>
              <div className="paper-rival-avatar" data-effect-player={player.id}><Avatar portrait={player.portrait} name={player.name} />{score > 0 && score === leaders && <Crown className="paper-leader-crown" size={17} />}{player.protected && <Shield className="paper-protection" size={15} aria-label="保护中" />}</div><b>{player.name}</b><span className="paper-rival-title">{active.id === player.id ? '正在接碗' : player.title}</span><span className="paper-rival-score">{score}<small>分</small></span><div className="paper-rival-effects">{player.buffs.filter(buff => !buff.targetId || buff.targetId === player.id || buff.id === 'matchmaker').map(buff => <span key={`${buff.id}-${buff.sourceId}`} title={`${getItem(buff.id)?.name} · 至第${buff.untilRound}轮`}><CardIcon id={buff.id} size={12} /></span>)}{player.skip && <span title="下一次行动跳过"><CardIcon id="toilet" size={12} /></span>}{player.sealPending && <span title="下一次行动封印"><CardIcon id="seal" size={12} /></span>}</div>
            </article>;
          })}</div>
          <div className={`paper-turn-banner ${isYourTurn ? 'is-yours' : ''}`}><i /><span>{rolling ? `${active.name}正在摇碗` : reviewing ? '结果已揭晓，确认或使用重掷券' : ready ? '轮到你了，摇一碗好彩头' : `${active.name}接碗，稍候片刻`}</span></div>
          <div className="paper-field-banner"><CardIcon id={game.field?.id || 'six_dice'} size={19} /><span>{game.field ? getItem(game.field.id)?.name : '标准团圆席'} · {game.diceCount} 颗骰子</span></div>
          <DiceBowl dice={dice} rolling={rolling} />
          <div className="paper-status-strip">{(you.buffs || []).map((buff, index) => <span key={`${buff.id}-${index}`} title={`${getItem(buff.id)?.name}：${getItem(buff.id)?.description}`}><CardIcon id={buff.id} size={16} />{getItem(buff.id)?.name}{buff.targetId && buff.targetId !== you.id && buff.id !== 'matchmaker' ? `→${game.players.find(player => player.id === buff.targetId)?.name}` : ''}<small>{buff.fromRound > game.round ? '下轮生效' : `${buff.untilRound - game.round + 1}轮`}</small></span>)}{you.partnerId && <span className="is-bond"><CardIcon id="matchmaker" size={16} />与{game.players.find(player => player.id === you.partnerId)?.name}共进退</span>}{you.sealed && <span>本次行动被封印</span>}{you.skip && <span>下一次行动去厕所</span>}</div>
          <div className={`paper-result result-${game.eventType}`} role="status" aria-live="polite"><span>{rolling ? '骰落金盘 · 好运将至' : game.eventType === 'jackpot' ? '状元好彩头' : game.eventType === 'award' ? '好彩头，接住了' : game.eventType === 'skill' ? '桌上过招' : '一碗团圆 · 满桌好运'}</span><h1>{game.event}</h1><p>{reviewing && canReroll(game) ? '收下这一碗，还是用重掷券再搏一次？重掷后旧结果作废。' : game.round === 1 && ready ? '开局已送一张重掷券。看完结果，再决定收下还是重投。' : game.round === MAX_ROUNDS ? '收官这一轮，六人行动完后按奖项积分结算。' : '有牌就能连续出招，选对时机再确认结果。'}</p></div>
          <div className="paper-table-note"><Sparkles size={13} />闽南好彩头，今晚轮到你。</div><div className="paper-table-self" data-effect-player={you.id}><Avatar portrait={profile.portrait} name={you.name} /><span>{you.name}<small>你的座位</small></span></div>
        </section>
        <aside className="paper-prize-panel" aria-label="本桌奖池"><div className="paper-panel-heading"><span className="paper-eyebrow">本桌好彩头</span><h2>奖池一览 <Gem size={17} /></h2></div><div className="paper-pool-total"><b>{AWARDS.reduce((total, award) => total + game.pool[award.id] * award.points, 0).toLocaleString()}</b><span>剩余奖池积分</span></div><div className="paper-prizes">{AWARDS.map(award => <div className={`paper-prize prize-${award.id}`} key={award.id}><span className="paper-prize-icon"><AwardIcon type={award.icon} /></span><div><b>{award.name}</b><small>{award.points} 分 / 份</small></div><span className="paper-prize-stock"><b>{game.pool[award.id]}</b><small> / {award.count}</small></span></div>)}</div><details className="paper-event-log"><summary>最近桌上事</summary><ul>{game.log.map((entry, index) => <li key={index}>{entry}</li>)}</ul></details></aside>
      </div>
      <section className="paper-action-dock" aria-label="我的回合操作"><div className="paper-self"><Avatar portrait={profile.portrait} name={you.name} /><div><b>{you.name}{you.protected && <Shield className="paper-self-shield" size={12} aria-label="保护中" />}</b><span>{isYourTurn ? '你的回合' : '等待接碗'} · 暂列第 {place} 名</span><span className="paper-self-coins"><Coins size={11} />{you.coins} 金币</span></div><strong>{yourScore}<small>分</small></strong></div>
        <div className="paper-game-actions has-hero-skill">
          <HeroSkill game={game} dispatch={dispatch} />
          <button className="paper-skill paper-reroll" aria-label="使用重掷券" onClick={() => dispatch({ type: 'REROLL' })} disabled={!isYourTurn || !canReroll(game)}><RotateCcw size={18} /><span><b>重掷券</b><small>剩余 {you.items.reroll} 件</small></span></button>
          <button className="paper-skill paper-hand-button" onClick={() => setInventoryOpen(true)} disabled={!isYourTurn || !['ready', 'review'].includes(game.stage)}><CardIcon id="lucky_bag" size={21} /><span><b>我的手牌 · {handCount}</b><small>可连续出招</small></span></button>
          <button ref={rollButton} className="paper-primary paper-roll" onClick={() => { setTargetOpen(false); dispatch({ type: reviewing ? 'CONFIRM' : 'ROLL' }); }} disabled={!ready && !reviewing}>{reviewing ? <Check size={22} /> : <Dices size={22} />}<span>{reviewing ? '确认结果' : rolling ? '摇碗中…' : ready ? '掷骰，博个好彩头' : `${active.name}的回合`}<small>{reviewing ? '收下这一碗的好彩头' : ready ? '点击掷骰 · 好运将至' : '马上就轮到你'}</small></span></button>
          <button className={`paper-motion ${shakeReady ? 'is-ready' : ''}`} onClick={requestMotion} disabled={!ready} aria-label={shakeReady ? '已开启手机摇一摇' : '开启手机摇一摇'}><Smartphone size={19} /><span>{shakeReady ? '已开启' : '摇一摇'}</span></button>
        </div>
        {motionMessage && <p className="paper-motion-message" role="status">{motionMessage}</p>}
      </section>
      {inventoryOpen && <CardInventory game={game} dispatch={dispatch} onClose={() => setInventoryOpen(false)} />}
    </>}
    <EffectLayer key={game.visuals?.[0]?.id || 'idle'} event={game.visuals?.[0]} players={game.players} />
  </main>;
}
