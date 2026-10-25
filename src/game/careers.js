import { getItem } from './catalog';
import { emitEvent } from './events';
import { queueVisual } from './visuals';

const CAREERS = {
  procurement: { name: '内部渠道', icon: 'land', description: '每次商店首笔技能卡购买减5金币，最低1金币；与土地优惠取更低价格，不叠加。失败不消费资格。' },
  boss: { name: '财大气粗', icon: 'wealth', description: '开局40金币，每轮在通用收入之外再得10金币。采购仍须付费、遵守自己的货架与供奉槽位，金币不计积分。' },
  hr: { name: '关系网', icon: 'substitute', description: '初始1人脉，每个新轮次+1，上限3。行动前公开指定人脉对象；本轮首次未被其他防御处理的单目标负面技能，可花1人脉转给该对象。每轮一次；对象是出招者或不是合法目标时不转移。' },
  tech: { name: '厚积成器', icon: 'paint_red', description: '每次正式投掷最终结算后+1资历，上限3；跳过、重投不额外增长。结果阶段花3资历，将一颗非四点改成四点，每轮一次且必须改善奖型。纯改点不推进预告。' },
  finance: { name: '预算有方', icon: 'salary', description: '轮末先按未发本轮收入前的余额计息。每留20金币返4金币，每轮最多12金币；本金越少，利息越少。' },
  sales: { name: '乘胜追击', icon: 'reroll_two', description: '每轮首次成功夺得奖项，补一张双骰重投。被挡不补，双偷也只补一张；库存可跨轮保留。' },
  project: { name: '统筹安排', icon: 'swap_seat', description: '每桌3次、每轮最多一次：行动前免费与合法对手换位，仍可被抵挡或转移，合法发动即消耗次数。本轮队列不变；成功换位再获下一轮先手，不增加行动次数。' },
  qa: { name: '缺陷修正', icon: 'plus_one', description: '每轮结果阶段可免费把一颗骰子加一或减一，范围1～6、不循环，必须严格改善奖型。只改一颗，不算真实投掷，不推进预告。' },
  admin: { name: '后勤保障', icon: 'lucky_bag', description: '每轮正常行动开始，从保护罩、单骰重投、福气贴中给库存最少的一种补一张；同数按此顺序。每种最多补到2张；跳过行动不补。' },
  risk: { name: '风险预案', icon: 'reflect', description: '每轮1层预案：既有防御未处理的首张单目标负面技能反弹给出招者。可被抵挡，不再反弹或转移；全桌场地不触发。可以先用低成本攻击消耗预案。' },
};

/** 仅章节电脑拥有职业；复用头像和主角外观不会授予职业能力。 */
export function careerOf(player) {
  if (player?.id === 'you' || !['department', 'company'].includes(player?.careerTier)) return undefined;
  const definition = CAREERS[player.career];
  if (!definition) return undefined;
  if (player.careerTier === 'department' && player.career === 'finance') return { ...definition, description: '轮末按未发本轮收入前的余额计息：每留20金币返2金币，每轮最多6金币。' };
  if (player.careerTier === 'department' && player.career === 'project') return { ...definition, description: '每桌2次、每轮最多一次：行动前免费与合法对手换位，仍可被抵挡或转移，合法发动即消耗次数。本轮队列不变；供奉地理仙后可获得其换位收益。' };
  return definition;
}

/** 重开与晋级重置全部职业资源，不沿用传入对象里的旧成长。 */
export function initialCareer(player) {
  if (!careerOf(player)) return null;
  return { contacts: player.career === 'hr' ? 1 : 0, contactId: null, contactRound: null, experience: 0,
    swapsLeft: player.career === 'project' ? player.careerTier === 'company' ? 3 : 2 : 0,
    usedRound: null, selectionRound: null, rebateRound: null, supplyRound: null, salesRound: null, riskRound: null,
    growthRound: 1, settledRound: null, incomeRound: null,
  };
}

/** 统一记录真实职业发动；副本上的电脑试算不会污染真实状态。 */
export function announceCareer(game, player, detail, targetId = player.id) {
  const career = careerOf(player);
  const message = `${player.name}发动「${career.name}」：${detail}`;
  game.event = message;
  game.eventType = 'skill';
  game.log = [message, ...game.log].slice(0, 30);
  emitEvent(game, 'career', player.id, { career: player.career, targetId, detail });
  queueVisual(game, { kind: 'skill', sourceId: player.id, targetId, icon: career.icon, title: message });
}

/** 新轮只增长一次；人脉关系到本人接碗时才到期。 */
export function beginCareerRound(game) {
  for (const player of game.players) {
    const state = player.careerState;
    if (!careerOf(player) || state.growthRound === game.round) continue;
    state.growthRound = game.round;
    if (player.career === 'hr') state.contacts = Math.min(3, state.contacts + 1);
  }
}

