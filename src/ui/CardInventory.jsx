import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Layers3, X } from 'lucide-react';
import { SKILLS, getItem } from '../game/catalog.js';
import { getAward } from '../game/config.js';
import { canUseItem, legalTargets } from '../game/state.js';
import { blessingsOf } from '../game/economy.js';
import CardIcon from './CardIcon.jsx';
import ShopArtwork from './ShopArtwork.jsx';
import '../card-shop.css';
import { talismanBuffs } from '../game/god-talismans';

const stageName = timing => timing === 'after' ? '看结果后' : '掷骰前';

/** 显式选择骰子时，提前排除不会改变结果的选择，不消耗无效牌。 */
function canSelectDie(itemId, value) {
  if (itemId === 'paint_red') return value !== 4;
  if (itemId === 'set_six') return value !== 6;
  if (itemId === 'set_one') return value !== 1;
  if (itemId === 'plus_one') return value < 6;
  if (itemId === 'minus_one') return value > 1;
  return true;
}

/** 用 SVG 点阵表达骰面，选中状态由按钮语义和轮廓共同表达。 */
function DieFace({ value }) {
  const spots = { 1: [[16,16]], 2: [[8,8],[24,24]], 3: [[8,8],[16,16],[24,24]], 4: [[8,8],[24,8],[8,24],[24,24]], 5: [[8,8],[24,8],[16,16],[8,24],[24,24]], 6: [[8,7],[24,7],[8,16],[24,16],[8,25],[24,25]] };
  return <svg viewBox="0 0 32 32" aria-hidden="true" className={value === 4 ? 'is-red' : ''}>{spots[value]?.map(([x, y], index) => <circle key={index} cx={x} cy={y} r="2.6"/>)}</svg>;
}

