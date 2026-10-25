import { getItem } from './catalog';
import { blessingsOf, removeBuff } from './economy';
import { CURSE_GODS } from './gods';
import { emitEvent } from './events';
import { queueVisual } from './visuals';

/** 返回神符可选的当前神明，供手牌、机器人和结算共用；无合法对象时返回空列表。 */
export function talismanBuffs(game, itemId, target, actor = game.players[game.turnIndex]) {
  const active = buff => buff.fromRound <= game.round && buff.untilRound >= game.round;
  if (itemId === 'dismiss_god') {
    return actor.buffs.filter(buff => active(buff) && CURSE_GODS.includes(buff.id) && buff.role !== 'offering' && buff.sourceId !== actor.id && buff.targetId === actor.id);
  }
  if (itemId !== 'summon_god' || !target || target.id === actor.id) return [];
  const owned = blessingsOf(actor);
  if (owned.length >= 3) return [];
  return blessingsOf(target).filter(buff => active(buff) && getItem(buff.id)?.category === 'god' && !CURSE_GODS.includes(buff.id) && buff.id !== 'matchmaker' && !owned.some(entry => entry.id === buff.id));
}

/** 防御链结束后转移实际目标的同名神明；原期限和已触发的每轮限制随神明保留。 */
export function summonGod(game, actor, target, buffId) {
  const buff = talismanBuffs(game, 'summon_god', target).find(entry => entry.id === buffId);
  if (!buff) {
    game.event += '，实际目标没有可请的同名神明，未转移';
    queueVisual(game, { kind: 'skill', sourceId: actor.id, targetId: target.id, icon: 'summon_god', title: game.event, outcome: 'blocked' });
    return;
  }
  target.buffs = target.buffs.filter(entry => entry !== buff);
  actor.buffs.push({ ...buff, role: 'offering', sourceId: actor.id, targetId: actor.id });
  // 转移不能让本轮已经触发的关帝或奖励重新获得次数。
  const roundField = { guardian: 'guardianRound', champion: 'championRound', geomancer: 'swapRewardRound', thief_god: 'thiefGiftRound' }[buff.id];
  if (roundField && target[roundField] === game.round) actor[roundField] = game.round;
  emitEvent(game, 'acquire', actor.id, { itemId: buff.id });
  game.event += `，将${target.name}的「${getItem(buff.id).name}」请到自己身上，第${buff.untilRound}轮到期`;
  queueVisual(game, { kind: 'skill', sourceId: actor.id, targetId: target.id, icon: 'summon_god', title: game.event });
  queueVisual(game, { kind: 'skill', sourceId: target.id, targetId: actor.id, icon: buff.id, title: `${actor.name}获得「${getItem(buff.id).name}」，第${buff.untilRound}轮到期` });
}

/** 只解除手选的一项神明诅咒；保留施咒者供奉和其他技能施加的负面状态。 */
export function dismissGod(game, actor, buffId) {
  const buff = talismanBuffs(game, 'dismiss_god').find(entry => entry.id === buffId);
  removeBuff(game, actor, buff.id, buff.sourceId);
  game.event += `，解除自己身上的「${getItem(buff.id).name}」负面效果`;
}
