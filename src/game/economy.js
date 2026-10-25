import { pointsOf } from './config';
import { queueVisual } from './visuals';

/** 分数支持四分之一分：财神25%与姻缘对半均可精确表示。 */
export const scoreOf = player => player.awards.reduce((sum, id) => sum + pointsOf(id), 0) + (player.scoreAdjustment || 0);

/** 同分时比较持有的最高状元等级；无状元为零。 */
export const rankOf = player => Math.max(0, ...(player.awardRanks || []));

/** 所有祝福均以完整轮次生效；购买当轮不提前发挥效果。 */
export function hasBuff(game, player, id) {
  return (player.buffs || []).some(buff => {
    if (buff.id !== id || buff.fromRound > game.round || buff.untilRound < game.round) return false;
    // 供奉只代表拥有发动权，不能让尚未选人的诅咒或姻缘作用于供奉者。
    if (['thunder', 'unlucky'].includes(id) && buff.role === 'offering') return false;
    if (id === 'matchmaker') return buff.role !== 'offering' || !!player.partnerId;
    return !buff.targetId || buff.targetId === player.id;
  });
}

/** 返回当前生效的配偶；关系必须双向一致，解除后不会回算历史分数。 */
export function partnerOf(game, player) {
  if (!player.partnerId || !hasBuff(game, player, 'matchmaker')) return null;
  return game.players.find(other => other.id === player.partnerId && other.partnerId === player.id) || null;
}

/** 原子记录一次事务：先产生双方真实变化，再对有效姻缘一次性平分。 */
export function applyScoreChanges(game, changes) {
  const pending = { ...changes };
  const handled = new Set();
  for (const player of game.players) {
    const partner = partnerOf(game, player);
    if (!partner || handled.has(player.id)) continue;
    const half = ((changes[player.id] || 0) + (changes[partner.id] || 0)) / 2;
    pending[player.id] = half;
    pending[partner.id] = half;
    if (changes[player.id] || changes[partner.id]) {
      const source = changes[player.id] ? player : partner;
      const target = source.id === player.id ? partner : player;
      queueVisual(game, { kind: 'bond', sourceId: source.id, targetId: target.id, icon: 'matchmaker', delta: half, title: `${source.name}与${target.name}${half < 0 ? '共担' : '共享'}${Math.abs(half)}分` });
    }
    handled.add(player.id);
    handled.add(partner.id);
  }
  for (const player of game.players) player.scoreAdjustment += (pending[player.id] || 0) - (changes[player.id] || 0);
}

/** 真实奖项在玩家间转移；内部等级一并转移，姻缘平分这次得失。 */
export function transferAward(game, from, to, index) {
  const [id] = from.awards.splice(index, 1);
  const [rank] = from.awardRanks.splice(index, 1);
  to.awards.push(id);
  to.awardRanks.push(rank || 0);
  to.missStreak = 0;
  applyScoreChanges(game, { [from.id]: -pointsOf(id), [to.id]: pointsOf(id) });
  return id;
}

/** 移除持续效果，同时清理其施法源，月老解除时同步双方关系。 */
export function removeBuff(game, player, id, sourceId) {
  // 同一玩家可能既供奉雷公攻击别人，又被别人雷公诅咒，按施法源区分两条关系。
  const matches = buff => {
    if (buff.id !== id) return false;
    if (sourceId) return buff.sourceId === sourceId;
    if (buff.role === 'offering' && ['thunder', 'unlucky'].includes(id)) return false;
    return !buff.targetId || buff.targetId === player.id || id === 'matchmaker';
  };
  const removed = player.buffs.filter(matches);
  player.buffs = player.buffs.filter(buff => !matches(buff));
  for (const buff of removed) {
    if (id === 'matchmaker') {
      // 一人可能还持有自己的待发动月老；只解除这次来源对应的姻缘，不能清空全部月老。
      if (!buff.targetId) continue;
      const partnerId = buff.sourceId === player.id ? buff.targetId : buff.sourceId;
      const partner = game.players.find(other => other.id === partnerId);
      if (partner && partner.id !== player.id) {
        partner.buffs = partner.buffs.filter(entry => !(entry.id === id && entry.sourceId === buff.sourceId && entry.targetId === buff.targetId));
        if (player.partnerId === partner.id && partner.partnerId === player.id) { player.partnerId = null; partner.partnerId = null; }
      }
      continue;
    }
    // 净化、换轮只解除本轮诅咒，供奉保留到原定到期，下一轮仍可重新选人。
    if (buff.role === 'effect' && ['thunder', 'unlucky'].includes(id)) {
      const source = game.players.find(other => other.id === buff.sourceId);
      const offering = source?.buffs.find(entry => entry.id === id && entry.role === 'offering' && entry.sourceId === source.id);
      if (offering?.targetId === player.id) offering.targetId = null;
      continue;
    }
    const source = game.players.find(other => other.id === buff.sourceId);
    if (source && source.id !== player.id) source.buffs = source.buffs.filter(entry => !(entry.id === id && entry.targetId === player.id));
    if (buff.targetId && buff.targetId !== player.id) {
      const target = game.players.find(other => other.id === buff.targetId);
      if (target) target.buffs = target.buffs.filter(entry => !(entry.id === id && entry.sourceId === player.id));
    }
  }
}

/** 玩家本人供奉的数量；对手施加的诅咒不占被诅咒者槽位。 */
export const blessingsOf = player => (player.buffs || []).filter(buff => buff.sourceId === player.id && buff.role !== 'effect' || buff.id === 'matchmaker');