/** 原生模态手牌抽屉；连续使用只清空选择，保留背包和焦点隔离。 */
export default function CardInventory({ game, dispatch, onClose }) {
  const dialog = useRef(null);
  const player = game.players.find(entry => entry.id === 'you');
  const [filter, setFilter] = useState('全部');
  const [selectedId, setSelectedId] = useState(null);
  const [targetIds, setTargetIds] = useState([]);
  const [diceIndices, setDiceIndices] = useState([]);
  const [awardIndex, setAwardIndex] = useState('');
  const [buffId, setBuffId] = useState('');
  const [cardId, setCardId] = useState('');
  const selected = getItem(selectedId);
  const canPlay = id => game.players[game.turnIndex]?.id === player.id && canUseItem(game, id);
  const owned = SKILLS.filter(item => (player.items[item.id] || 0) > 0);
  const usable = owned.filter(item => canPlay(item.id));
  const shown = owned.filter(item => filter === '全部' || (filter === '现在可用' ? canPlay(item.id) : stageName(item.timing) === filter));
  const targets = selected ? legalTargets(game, selected.id) : [];
  const target = game.players.find(entry => entry.id === targetIds[0]);
  const isTalisman = ['summon_god', 'dismiss_god'].includes(selectedId);
  const godTargets = isTalisman ? talismanBuffs(game, selectedId, target, player) : target ? blessingsOf(target).filter(buff => !['thunder', 'unlucky'].includes(buff.id)) : [];
  // 驱邪按神明和来源区分同名月老，其余神符保持原来的单神明选择。
  const buffKey = buff => selectedId === 'exorcism' ? `${buff.id}:${buff.sourceId}` : buff.id;
  const selectedGod = godTargets.find(buff => buffKey(buff) === buffId);
  const needsGod = selected && ['god', 'selfGod'].includes(selected.target);
  const needsPlayer = selected && ['player', 'twoPlayers', 'award', 'god'].includes(selected.target);
  const needsDice = selected && ['die', 'twoDice', 'sourceDice'].includes(selected.target);
  const diceNeeded = selected?.target === 'die' ? 1 : 2;
  const playerNeeded = selected?.target === 'twoPlayers' ? 2 : 1;
  const ready = !!selected && canPlay(selected.id) && (!needsPlayer || targetIds.length === playerNeeded) && (!needsDice || diceIndices.length === diceNeeded) && (selected.target !== 'award' || awardIndex !== '') && (!needsGod || !!selectedGod) && (selected.target !== 'card' || !!cardId) && (selected.target !== 'sourceDice' || game.dice[diceIndices[0]] !== game.dice[diceIndices[1]]);

  useEffect(() => {
    const modal = dialog.current;
    modal?.showModal();
    return () => { if (modal?.open) modal.close(); };
  }, []);

  function clearSelection(id = null) {
    setSelectedId(id);
    setTargetIds([]);
    setDiceIndices([]);
    setAwardIndex('');
    setBuffId('');
    setCardId('');
  }

  function selectPlayer(id) {
    setBuffId('');
    setTargetIds(current => selected.target === 'twoPlayers' ? current.includes(id) ? current.filter(value => value !== id) : [...current.slice(-1), id] : [id]);
  }

  function selectDie(index) {
    setDiceIndices(current => {
      if (current.includes(index)) return current.filter(value => value !== index);
      // 双骰和复制保留选择顺序；选第三颗时只替换最早的一颗。
      return [...current, index].slice(-diceNeeded);
    });
  }

  function useSelected() {
    if (!ready) return;
    // 骰碗位于模态抽屉后方，改骰后先收起手牌，才能看见真实点数的演出。
    const showDice = selected.timing === 'after' || ['miracle', 'mirror'].includes(selected.id);
    dispatch({ type: 'USE_ITEM', item: selected.id, targetId: targetIds[0], targetIds, diceIndices, awardIndex: awardIndex === '' ? undefined : Number(awardIndex), buffId: selectedGod?.id || undefined, ...(selected.id === 'exorcism' ? { buffSourceId: selectedGod?.sourceId } : {}), cardId: cardId || undefined });
    clearSelection();
    if (showDice) onClose();
  }

  return <dialog ref={dialog} className="card-inventory-dialog" onCancel={onClose} onClose={onClose} aria-labelledby="inventory-title">
    <header className="inventory-header"><div><span className="shop-overline">YOUR HAND</span><h2 id="inventory-title"><Layers3 size={22}/> 我的手牌 <span>{owned.reduce((sum, item) => sum + player.items[item.id], 0)}</span></h2><p>现在可用 {usable.reduce((sum, item) => sum + player.items[item.id], 0)} 张 · 符合时机即可连续使用</p></div><button className="card-dialog-close" onClick={onClose} aria-label="关闭手牌"><X size={21}/></button></header>
    <div className="inventory-filters" aria-label="手牌时机筛选">{['全部', '现在可用', '掷骰前', '看结果后'].map(value => <button key={value} className={filter === value ? 'is-active' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}</button>)}</div>
    <div className={`inventory-layout ${selected ? 'has-selection' : ''}`}>
      <div className="inventory-card-grid">{shown.map(item => {
        const available = canPlay(item.id);
        return <button key={item.id} className={`inventory-card card-skill ${selectedId === item.id ? 'is-selected' : ''} ${available ? 'is-available' : 'is-unavailable'}`} onClick={() => clearSelection(item.id)} aria-pressed={selectedId === item.id}>
          <span className="inventory-card-quantity">×{player.items[item.id]}</span><span className="inventory-card-art"><ShopArtwork item={item} /></span><b>{item.name}</b><small>{available ? '现在可用' : stageName(item.timing)}</small>
        </button>;
      })}{!shown.length && <div className="inventory-empty"><Layers3 size={35}/><h3>{owned.length ? '这个时机暂时没有手牌' : '手牌暂时用完啦'}</h3><p>轮末去接碗小铺，补几张好招。</p></div>}</div>
      {selected && <section className="inventory-selection" aria-labelledby="selected-card-title"><button className="inventory-back" onClick={() => clearSelection()}><ArrowLeft size={14}/> 返回手牌</button><div className="inventory-selected-heading"><CardIcon id={selected.id} size={35}/><div><span>{selected.group} · {stageName(selected.timing)}</span><h3 id="selected-card-title">{selected.name}</h3></div></div><div className="inventory-selected-art"><ShopArtwork item={selected} /></div><p>{selected.description}</p>
        {!canPlay(selected.id) && <p className="card-disabled-reason">{game.players[game.turnIndex]?.id !== player.id ? '请等到自己接碗时使用' : game.stage !== (selected.timing === 'after' ? 'review' : 'ready') ? `请在${stageName(selected.timing)}使用` : '当前没有合法目标或受到封印，手牌不会消耗'}</p>}
        {needsPlayer && <fieldset className="card-target-group"><legend>{selected.target === 'twoPlayers' ? '选择两位对手交换座位' : selected.id === 'gift' ? '赠送给谁' : selected.id === 'substitute' ? '选择预先指定的替身' : '选择目标'}</legend><div>{targets.map(entry => <button key={entry.id} className={targetIds.includes(entry.id) ? 'is-selected' : ''} aria-pressed={targetIds.includes(entry.id)} onClick={() => selectPlayer(entry.id)}>{entry.name}{targetIds.includes(entry.id) && <Check size={13}/>}</button>)}</div>{!targets.length && <p>暂无符合条件的目标。</p>}</fieldset>}
        {needsDice && <fieldset className="card-target-group"><legend>{selected.target === 'sourceDice' ? '依次选择来源骰、目标骰' : `选择${diceNeeded === 1 ? '一' : '两'}颗骰子`}</legend><div className="inventory-dice-options">{game.dice.map((value, index) => <button key={index} className={diceIndices.includes(index) ? 'is-selected' : ''} disabled={!canSelectDie(selected.id, value)} onClick={() => selectDie(index)} aria-pressed={diceIndices.includes(index)} aria-label={`第${index + 1}颗，${value}点${diceIndices.includes(index) ? '，已选' : ''}`}><DieFace value={value}/><small>{selected.target === 'sourceDice' && diceIndices.includes(index) ? diceIndices[0] === index ? '来源' : '目标' : `第 ${index + 1} 颗`}</small></button>)}</div>{selected.target === 'sourceDice' && diceIndices.length === 2 && <p className="card-help">第 {diceIndices[1] + 1} 颗将变成 {game.dice[diceIndices[0]]} 点。{game.dice[diceIndices[0]] === game.dice[diceIndices[1]] && '请选择点数不同的骰子。'}</p>}</fieldset>}
        {selected.target === 'award' && <label className="card-option-label">选择自己送出的奖项<select value={awardIndex} onChange={event => setAwardIndex(event.target.value)}><option value="">请选择一份奖项</option>{player.awards.map((id, index) => <option key={index} value={index}>{getAward(id)?.name} · {getAward(id)?.points} 分（第 {index + 1} 份）</option>)}</select></label>}
        {needsGod && (target || selected.target === 'selfGod') && <label className="card-option-label">{selected.id === 'summon_god' ? '请来哪一位神明' : selected.id === 'dismiss_god' ? '解除自己的哪一项神明负面效果' : '解除哪一位神明'}<select value={buffId} onChange={event => setBuffId(event.target.value)}><option value="">{selected.target === 'selfGod' ? '请选择神明负面效果' : '请选择正面神明'}</option>{godTargets.map(buff => <option key={`${buff.id}-${buff.sourceId}`} value={buffKey(buff)}>{getItem(buff.id)?.name} · 第 {buff.untilRound} 轮到期{selected.id === 'exorcism' ? ` · 来源：${game.players.find(entry => entry.id === buff.sourceId)?.name}` : ''}</option>)}</select></label>}
        {selected.target === 'card' && <label className="card-option-label">选择另一张技能卡回收<select value={cardId} onChange={event => setCardId(event.target.value)}><option value="">请选择待销毁的牌</option>{owned.filter(item => item.id !== selected.id).map(item => <option key={item.id} value={item.id}>{item.name} · 回收 {Math.floor(item.price * .6)} 金币</option>)}</select></label>}
        <button className="card-confirm-button" disabled={!ready} onClick={useSelected}>确认使用 <ArrowRight size={17}/></button><small className="inventory-use-note">消耗一张 · 使用后仍可继续出牌</small>
      </section>}
    </div>
    <footer className="inventory-footer" role="status" aria-live="polite">{game.event}</footer>
  </dialog>;
}
