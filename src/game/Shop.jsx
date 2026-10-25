import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Coins, RefreshCw, X, ArrowUpRight, ShoppingBag, Sparkles } from 'lucide-react';
import { FIELDS, getItem } from './catalog.js';
import CardIcon from '../ui/CardIcon.jsx';
import { blessingsOf, hasBuff } from './economy.js';
import '../card-shop.css';
import '../stock-shop.css';
import ShopArtwork from '../ui/ShopArtwork';
import { refreshPrice } from './stock';
import { heroOf } from './heroes';
import { seatsForCount } from './modes';

const zones = [
  { id: 'god', name: '神明供奉', subtitle: '请神入席 · 三轮庇佑', count: 2 },
  { id: 'skill', name: '技能手牌', subtitle: '妙招在手 · 随机三张', count: 3 },
  { id: 'field', name: '场地布置', subtitle: '移步换景 · 全桌生效', count: 3 },
];
const timingLabel = item => item.category === 'god' ? '下轮起 · 持续三轮' : item.category === 'field' ? '下轮起 · 全桌一轮' : item.timing === 'after' ? '看结果后使用' : '掷骰前使用';
const buffItem = buff => getItem(buff.itemId || buff.id);

/** 供奉槽属于购买者；雷公和太岁虽作用于对手，也占施法者的槽位。 */
function offerings(game, playerId) {
  const player = game.players.find(entry => entry.id === playerId);
  return blessingsOf(player).map(buff => ({ ...buff, holderId: buff.targetId || playerId }));
}

