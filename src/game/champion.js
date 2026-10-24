import { rollRank } from './rules';
import { transferAward } from './economy';
import { queueVisual } from './visuals';

/** 奖池空后，只能从其他玩家手中抢严格更低的最低档；同档候选按份随机。 */
export function captureChampion(game, player, result, rng) {
  if (result.awardId !== 'zhuangyuan' || game.pool.zhuangyuan !== 0) return null;
  const candidates = game.players.filter(other => other.id !== player.id).flatMap(other => other.awards.flatMap((id, index) => id === 'zhuangyuan' ? [{ holder: other, index, rank: other.awardRanks[index] || 0 }] : []));
  if (!candidates.length) return null;
  const lowest = Math.min(...candidates.map(entry => entry.rank));
  const rank = rollRank(result);
  if (rank <= lowest) return null;
  const tied = candidates.filter(entry => entry.rank === lowest);
  const chosen = tied[Math.floor(rng() * tied.length)];
  // 先记录奖项飞行，再记录同一事务的姻缘分账；动画不参与真实资源修改。
  queueVisual(game, { kind: 'champion', sourceId: chosen.holder.id, targetId: player.id, title: `${player.name}以「${result.label}」抢走${chosen.holder.name}的状元`, awardId: 'zhuangyuan', icon: 'champion' });
  transferAward(game, chosen.holder, player, chosen.index);
  player.awardRanks[player.awardRanks.length - 1] = rank;
  return { fromId: chosen.holder.id, fromName: chosen.holder.name, oldRank: lowest, rank };
}
