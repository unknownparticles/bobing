import { AWARDS, COUNTERCLOCKWISE_SEATS, MAX_ROUNDS, ROUND_COINS, pointsOf } from './config';
import { CATALOG, getItem } from './catalog';
import { evaluateDice, rollRank } from './rules';
import { applyBlessing, applyCard, canUseItem } from './effects';
import { applyScoreChanges, hasBuff, removeBuff, scoreOf } from './economy';
import { generateRoll, rollFace } from './rolls';
import { botShoppingList } from './bots';
import { drawStock, initializeShop, refreshPrice } from './stock';
import { getHero, canUseHeroReroll } from './heroes';
import { captureChampion } from './champion';
import { queueVisual } from './visuals';

export { scoreOf, rankOf, blessingsOf } from './economy';
export { canUseItem, legalTargets, getUseOptions } from './effects';

/** 新局保留身份与外观，清空所有资源、关系和场地，不复用上一局的对象。 */
export function createGame(players) {
  const ordered = COUNTERCLOCKWISE_SEATS.map(seat => players.find(player => player.seat === seat));
  if (players.length !== 6 || ordered.some(player => !player) || new Set(players.map(player => player.id)).size !== 6) throw new Error('对局需要六名玩家，分别占据六个不同座位');
  return {
    players: ordered.map(player => ({ ...player, ...(player.id === 'you' && getHero(player.portrait) ? { gender: getHero(player.portrait).gender } : {}), awards: [], awardRanks: [], scoreAdjustment: 0, coins: 0,
      items: Object.fromEntries(CATALOG.filter(item => item.category !== 'god').map(item => [item.id, item.id === 'reroll' ? 1 : 0])),
      buffs: [], partnerId: null, protected: false, skip: false, sealed: false, sealPending: false,
      reflect: false, substituteId: null, lucky: false, unlucky: false, lastDice: null, guardianRound: null, championRound: null, heroRerollRound: null, heroGuardRound: null,
    })),
    pool: Object.fromEntries(AWARDS.map(award => [award.id, award.count])),
    round: 1, turnIndex: 0, stage: 'ready', purchased: {}, shopStock: {}, shopRefreshes: {}, field: null, fieldSubmissions: [], priority: [], diceCount: 6,
    dice: [4, 2, 6, 1, 5, 3], preview: null, pendingDice: null, visuals: [], visualSequence: 0,
    event: '八轮争状元，第一碗由你开始！', eventType: 'normal', log: ['每人获赠一张重掷券；有牌就能按时机继续出招'],
  };
}

/** 旧目标选择入口继续共用真实库存与保护校验。 */
export function stealTargets(state) {
  return state.players.filter(player => player.id !== state.players[state.turnIndex].id && player.awards.length > 0 && !player.protected);
}

/** 同回合多次重掷按剩余券数判断，之前用过其他牌不影响。 */
export const canReroll = state => canUseItem(state, 'reroll');

/** 当前商店实付价；只有技能卡享受土地折扣。 */
export function priceOf(state, player, card) {
  return card.category === 'skill' && hasBuff(state, player, 'land') ? Math.ceil(card.price * .8) : card.price;
}

function record(state, event = state.event, type = state.eventType) {
  state.event = event;
  state.eventType = type;
  state.log = [event, ...state.log].slice(0, 30);
  return state;
}

function purchase(state, action) {
  const card = getItem(action.item);
  const player = state.players.find(entry => entry.id === action.userId);
  if (state.stage !== 'shop' || !card || !player || state.purchased[player.id]?.includes(card.id)) return false;
  if (!state.shopStock?.[player.id]?.[card.category]?.includes(card.id)) return false;
  const price = priceOf(state, player, card);
  if (player.coins < price) return false;
  if (card.category === 'god' && !applyBlessing(state, player, card, action)) return false;
  if (card.category !== 'god') player.items[card.id] = (player.items[card.id] || 0) + 1;
  player.coins -= price;
  state.purchased[player.id] = [...(state.purchased[player.id] || []), card.id];
  record(state, `${player.name}${card.category === 'god' ? '供奉' : '购买'}「${card.name}」，花费${price}金币`, 'shop');
  return true;
}

function beginTurn(state, index) {
  const player = state.players[index];
  state.turnIndex = index;
  state.preview = null;
  state.pendingDice = null;
  player.protected = false;
  player.reflect = false;
  player.substituteId = null;
  player.sealed = Boolean(player.sealPending);
  player.sealPending = false;
  if (player.skip && !hasBuff(state, player, 'longevity')) {
    player.skip = false;
    state.stage = 'settled';
    record(state, `${player.name}去了一趟厕所，跳过本次行动`, 'skip');
  } else {
    player.skip = false;
    state.stage = 'ready';
    record(state, `${player.name} 接碗，轮到${player.id === 'you' ? '你' : player.name}了`);
  }
}

