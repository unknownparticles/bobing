import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Check, Circle, Coins, Crown, Diamond, Dices, Gem, Hand, Leaf, Medal, RotateCcw, Shield, Smartphone, Sparkles } from 'lucide-react';
import { Avatar, Brand, DiceBowl, SoundButton } from './PaperPrimitives';
import { AWARDS } from '../game/config';
import { canReroll, scoreOf } from '../game/state';
import { SKILLS, getItem } from '../game/catalog';
import CardInventory from './CardInventory';
import RoundStartGods from './RoundStartGods';
import { godStatus } from '../game/gods';
import CardIcon from './CardIcon';
import Shop from '../game/Shop';
import PaperSummary from './PaperSummary';
import HeroSkill from './HeroSkill';
import EffectLayer from './EffectLayer';
import { placeOf, seatsForCount } from '../game/modes';
import RivalSpeech from './RivalSpeech';
import BuildStatus from './BuildStatus';
import { TITLES } from '../game/progression-content';
import DicePresentation from './DicePresentation';
import ArchiveScreen from './ArchiveScreen';
import GuideDialog from './GuideDialog';
import PlayerDetails from './PlayerDetails';
import { createArchive } from '../game/archive';
import { publicBuffsOf } from '../game/encounters';
import RivalDetails, { RivalAvatar } from './RivalDetails';
import { careerOf, careerStatus } from '../game/careers';

const awardIcons = { crown: Crown, leaf: Leaf, circle: Circle, diamond: Diamond, medal: Medal, gem: Gem };

/** 六种奖项共用同一组图标，未知图标仍提供明确的通用标记。 */
function AwardIcon({ type, size = 15 }) {
  const Icon = awardIcons[type] || Gem;
  return <Icon size={size} aria-hidden="true" />;
}