/** 三分区卡牌商店；选择只在界面保存，购买与场地提交由规则层最终校验。 */
export default function Shop({ game, dispatch }) {
  const player = game.players.find(entry => entry.id === 'you');
  const [selected, setSelected] = useState(null);
  const [replaceId, setReplaceId] = useState('');
  const [fieldSeat, setFieldSeat] = useState(game.players.find(entry => entry.id === 'you').seat);
  const dialog = useRef(null);
  const heading = useRef(null);
  const ownGods = offerings(game, player.id);
  const stock = game.shopStock?.[player.id] || { god: [], skill: [], field: [] };
  const refreshCost = refreshPrice(game, player.id);
  const refreshCount = game.shopRefreshes?.[player.id] || 0;
  const hero = heroOf(player);
  const freeRefresh = hero?.id === 'hero-c' && refreshCount === 0;
  const submitted = game.fieldSubmissions?.find(entry => entry.userId === player.id);
  const ownedFields = FIELDS.filter(item => player.items[item.id] > 0);
  const activeLand = hasBuff(game, player, 'land');
  const priceOf = item => item.category === 'skill' && activeLand ? Math.ceil(item.price * .8) : item.price;
  const bought = item => game.purchased?.[player.id]?.includes(item.id);
  const alreadyOffered = item => ownGods.some(buff => (buff.itemId || buff.id) === item.id);

  const reason = !selected ? '' : bought(selected) ? '本轮已经购买' : priceOf(selected) > player.coins ? '金币不足，留待下回' : selected.category === 'god' && alreadyOffered(selected) ? '已在供奉这位神明' : selected.category === 'god' && ownGods.length >= 3 && !replaceId ? '请明确选择替换的供奉' : '';

  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => {
    if (selected && !dialog.current?.open) dialog.current?.showModal();
    if (!selected && dialog.current?.open) dialog.current?.close();
  }, [selected]);

  function inspect(item) {
    setReplaceId('');
    setSelected(item);
  }

  function purchase() {
    if (reason) return;
    dispatch({ type: 'BUY', userId: player.id, item: selected.id, replaceId: replaceId || undefined });
    setSelected(null);
  }

  return <section className="card-shop stock-shop" aria-labelledby="shop-title">
    <aside className="shop-counter">
      <div className="shop-counter-brand"><ShoppingBag size={19}/><span>接碗小铺<small>ROUND {String(game.round).padStart(2, '0')} · 轮间补给</small></span></div>
      <h1 id="shop-title" tabIndex={-1} ref={heading}>八张好牌，<br/><em>等你来挑。</em></h1>
      <div className="card-wallet" role="status"><span><Coins size={16}/> 我的盘缠</span><strong>{player.coins}<small>金币</small></strong><p>金币买牌 · 积分争状元</p></div>
      <div className="offering-slots"><h2>我的供奉 <span>{ownGods.length} / 3</span></h2><div>{[0, 1, 2].map(index => {
        const buff = ownGods[index];
        const item = buff && buffItem(buff);
        return <span key={index} className={item ? 'is-filled' : ''} title={item ? `${item.name} · 第 ${buff.fromRound}–${buff.untilRound} 轮${buff.holderId !== player.id ? ` · 目标 ${game.players.find(entry => entry.id === buff.holderId)?.name}` : ''}` : '空供奉位'}>{item ? <><CardIcon id={item.id} size={22}/><small>{item.name}</small></> : <><span className="offering-empty">＋</span><small>待请神</small></>}</span>;
      })}</div></div>
      {/* 短屏只滚动补给说明，让刷新和离店始终留在柜台内。 */}
      <div className="shop-counter-details">
      {ownedFields.some(item => item.target === 'seat') && <label className="stock-owned-fields">下轮吉位座位<select value={fieldSeat} onChange={event => {
        setFieldSeat(event.target.value);
        if (getItem(submitted?.item)?.target === 'seat') dispatch({ type: 'SUBMIT_FIELD', userId: player.id, item: submitted.item, seat: event.target.value });
      }}>{seatsForCount(game.players.length).map((seat, index) => <option key={seat} value={seat}>{index + 1}号座 · {game.players.find(entry => entry.seat === seat)?.name}</option>)}</select></label>}
      {ownedFields.length > 0 && <label className="stock-owned-fields">我的场地背包<select value={submitted?.item || ''} onChange={event => dispatch({ type: 'SUBMIT_FIELD', userId: player.id, item: event.target.value || null, seat: fieldSeat })}><option value="">暂不布置场地</option>{ownedFields.map(item => <option key={item.id} value={item.id}>{item.name} ×{player.items[item.id]}</option>)}</select><small>刷新只换货架，背包场地仍可布置。</small></label>}
      <div className={`shop-field-note ${game.fieldSubmissions?.length ? 'has-candidates' : ''}`}><b>下轮场地候选</b>{game.fieldSubmissions?.length ? <ul>{game.fieldSubmissions.map(entry => <li key={entry.userId}>{game.players.find(person => person.id === entry.userId)?.name}<span>{getItem(typeof entry.item === 'string' ? entry.item : entry.item?.id)?.name}</span></li>)}</ul> : <p>还没人布置，下一轮仍是标准六骰。</p>}{submitted && <button className="shop-text-button" onClick={() => dispatch({ type: 'SUBMIT_FIELD', userId: player.id, item: null })}>撤回我的场地</button>}</div>
      {hero && <div className="shop-hero-talent"><CardIcon id={hero.icon} size={17} /><div><b>{hero.skill}</b><small>{hero.description}</small></div></div>}
      </div>
      <div className="shop-counter-actions">
      <button className="stock-refresh" disabled={player.coins < refreshCost} onClick={() => { setSelected(null); dispatch({ type: 'REFRESH_SHOP', userId: player.id }); }} aria-label={`刷新全部货架，${refreshCost}金币`}><RefreshCw size={18} /><span>{freeRefresh ? '精打细算 · 免费首刷' : '换一批好牌'}<small>整组刷新 · 已刷新 {refreshCount} 次</small></span><b>{refreshCost === 0 ? '免费' : refreshCost}<small>{refreshCost === 0 ? '本次' : '金币'}</small></b></button>
      <p className="stock-refresh-note">{player.coins < refreshCost ? '盘缠不足，暂时不能刷新' : `下次 ${refreshPrice(game, player.id, 1)} 金币 · ${hero?.id === 'hero-c' ? '下一轮首刷免费' : '下一轮重置为 5'}`}</p>
      <button className="shop-leave" onClick={() => dispatch({ type: 'NEXT_ROUND' })}>离店 · 开始下一轮 <ArrowRight size={18}/></button>
      <p className="shop-counter-tip">每种商品每轮限购一张。<br/>手牌可留存，符合时机即可连续使用。</p>
      </div>
    </aside>
    <div className="shop-tabletop">
      <header className="shop-table-heading"><div><span className="shop-overline">MID-AUTUMN CARD EMPORIUM</span><h2>一桌好彩，一手好招。</h2></div><span className="stock-round-seal">本轮限定<b>捌张</b></span></header>
      <div className="stock-canopy"><span>接 碗 小 铺</span><Sparkles size={18} /><small>请神 · 备招 · 换景</small></div>
      <div className="stock-collections">{zones.map(zone => <section className={`stock-collection stock-${zone.id}`} key={zone.id} aria-label={`${zone.name}货架`}>
        <header className="stock-zone-heading"><div><span>{zone.id === 'god' ? 'BLESSINGS' : zone.id === 'skill' ? 'SKILL CARDS' : 'TABLE SCENES'}</span><h3>{zone.name}</h3></div><span className="stock-zone-count">{zone.count}<small>席</small></span></header>
        <div className="stock-card-grid">{stock[zone.id].map((id, index) => {
          const item = getItem(id);
          if (!item) return null;
          const isBought = bought(item);
          const short = priceOf(item) > player.coins;
          const count = player.items[item.id] || 0;
          return <article className={`playing-card card-${item.category} ${isBought ? 'is-purchased' : ''}`} key={item.id} style={{ '--card-tilt': `${index % 2 === 0 ? -1 : .7}deg` }}>
            <button className="playing-card-inspect" onClick={() => inspect(item)} aria-label={`查看${item.name}，${priceOf(item)}金币${isBought ? '，本轮已购买' : ''}`}>
              <span className="playing-card-top"><span>{item.category === 'god' ? '神明' : item.category === 'field' ? '场地' : item.group}</span><span className="playing-card-serial">{String(index + 1).padStart(2, '0')}</span></span>
              <ShopArtwork item={item} />
              <h3>{item.name}</h3><span className="playing-card-timing">{timingLabel(item)}</span>
              <p>{item.description}</p>
              <span className="playing-card-foot"><span>{item.category === 'god' ? alreadyOffered(item) ? '供奉中' : '请神入席' : `持有 ${count} 张`}</span><ArrowUpRight size={14}/></span>
            </button>
            <button className={`card-buy-tag ${isBought ? 'is-done' : ''}`} onClick={() => inspect(item)} disabled={isBought} aria-label={`${isBought ? '本轮已购买' : '购买'}${item.name}`}>
              {isBought ? <><Check size={14}/> 已售罄</> : <><Coins size={14}/><b>{priceOf(item)}</b><span>{short ? '攒点钱' : item.category === 'god' ? '供奉' : '购买'}</span></>}
            </button>
            {zone.id === 'field' && count > 0 && <button className="card-submit-field" disabled={submitted?.item === item.id} onClick={() => dispatch({ type: 'SUBMIT_FIELD', userId: player.id, item: item.id, seat: fieldSeat })}>{submitted?.item === item.id ? '已布置候选' : '布置下轮'}</button>}
          </article>;
        })}</div>
        <footer className="stock-zone-description">{zone.subtitle}</footer>
      </section>)}</div>
      <div className="shop-receipt" role="status" aria-live="polite"><span>桌上新鲜事</span><p>{game.event}</p></div>
      <details className="shop-purchase-log"><summary>最近采购与对局记录</summary><ul>{game.log.map((entry, index) => <li key={index}>{entry}</li>)}</ul></details>
    </div>
    <dialog className="card-detail-dialog" ref={dialog} onCancel={() => setSelected(null)} onClose={() => setSelected(null)}>{selected && <>
      <button className="card-dialog-close" aria-label="关闭商品详情" onClick={() => setSelected(null)}><X size={20}/></button>
      <div className={`card-detail-art card-${selected.category}`}><ShopArtwork item={selected} /></div>
      <span className="shop-overline">{timingLabel(selected)}</span><h2>{selected.name}</h2><p>{selected.description}</p>
      {selected.category === 'god' && <p className="card-help">神明占一个供奉位，从第 {game.round + 1} 轮持续至第 {game.round + 3} 轮。需要指定角色的神明，请在离店后的轮初阶段发动。</p>}
      {selected.category === 'god' && ownGods.length >= 3 && <label className="card-option-label">供奉已满，选择一位替换<select value={replaceId} onChange={event => setReplaceId(event.target.value)}><option value="">请选择被替换的神明</option>{ownGods.map((buff, index) => <option key={`${buff.id}-${index}`} value={buff.id}>{buffItem(buff)?.name}</option>)}</select></label>}
      {selected.category === 'field' && <p className="card-help">购买后，点击牌下方「布置下轮」。每人可提交一张，未中选的牌会退回。</p>}
      {selected.target === 'seat' && <p className="card-help">购买后在柜台选择「下轮吉位座位」，再布置场地。座位收益对全场公开，可用换位牌争取。</p>}
      <div className="card-detail-cost"><span>你的盘缠 <b>{player.coins}</b></span><strong><Coins size={19}/>{priceOf(selected)}<small>金币</small></strong></div>
      {reason && <p className="card-disabled-reason" role="status">{reason}</p>}
      <button className="card-confirm-button" disabled={!!reason} onClick={purchase}>{selected.category === 'god' ? '确认供奉' : '买入手牌'} <ArrowRight size={17}/></button>
    </>}</dialog>
  </section>;
}
