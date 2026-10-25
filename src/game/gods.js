import { getItem } from './catalog';
import { blessingsOf, removeBuff } from './economy';
import { queueVisual } from './visuals';
import { emitEvent } from './events';

export const CURSE_GODS = ['thunder', 'unlucky'];

/** 显示供奉和本轮效果的区别，避免把未指定目标的神明误写成已经生效。 */
export function godStatus(game, buff) {
  if (buff.fromRound > game.round) return '下轮生效';
  if (CURSE_GODS.includes(buff.id)) {
    if (buff.role === 'effect') return '本轮效果';
    if (buff.role === 'offering') return `${buff.targetId ? '本轮已指定' : '本轮未发动'} · 余${buff.untilRound - game.round + 1}轮`;
  }
  if (buff.id === 'matchmaker' && !buff.targetId) return '待结缘';
  return `${buff.untilRound - game.round + 1}轮`;
}

/** 商店仅登记供奉及到期轮次；忽略购买动作中的目标，发动留到场上。 */
export function applyBlessing(game, actor, card, action) {
  const offerings = blessingsOf(actor);
  if (offerings.some(buff => buff.id === card.id)) return false;
  if (offerings.length >= 3) {
    const replaced = offerings.find(buff => buff.id === action.replaceId);
    if (!replaced) return false;
    removeBuff(game, actor, action.replaceId, replaced.sourceId);
  }
  actor.buffs.push({ id: card.id, role: 'offering', sourceId: actor.id, targetId: card.target === 'player' ? null : actor.id, fromRound: game.round + 1, untilRound: game.round + card.duration });
  return true;
}

/** 轮初选人与接碗顺序分开；同一种诅咒不能重复压在同一人身上。 */
export function godTargets(game, sourceId, itemId) {
  const actor = game.players.find(player => player.id === sourceId);
  if (!actor) return [];
  return game.players.filter(target => {
    if (target.id === actor.id) return false;
    if (CURSE_GODS.includes(itemId)) return !target.buffs.some(buff => buff.id === itemId && buff.role !== 'offering' && buff.targetId === target.id && buff.fromRound <= game.round && buff.untilRound >= game.round);
    if (itemId === 'matchmaker') return !actor.partnerId && !target.partnerId && actor.gender && target.gender && actor.gender !== target.gender && blessingsOf(target).length < 3;
    return false;
  });
}

/** 每轮重置诅咒目标；月老已有关系时不再要求选人，也不重置到期时间。 */
export function prepareGodQueue(game) {
  game.godQueue = [];
  for (const player of game.players) {
    for (const buff of blessingsOf(player)) {
      if (buff.sourceId !== player.id || buff.fromRound > game.round || buff.untilRound < game.round) continue;
      // 被动神明也要实际入席后才计入使用记录，购买本身不代表发动。
      if (getItem(buff.id)?.target === 'none' && buff.fromRound === game.round) {
        emitEvent(game, 'use', player.id, { itemId: buff.id });
        queueVisual(game, { kind: 'shield', sourceId: player.id, targetId: player.id, icon: buff.id, title: `${player.name}的${getItem(buff.id).name}入席生效` });
      }
      if (CURSE_GODS.includes(buff.id)) buff.targetId = null;
      if (CURSE_GODS.includes(buff.id) || buff.id === 'matchmaker' && !player.partnerId) game.godQueue.push({ sourceId: player.id, item: buff.id });
    }
  }
}

/** 按当前队首发动一次；诅咒仅持续本轮，月老关系沿用购买时的到期轮次。 */
export function castGod(game, action) {
  const pending = game.godQueue?.[0];
  if (game.stage !== 'round-start' || !pending || pending.sourceId !== action.sourceId || pending.item !== action.item) return false;
  if (!godTargets(game, pending.sourceId, pending.item).some(player => player.id === action.targetId)) return false;
  const actor = game.players.find(player => player.id === pending.sourceId);
  const target = game.players.find(player => player.id === action.targetId);
  const offering = blessingsOf(actor).find(buff => buff.id === pending.item && buff.sourceId === actor.id);
  if (!offering || offering.fromRound > game.round || offering.untilRound < game.round) return false;
  offering.targetId = target.id;
  target.buffs.push({ ...offering, role: 'effect', fromRound: game.round, untilRound: CURSE_GODS.includes(offering.id) ? game.round : offering.untilRound });
  if (offering.id === 'matchmaker') { actor.partnerId = target.id; target.partnerId = actor.id; }
  const card = getItem(offering.id);
  game.event = `${actor.name}发动「${card.name}」，${offering.id === 'matchmaker' ? `与${target.name}缔结姻缘` : `本轮指定${target.name}`}`;
  game.eventType = 'skill';
  emitEvent(game, 'use', actor.id, { itemId: card.id, targetId: target.id });
  queueVisual(game, { kind: offering.id === 'matchmaker' ? 'bond' : 'attack', sourceId: actor.id, targetId: target.id, icon: card.id, title: game.event });
  return true;
}