/** 对局展示层：只派发已有动作，库存、购买限制和发奖仍由游戏规则校验。 */
export default function PaperGame({ game, speech, archive, rewards, storageError, dispatch, dice, presentation, profile, muted, onToggleSound, targetOpen, setTargetOpen, shakeReady, requestMotion, motionMessage, rollButton, playItem, onRestart, onHome, onContinue }) {
  const active = game.players[game.turnIndex];
  const you = game.players.find(player => player.id === 'you');
  const isYourTurn = active.id === you.id;
  const rolling = game.stage === 'rolling';
  const roundStart = game.stage === 'round-start';
  const effectsBusy = Boolean(game.visuals?.length);
  const ready = isYourTurn && game.stage === 'ready' && !effectsBusy;
  const reviewing = isYourTurn && game.stage === 'review' && !effectsBusy;
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const handCount = SKILLS.reduce((total, card) => total + (you.items[card.id] || 0), 0);
  const rivals = useRef(null);
  const resultPanel = useRef(null);
  const actionDock = useRef(null);
  const classic = game.match.mode === 'classic';
  const maxRounds = game.match.maxRounds;
  const finalRound = maxRounds !== null && game.round === maxRounds;
  const remainingPrizes = Object.values(game.pool).reduce((sum, count) => sum + count, 0);
  const seats = seatsForCount(game.players.length);
  const titleName = TITLES.find(item => item.id === archive?.selectedTitle)?.name;
  useEffect(() => {
    if (!isYourTurn || ['shop', 'finished', 'round-start'].includes(game.stage)) setInventoryOpen(false);
  }, [isYourTurn, game.stage]);
  useEffect(() => {
    // 大桌只滚动对手栏，避免 scrollIntoView 连带移动整张页面和操作按钮。
    const container = rivals.current;
    const current = container?.querySelector('[aria-current="step"]');
    if (!current) return;
    const bounds = container.getBoundingClientRect();
    const seat = current.getBoundingClientRect();
    container.scrollBy?.({ left: seat.left - bounds.left - (bounds.width - seat.width) / 2, behavior: 'instant' });
  }, [active.id, game.stage === 'shop']);
  useEffect(() => {
    if (window.innerWidth > 700 || !isYourTurn || !['rolling', 'review'].includes(game.stage)) return;
    const result = resultPanel.current?.getBoundingClientRect();
    const dock = actionDock.current?.getBoundingClientRect();
    // 手机保留固定操作栏；公开预告增高后，将本碗结果移到栏上方再供确认。
    if (result && dock && result.bottom > dock.top - 14) window.scrollBy({ top: result.bottom - dock.top + 14, behavior: 'instant' });
  }, [game.stage, isYourTurn]);
  useLayoutEffect(() => {
    // 固定操作栏高度随称号、按钮与安全区变化；按实测值预留等高的底部空间，
    // 既不留下写死高度造成的空白，也不会在操作栏变高时盖住结果。
    const dock = actionDock.current;
    if (!dock) return undefined;
    const root = document.documentElement;
    const measure = () => root.style.setProperty('--dock-height', `${Math.ceil(dock.getBoundingClientRect().height)}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(dock);
    return () => { observer.disconnect(); root.style.removeProperty('--dock-height'); };
  }, [game.stage]);
  useEffect(() => {
    // 矮屏首屏放不下整张桌子；开局时只把被操作栏压住的骰碗移进来，不替用户多做滚动。
    if (window.innerWidth > 700 || !isYourTurn || game.stage !== 'ready') return;
    const bowl = document.querySelector('.paper-bowl-stage')?.getBoundingClientRect();
    const dock = actionDock.current?.getBoundingClientRect();
    if (bowl && dock && bowl.bottom > dock.top - 14) window.scrollBy({ top: bowl.bottom - dock.top + 14, behavior: 'instant' });
  }, [isYourTurn, game.stage]);
  useEffect(() => {
    if (window.innerWidth > 700 || !isYourTurn || !['comparison', 'changing', 'changed'].includes(presentation?.phase)) return;
    const process = document.querySelector('.dice-presentation')?.getBoundingClientRect();
    const dock = actionDock.current?.getBoundingClientRect();
    // 多组结果会比普通一碗更高，比较时主动露出所有取舍，避免被固定操作栏挡住。
    if (process && dock && process.bottom > dock.top - 14) window.scrollBy({ top: process.bottom - dock.top + 14, behavior: 'instant' });
  }, [presentation?.phase, isYourTurn]);
  const yourScore = scoreOf(you);
  // 同分显示相同名次，避免视觉排名暗中引入新的胜负规则。
  const place = placeOf(game);
  const leaders = Math.max(...game.players.map(scoreOf));

  return <main className={`paper-page paper-game ${roundStart ? 'paper-round-start' : ''} ${game.stage === 'shop' ? 'paper-shop' : ''} ${game.stage === 'finished' ? 'paper-finished' : ''}`}>
    <header className="paper-header"><Brand subtitle={game.match.title} /><div className="paper-round">第 <b>{String(game.round).padStart(2, '0')}</b>{classic ? ' 轮' : ` / ${maxRounds} 轮`}<span>{game.stage === 'finished' ? '今晚成绩 · 好彩头落定' : game.stage === 'shop' ? '轮间小铺 · 备点好招' : `${game.players.length}人同桌 · ${classic ? '不限回合' : '逆时针接碗'}`}</span></div><div className="paper-header-tools"><button type="button" className="paper-guide-button" aria-label="打开技能、卡牌与角色图鉴" onClick={() => setGuideOpen(true)}><BookOpen size={17} /><span>图鉴</span></button><button className="paper-game-home" onClick={onHome} aria-label="返回首页"><ArrowLeft size={16} /><span>返回首页</span></button><SoundButton muted={muted} onToggle={onToggleSound} /></div></header>
    {game.stage !== 'finished' && <div className={`paper-match-goal ${finalRound ? 'is-final' : ''}`}>
      <span><Crown size={14} />{classic ? `还剩 ${remainingPrizes} 份奖品 · 博完即结算` : finalRound ? `最后一轮 · ${game.players.length}人行动后揭晓状元` : game.stage === 'shop' ? `还剩 ${maxRounds - game.round} 轮 · 为下一碗备好招` : `含本轮还剩 ${maxRounds - game.round + 1} 轮`}</span>
      <span>{classic ? '不限轮数 · 按奖项积分争第一' : game.match.mode === 'story' ? `${maxRounds}轮结束，第一名${game.match.chapterIndex === 2 ? '成为王中王' : '晋级下一章'}` : `${maxRounds}轮结束，按奖项积分争第一`}</span>
    </div>}
    {storageError && <p className="archive-storage-error" role="alert">{storageError}</p>}
    {game.stage !== 'finished' && <BuildStatus game={game} />}
    {game.stage === 'finished' ? <PaperSummary game={game} rewards={rewards} onRestart={onRestart} onHome={onHome} onContinue={onContinue} /> : game.stage === 'shop' ? <Shop game={game} dispatch={dispatch} /> : <>
      <div className="paper-game-layout">
        <section className="paper-play-area" aria-label="博饼桌面">
          <div ref={rivals} className={`paper-rivals ${game.players.length > 6 ? 'is-large-table' : ''} ${game.match.mode === 'story' ? 'has-career-rivals' : ''}`} tabIndex={game.players.length > 6 ? 0 : undefined} aria-label="逆时针接碗的对手顺序">{game.players.filter(player => player.id !== you.id).map(player => {
            const score = scoreOf(player);
            const career = careerOf(player);
            const status = career ? careerStatus(game, player) : '';
            const statusParts = status.split(' · ');
            const shortStatus = player.career === 'hr' ? `${statusParts[0]} · ${statusParts.at(-1)}` : status;
            return <button type="button" key={player.id} className={`paper-rival paper-player-trigger ${active.id === player.id ? 'is-active' : ''}`} aria-current={active.id === player.id ? 'step' : undefined} aria-haspopup="dialog" aria-label={`查看${player.name}的奖项与公开信息`} onClick={() => setSelectedPlayerId(player.id)}>
              <div className="paper-rival-avatar" data-effect-player={player.id}><RivalAvatar player={player} />{score > 0 && score === leaders && <Crown className="paper-leader-crown" size={17} />}{player.protected && <Shield className="paper-protection" size={15} aria-label="保护中" />}</div><b>{player.name}</b><span className="paper-rival-title">{seats.indexOf(player.seat) + 1}号 · {roundStart ? '轮初准备' : active.id === player.id ? '正在接碗' : '等待接碗'}</span><span className="paper-rival-score">{score}<small>分</small></span>{player.careerTier && <span className="career-marker">{player.title}{career ? ` · ${career.name}` : ''}</span>}{career && <span className="career-short-status" title={status}>{shortStatus}</span>}<div className="paper-rival-effects">{publicBuffsOf(game, player).filter(buff => !buff.targetId || buff.targetId === player.id || buff.id === 'matchmaker').map(buff => <span key={`${buff.id}-${buff.sourceId}`} title={`${getItem(buff.id)?.name} · 至第${buff.untilRound}轮`}><CardIcon id={buff.id} size={12} /></span>)}{player.skip && <span title="下一次行动跳过"><CardIcon id="toilet" size={12} /></span>}{player.sealPending && <span title="下一次行动封印"><CardIcon id="seal" size={12} /></span>}</div>
            </button>;
          })}</div>
          <RivalSpeech speech={speech} players={game.players} />
          <div className={`paper-turn-banner ${isYourTurn ? 'is-yours' : ''}`}><i /><span>{roundStart ? '轮初神明发动 · 选定目标后开始接碗' : rolling ? `${active.name}正在摇碗` : reviewing ? '结果已揭晓，确认或使用重掷券' : ready ? '轮到你了，摇一碗好彩头' : `${active.name}接碗，稍候片刻`}</span></div>
          <div className="paper-field-banner"><CardIcon id={game.field?.id || 'six_dice'} size={19} /><span>{game.field ? getItem(game.field.id)?.name : '标准团圆席'} · {game.diceCount} 颗骰子</span></div>
          {roundStart ? <RoundStartGods key={`${game.round}-${game.godQueue[0].sourceId}-${game.godQueue[0].item}`} game={game} dispatch={dispatch} /> : <DiceBowl dice={dice} rolling={presentation ? presentation.phase === 'rolling' : rolling} rollingIndices={presentation?.rollingIndices} changedIndices={presentation?.changedIndices} changing={presentation?.phase === 'changing'} revealing={presentation?.phase === 'changed'} />}
          <DicePresentation presentation={presentation} />
          <div className="paper-status-strip">{(you.buffs || []).map((buff, index) => <span key={`${buff.id}-${index}`} title={`${getItem(buff.id)?.name}：${getItem(buff.id)?.description}`}><CardIcon id={buff.id} size={16} />{getItem(buff.id)?.name}{buff.targetId && buff.targetId !== you.id && buff.id !== 'matchmaker' ? `→${game.players.find(player => player.id === buff.targetId)?.name}` : ''}<small>{godStatus(game, buff)}</small></span>)}{you.partnerId && <span className="is-bond"><CardIcon id="matchmaker" size={16} />与{game.players.find(player => player.id === you.partnerId)?.name}共进退</span>}{you.sealed && <span>本次行动被封印</span>}{you.skip && <span>下一次行动去厕所</span>}</div>
          <div ref={resultPanel} className={`paper-result result-${game.eventType}`} role="status" aria-live="polite"><span>{rolling ? '骰落金盘 · 好运将至' : game.eventType === 'jackpot' ? '状元好彩头' : game.eventType === 'award' ? '好彩头，接住了' : game.eventType === 'skill' ? '桌上过招' : '一碗团圆 · 满桌好运'}</span><h1>{game.event}</h1><p>{reviewing && canReroll(game) ? '收下这一碗，还是用重掷券再搏一次？重掷后旧结果作废。' : game.round === 1 && ready ? '开局已送一张重掷券。看完结果，再决定收下还是重投。' : classic ? '奖池全部博完才散席，未中奖或已发完的奖型不补发。' : finalRound ? `收官这一轮，${game.players.length}人行动完后按奖项积分结算。` : '有牌就能连续出招，选对时机再确认结果。'}</p></div>
          <div className="paper-table-note"><Sparkles size={13} />点击玩家，查看奖项与公开出招。</div><button type="button" className="paper-table-self paper-player-trigger" data-effect-player={you.id} aria-label="查看我的奖项与公开信息" onClick={() => setSelectedPlayerId(you.id)}><Avatar portrait={profile.portrait} name={you.name} /><span>{you.name}<small>{seats.indexOf(you.seat) + 1}号座位{titleName ? ` · ${titleName}` : ''}</small></span></button>
        </section>
        <aside className="paper-prize-panel" aria-label="本桌奖池"><div className="paper-panel-heading"><span className="paper-eyebrow">本桌好彩头</span><h2>奖池一览 <Gem size={17} /></h2></div><div className="paper-pool-total"><b>{AWARDS.reduce((total, award) => total + game.pool[award.id] * award.points, 0).toLocaleString()}</b><span>剩余奖池积分</span></div><div className="paper-prizes">{AWARDS.map(award => <div className={`paper-prize prize-${award.id}`} key={award.id}><span className="paper-prize-icon"><AwardIcon type={award.icon} /></span><div><b>{award.name}</b><small>{award.points} 分 / 份</small></div><span className="paper-prize-stock"><b>{game.pool[award.id]}</b><small> / {award.count}</small></span></div>)}</div><details className="paper-event-log"><summary>最近桌上事</summary><ul>{game.log.map((entry, index) => <li key={index}>{entry}</li>)}</ul></details></aside>
      </div>
      <section ref={actionDock} className="paper-action-dock" aria-label="我的回合操作"><button type="button" className="paper-self paper-player-trigger" aria-label="查看我的奖项与公开信息" onClick={() => setSelectedPlayerId(you.id)}><Avatar portrait={profile.portrait} name={you.name} /><div><b>{you.name}{you.protected && <Shield className="paper-self-shield" size={12} aria-label="保护中" />}</b><span>{roundStart ? '轮初发动' : isYourTurn ? '你的回合' : '等待接碗'} · 暂列第 {place} 名</span><span className="paper-self-coins"><Coins size={11} />{you.coins} 金币</span></div><strong>{yourScore}<small>分</small></strong></button>
        <div className="paper-game-actions has-hero-skill">
          <HeroSkill game={game} dispatch={dispatch} />
          <button className="paper-skill paper-reroll" aria-label="使用重掷券" onClick={() => dispatch({ type: 'REROLL' })} disabled={!isYourTurn || !canReroll(game)}><RotateCcw size={18} /><span><b>重掷券</b><small>剩余 {you.items.reroll} 件</small></span></button>
          <button className="paper-skill paper-hand-button" onClick={() => setInventoryOpen(true)} disabled={!isYourTurn || effectsBusy || !['ready', 'review'].includes(game.stage)}><CardIcon id="lucky_bag" size={21} /><span><b>我的手牌 · {handCount}</b><small>可连续出招</small></span></button>
          <button ref={rollButton} className="paper-primary paper-roll" onClick={() => { setTargetOpen(false); dispatch({ type: reviewing ? 'CONFIRM' : 'ROLL' }); }} disabled={!ready && !reviewing}>{reviewing ? <Check size={22} /> : <Dices size={22} />}<span>{reviewing ? '确认结果' : roundStart ? '先完成神明发动' : rolling ? '摇碗中…' : ready ? '掷骰，博个好彩头' : `${active.name}的回合`}<small>{reviewing ? '收下这一碗的好彩头' : ready ? '点击掷骰 · 好运将至' : '马上就轮到你'}</small></span></button>
          <button className={`paper-motion ${shakeReady ? 'is-ready' : ''}`} onClick={requestMotion} disabled={!ready} aria-label={shakeReady ? '已开启手机摇一摇' : '开启手机摇一摇'}><Smartphone size={19} /><span>{shakeReady ? '已开启' : '摇一摇'}</span></button>
        </div>
        {motionMessage && <p className="paper-motion-message" role="status">{motionMessage}</p>}
      </section>
      {inventoryOpen && <CardInventory game={game} dispatch={dispatch} onClose={() => setInventoryOpen(false)} />}
    </>}
    {selectedPlayerId && (selectedPlayerId !== you.id && game.match.mode === 'story' ? <RivalDetails game={game} playerId={selectedPlayerId} onClose={() => setSelectedPlayerId(null)} /> : <PlayerDetails game={game} playerId={selectedPlayerId} onClose={() => setSelectedPlayerId(null)} />)}
    {guideOpen && <GuideDialog label="技能、卡牌与角色图鉴" className="game-guide-dialog" onClose={() => setGuideOpen(false)}><ArchiveScreen archive={archive || createArchive()} storageError={storageError} inGame onHome={() => setGuideOpen(false)} /></GuideDialog>}
    {/* 动效使用浏览器顶层 popover；查图鉴和奖项时暂时隐藏，避免遮住正在阅读的内容。 */}
    <EffectLayer key={game.visuals?.[0]?.id || 'idle'} event={guideOpen || selectedPlayerId ? null : game.visuals?.[0]} players={game.players} />
  </main>;
}