/** 场地只在整轮开始时生成队列，座位交换不会让本轮玩家重复行动。 */
function nextRound(state, rng) {
  state.round += 1;
  for (const player of state.players) {
    for (const buff of [...player.buffs]) if (buff.untilRound < state.round) removeBuff(state, player, buff.id, buff.sourceId);
  }
  const contenders = state.fieldSubmissions.filter(entry => state.players.find(player => player.id === entry.userId)?.items[entry.item] > 0);
  const chosen = contenders[Math.floor(rng() * contenders.length)];
  state.field = chosen ? { id: chosen.item, sourceId: chosen.userId } : null;
  if (chosen) state.players.find(player => player.id === chosen.userId).items[chosen.item] -= 1;
  state.fieldSubmissions = [];
  const id = state.field?.id;
  state.diceCount = { five_dice: 5, seven_dice: 7, eight_dice: 8 }[id] || 6;
  if (id === 'shuffle') {
    const seats = [...COUNTERCLOCKWISE_SEATS];
    for (let index = seats.length - 1; index > 0; index -= 1) {
      const other = Math.floor(rng() * (index + 1));
      [seats[index], seats[other]] = [seats[other], seats[index]];
    }
    state.players.forEach((player, index) => { player.seat = seats[index]; });
  }
  if (id === 'rotate') state.players.forEach(player => { player.seat = COUNTERCLOCKWISE_SEATS[(COUNTERCLOCKWISE_SEATS.indexOf(player.seat) + 5) % 6]; });
  let seats = [...COUNTERCLOCKWISE_SEATS];
  if (id === 'reverse') seats = [seats[0], ...seats.slice(1).reverse()];
  let ordered = seats.map(seat => state.players.find(player => player.seat === seat));
  if (id === 'leader_last') ordered.sort((first, second) => scoreOf(first) - scoreOf(second));
  state.players = [...state.priority.map(playerId => ordered.find(player => player.id === playerId)), ...ordered.filter(player => !state.priority.includes(player.id))];
  state.priority = [];
  state.dice = [4, 2, 6, 1, 5, 3, 2, 5].slice(0, state.diceCount);
  beginTurn(state, 0);
  if (chosen) {
    for (const player of state.players) queueVisual(state, { kind: 'field', sourceId: chosen.userId, targetId: player.id, icon: chosen.item, title: `${getItem(chosen.item).name}作用于${player.name}` });
  }
  if (chosen) record(state, `${getItem(chosen.item).name}生效，本轮${state.diceCount}颗骰子；${state.players[0].name}先行动`, 'field');
}

