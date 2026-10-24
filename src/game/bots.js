import { CATALOG, GODS, SKILLS } from './catalog';
import { pointsOf } from './config';
import { applyCard, canUseItem, legalTargets } from './effects';
import { blessingsOf, scoreOf } from './economy';
import { evaluateDice, rollRank } from './rules';

/** 机器人从同一牌库采购；按角色偏好轮换，昂贵祝福会留钱后再购买。 */
export function botShoppingList(player, game) {
  if (!game) return ['steal', 'protect', 'reroll'];
  const seed = [...player.id].reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
  const stock = game.shopStock?.[player.id];
  if (!stock) return [];
  const available = Object.values(stock).flat().map(id => CATALOG.find(card => card.id === id));
  const gods = available.filter(card => card.category === 'god');
  const desiredGod = gods[(seed + Math.floor(game.round / 2)) % gods.length];
  if (game.round % 3 === 0 && blessingsOf(player).length < 3) {
    if (player.coins < desiredGod.price) return [];
    const target = game.players.find(other => other.id !== player.id && (desiredGod.id !== 'matchmaker' || other.gender !== player.gender && !other.partnerId && blessingsOf(other).length < 3));
    return [{ item: desiredGod.id, targetId: target?.id }];
  }
  const skills = available.filter(card => card.category === 'skill');
  const field = available.filter(card => card.category === 'field')[(seed + game.round) % 3];
  return [...skills.map(card => card.id), ...(game.round % 2 === 0 ? [field.id] : [])];
}

function selectedAction(game, card) {
  const actor = game.players[game.turnIndex];
  const targets = legalTargets(game, card.id).sort((first, second) => scoreOf(second) - scoreOf(first));
  const action = { type: 'USE_ITEM', item: card.id, targetId: targets[0]?.id };
  if (card.target === 'twoPlayers') action.targetIds = targets.slice(0, 2).map(player => player.id);
  if (card.target === 'god') action.buffId = targets[0]?.buffs.find(buff => !['thunder', 'unlucky'].includes(buff.id))?.id;
  if (card.target === 'card') action.cardId = SKILLS.filter(entry => entry.id !== card.id && actor.items[entry.id] > 0).sort((a, b) => b.price - a.price)[0]?.id;
  if (card.target === 'award') {
    action.awardIndex = actor.awards.reduce((best, id, index) => pointsOf(id) < pointsOf(actor.awards[best]) ? index : best, 0);
    action.targetId = actor.partnerId || targets[targets.length - 1]?.id;
  }
  return action;
}

/** 看结果后的改骰搜索：只使用能提升奖型的确定性牌；重投低分时才冒险。 */
export function botAfterRoll(game) {
  const current = rollRank(game.preview);
  for (const card of SKILLS.filter(entry => entry.timing === 'after' && canUseItem(game, entry.id))) {
    if (['reroll', 'reroll_one', 'reroll_two', 'keep_red'].includes(card.id)) {
      if (current > 30) continue;
      const indices = game.dice.map((value, index) => ({ value, index })).filter(entry => entry.value !== 4).map(entry => entry.index);
      if (card.id === 'reroll_one' && !indices.length || card.id === 'reroll_two' && indices.length < 2) continue;
      return { type: 'USE_ITEM', item: card.id, diceIndices: indices.slice(0, card.id === 'reroll_two' ? 2 : 1) };
    }
    let best = null, bestRank = current;
    for (let first = 0; first < game.dice.length; first += 1) {
      for (let second = 0; second < (card.id === 'copy_face' ? game.dice.length : 1); second += 1) {
        const action = { type: 'USE_ITEM', item: card.id, diceIndices: card.id === 'copy_face' ? [first, second] : [first] };
        const trial = structuredClone(game);
        if (!applyCard(trial, action, () => .5)) continue;
        const rank = rollRank(evaluateDice(trial.dice));
        if (rank > bestRank) { bestRank = rank; best = action; }
      }
    }
    if (best) return best;
  }
  return { type: 'CONFIRM' };
}

/** 连续执行有收益的掷骰前技能，库存耗尽或没有合适牌时才进入掷骰。 */
export function botBeforeRoll(game) {
  const player = game.players[game.turnIndex];
  const preferred = [...SKILLS].sort((a, b) => (a.id === 'steal' ? -1 : b.id === 'steal' ? 1 : 0));
  for (const card of preferred) {
    if (card.timing !== 'before' || !canUseItem(game, card.id)) continue;
    if (card.id === 'protect' && (player.protected || !player.awards.length)) continue;
    if (card.id === 'lucky_note' && player.lucky || card.id === 'reflect' && player.reflect || card.id === 'substitute' && player.substituteId || card.id === 'priority' && game.priority.includes(player.id)) continue;
    if (card.id === 'gift' && !player.partnerId) continue;
    const action = selectedAction(game, card);
    // 使用同一校验试算，无法生效的牌不会使机器人停在ready无限重试。
    if (applyCard(structuredClone(game), action, () => .5)) return action;
  }
  return { type: 'ROLL' };
}

/** 兼容旧调用：重掷决策同样不读取已出牌次数。 */
export function botWantsReroll(game) {
  return canUseItem(game, 'reroll') && (pointsOf(game.preview?.awardId) <= 20 || game.pool[game.preview?.awardId] === 0);
}