/** 接碗先使旧人脉到期；厕所跳过时不发行政补给。 */
export function beginCareerTurn(game, player, skipped) {
  if (!careerOf(player)) return;
  const state = player.careerState;
  state.contactId = null;
  state.contactRound = null;
  if (skipped || player.career !== 'admin' || state.supplyRound === game.round) return;
  state.supplyRound = game.round;
  const itemId = ['protect', 'reroll_one', 'lucky_note'].reduce((best, id) => (player.items[id] || 0) < (player.items[best] || 0) ? id : best);
  if ((player.items[itemId] || 0) >= 2) return;
  player.items[itemId] = (player.items[itemId] || 0) + 1;
  emitEvent(game, 'acquire', player.id, { itemId });
  announceCareer(game, player, `补给一张${getItem(itemId).name}`);
}

/** 正式行动最终结算才增长资历，改骰和重复确认不能重复触发。 */
export function settleCareerThrow(game, player) {
  if (!careerOf(player) || player.career !== 'tech' || player.formalThrowRound !== game.round || player.careerState.settledRound === game.round) return;
  player.careerState.settledRound = game.round;
  player.careerState.experience = Math.min(3, player.careerState.experience + 1);
  announceCareer(game, player, `资历积累至${player.careerState.experience}/3`);
}

/** 在通用收入前调用，利息不把刚发的收入重复计为本金。 */
export function settleCareerIncome(game, player) {
  if (!careerOf(player) || player.careerState.incomeRound === game.round) return;
  player.careerState.incomeRound = game.round;
  let amount = 0;
  if (player.career === 'boss') amount = 10;
  if (player.career === 'finance') {
    const rate = player.careerTier === 'company' ? 4 : 2;
    amount = Math.min(rate * 3, Math.floor(player.coins / 20) * rate);
  }
  if (amount) { player.coins += amount; announceCareer(game, player, `额外获得${amount}金币`); }
}

/** 成功转移真实奖项后补牌；被抵挡、交换和普通领奖不调用本入口。 */
export function careerStoleAward(game, player) {
  if (!careerOf(player) || player.career !== 'sales' || player.careerState.salesRound === game.round) return;
  player.careerState.salesRound = game.round;
  player.items.reroll_two += 1;
  emitEvent(game, 'acquire', player.id, { itemId: 'reroll_two' });
  announceCareer(game, player, '夺奖得手，补一张双骰重投');
}

/** 首购优惠与土地折扣择低，不连叠；成功购买后才消费资格。 */
export function careerPrice(game, player, card, ordinaryPrice) {
  if (!careerOf(player) || player.career !== 'procurement' || card.category !== 'skill' || player.careerState.rebateRound === game.round) return ordinaryPrice;
  return Math.min(ordinaryPrice, Math.max(1, card.price - 5));
}

/** 返回重定向目标；外层随后只检查抵挡，不能再反弹或转移。 */
export function careerRedirect(game, actor, target, itemId, legalIds) {
  if (!careerOf(target)) return null;
  const state = target.careerState;
  if (target.career === 'risk' && state.riskRound !== game.round) {
    state.riskRound = game.round;
    announceCareer(game, target, `将${getItem(itemId).name}反弹给${actor.name}`, actor.id);
    return { target: actor, kind: 'reflect', icon: 'reflect' };
  }
  if (target.career !== 'hr' || state.contacts < 1 || state.usedRound === game.round) return null;
  const contact = game.players.find(player => player.id === state.contactId);
  if (!contact || contact.id === actor.id || !legalIds.includes(contact.id)) return null;
  state.contacts -= 1;
  state.usedRound = game.round;
  announceCareer(game, target, `消耗1人脉，请${contact.name}代挡${getItem(itemId).name}`, contact.id);
  return { target: contact, kind: 'substitute', icon: 'substitute' };
}

/** 界面显示真实资源和次数；入席前阵容展示初始可用状态。 */
export function careerStatus(game, player) {
  if (!careerOf(player)) return player.careerTier === 'group' ? '基础打法 · 无专属技能' : '普通同桌 · 无职业技能';
  const state = player.careerState || initialCareer(player);
  const used = state.usedRound === game.round;
  switch (player.career) {
    case 'hr': return `人脉 ${state.contacts}/3 · ${state.contactId ? `对象：${game.players.find(other => other.id === state.contactId)?.name || '已离席'}` : '尚未指定对象'} · ${used ? '本轮援助已用' : '本轮可援助'}`;
    case 'tech': return `资历 ${state.experience}/3 · ${used ? '本轮点红已用' : player.sealed ? '点红被封印' : '等待点红时机'}`;
    case 'qa': return used ? '本轮修正已用' : player.sealed ? '修正被封印' : '本轮可修正一次';
    case 'project': return `调度剩余 ${state.swapsLeft} 次 · ${used ? '本轮已用' : player.sealed ? '被封印' : '本轮可用'}`;
    case 'risk': return state.riskRound === game.round ? '本轮预案已消耗' : '反弹预案 1/1';
    case 'procurement': return state.rebateRound === game.round ? '本店优惠已用' : '本店首购减5';
    case 'sales': return state.salesRound === game.round ? '本轮追击已补牌' : '夺奖成功可补牌';
    case 'admin': return state.supplyRound === game.round ? '本轮补给已结算' : '正常接碗时补给';
    case 'finance': return `当前本金 ${player.coins || 0} · 利息上限 ${player.careerTier === 'company' ? 12 : 6}`;
    default: return `资金 ${player.coins ?? 40} 金币 · 每轮额外10`;
  }
}