/** reducer只读取动作携带的随机序列，旧计时器、非法目标与库存不足均无副作用。 */
export function gameReducer(state, action) {
  if (action.type === 'ACK_VISUAL') {
    if (state.visuals?.[0]?.id !== action.id) return state;
    return { ...state, visuals: state.visuals.slice(1) };
  }
  if (action.type === 'RESTART') return state.stage === 'finished' ? createGame(state.players) : state;
  if (state.stage === 'finished') return state;
  // 每次先克隆再校验，复杂组合中任何失败都不会部分扣款或转移奖项。
  const next = structuredClone(state);
  for (const player of next.players) {
    player.scoreAdjustment ??= 0;
    player.awardRanks ??= [];
    while (player.awardRanks.length < player.awards.length) player.awardRanks.push(0);
  }
  let cursor = 0;
  const rng = () => Math.min(.999999999, Math.max(0, action.entropy?.[cursor++] ?? .5));
  const active = next.players[next.turnIndex];
  switch (action.type) {
    case 'BUY': return purchase(next, action) ? next : state;
    case 'REFRESH_SHOP': {
      const player = next.players.find(entry => entry.id === action.userId);
      if (next.stage !== 'shop' || !player) return state;
      const price = refreshPrice(next, player.id);
      if (player.coins < price) return state;
      player.coins -= price;
      next.shopStock[player.id] = drawStock(rng);
      next.shopRefreshes[player.id] = (next.shopRefreshes[player.id] || 0) + 1;
      return record(next, `${player.name}${price === 0 ? '发动「精打细算」，免费' : `花费${price}金币`}刷新八张货架，下次${refreshPrice(next, player.id)}金币`, 'shop');
    }
    case 'HERO_REROLL': {
      if (!canUseHeroReroll(next) || !Number.isInteger(action.diceIndex) || action.diceIndex < 0 || action.diceIndex >= next.dice.length) return state;
      active.heroRerollRound = next.round;
      next.pendingDice = next.dice.map((value, index) => index === action.diceIndex ? rollFace(next, rng) : value);
      next.stage = 'rolling';
      next.preview = null;
      queueVisual(next, { kind: 'skill', sourceId: active.id, targetId: active.id, icon: 'reroll_one', title: `${active.name}发动再搏一次，重掷第${action.diceIndex + 1}颗` });
      return record(next, `${active.name}发动「再搏一次」，免费重掷第${action.diceIndex + 1}颗骰子`, 'skill');
    }
    case 'USE_ITEM': return applyCard(next, action, rng) ? record(next) : state;
    case 'SUBMIT_FIELD': {
      const player = next.players.find(entry => entry.id === action.userId);
      if (next.stage !== 'shop' || !player) return state;
      if (action.item !== null && (getItem(action.item)?.category !== 'field' || !(player.items[action.item] > 0))) return state;
      next.fieldSubmissions = next.fieldSubmissions.filter(entry => entry.userId !== player.id);
      if (action.item) next.fieldSubmissions.push({ userId: player.id, item: action.item });
      return record(next, action.item ? `${player.name}提交场地「${getItem(action.item).name}」` : `${player.name}收回了场地候选`, 'field');
    }
    case 'ROLL':
      if (next.stage !== 'ready') return state;
      next.stage = 'rolling';
      next.pendingDice = generateRoll(next, rng);
      return record(next, `${active.name} 正在摇碗……`, 'rolling');
    case 'SHOW_ROLL': {
      if (next.stage !== 'rolling') return state;
      const dice = action.dice || next.pendingDice;
      if (!dice || dice.length !== next.diceCount) return state;
      next.preview = evaluateDice(dice);
      next.dice = [...dice];
      next.pendingDice = null;
      next.stage = 'review';
      return record(next, `${active.name} 掷出「${next.preview.label}」`, 'review');
    }
    case 'REROLL': return applyCard(next, { ...action, item: 'reroll' }, rng) ? record(next) : state;
    case 'CONFIRM': {
      if (next.stage !== 'review') return state;
      const id = next.preview.awardId;
      active.lastDice = [...next.dice];
      next.stage = 'settled';
      if (id === 'zhuangyuan' && next.pool.zhuangyuan === 0) {
        const capture = captureChampion(next, active, next.preview, rng);
        if (capture) return record(next, `${active.name}以「${next.preview.label}」抢走${capture.fromName}的最低档状元！`, 'jackpot');
        if (hasBuff(next, active, 'kitchen')) {
          active.coins += 5;
          queueVisual(next, { kind: 'score', sourceId: active.id, targetId: active.id, icon: 'kitchen', delta: 5, title: `${active.name}未抢到状元，灶君暖席补给5金币` });
        }
        return record(next, `${active.name}掷出「${next.preview.label}」，没有可抢的更低等级状元`, 'normal');
      }
      if (id && next.pool[id] > 0) {
        next.pool[id] -= 1;
        active.awards.push(id);
        active.awardRanks.push(id === 'zhuangyuan' ? rollRank(next.preview) : 0);
        const base = pointsOf(id);
        const bonus = hasBuff(next, active, 'wealth') ? base / 4 : 0;
        active.scoreAdjustment += bonus;
        queueVisual(next, { kind: id === 'zhuangyuan' ? 'champion' : 'transfer', sourceId: active.id, targetId: active.id, icon: id === 'zhuangyuan' ? 'champion' : 'gift', awardId: id, delta: base + bonus, title: `${active.name}领取${next.preview.label}，获得${base + bonus}分` });
        applyScoreChanges(next, { [active.id]: base + bonus });
        if (hasBuff(next, active, 'champion') && ['sanhong', 'duitang', 'zhuangyuan'].includes(id) && active.championRound !== next.round) { active.coins += 10; active.championRound = next.round; }
        return record(next, `${active.name}获得「${next.preview.label}」${bonus ? `，财神添${bonus}分` : ''}`, id === 'zhuangyuan' ? 'jackpot' : 'award');
      }
      if (hasBuff(next, active, 'kitchen')) {
        active.coins += 5;
        queueVisual(next, { kind: 'score', sourceId: active.id, targetId: active.id, icon: 'kitchen', delta: 5, title: `${active.name}的灶君暖席补给5金币` });
      }
      return record(next, id ? `${active.name}掷出「${next.preview.label}」，该奖项已发完` : `${active.name}这一碗没有中奖`);
    }
    case 'ADVANCE': {
      if (next.stage !== 'settled') return state;
      if (next.turnIndex < next.players.length - 1) { beginTurn(next, next.turnIndex + 1); return next; }
      if (next.round >= MAX_ROUNDS) { next.stage = 'finished'; return record(next, '八轮已毕，今晚状元揭晓！', 'finished'); }
      const income = next.field?.id === 'harvest' ? 30 : ROUND_COINS;
      for (const player of next.players) {
        player.coins += income + (hasBuff(next, player, 'salary') ? 10 : 0);
        if (hasBuff(next, player, 'salary')) queueVisual(next, { kind: 'score', sourceId: player.id, targetId: player.id, icon: 'salary', delta: 10, title: `${player.name}的禄神添财额外获得10金币` });
      }
      next.stage = 'shop';
      next.purchased = {};
      initializeShop(next, rng);
      for (const player of next.players.filter(entry => entry.id !== 'you')) {
        for (const choice of botShoppingList(player, next)) purchase(next, typeof choice === 'string' ? { userId: player.id, item: choice } : { ...choice, userId: player.id });
        const field = CATALOG.find(card => card.category === 'field' && player.items[card.id] > 0);
        if (field) next.fieldSubmissions.push({ userId: player.id, item: field.id });
      }
      return record(next, `第${next.round}轮结束，每人获得${income}金币，准备下一轮好招`, 'round-end');
    }
    case 'NEXT_ROUND': if (next.stage !== 'shop') return state; nextRound(next, rng); return next;
    default: return state;
  }
}
