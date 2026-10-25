import { evaluateDice, rollRank } from './rules';
import { hasBuff } from './economy';
import { queueVisual } from './visuals';
import { candidateCount, effectiveLuck } from './archetypes';

/** 使用注入随机数生成一颗骰子，场地改变的是公开权重。 */
export function rollFace(game, rng) {
  const weights = [1, 1, 1, game.field?.id === 'red_table' ? 2 : game.field?.id === 'black_table' ? .5 : 1, 1, 1];
  let value = rng() * weights.reduce((sum, weight) => sum + weight, 0);
  let face = 6;
  for (let index = 0; index < weights.length; index += 1) {
    value -= weights[index];
    if (value < 0) { face = index + 1; break; }
  }
  if (game.field?.id === 'small_table' && face >= 5) face -= 4;
  return face;
}

function candidate(game, player, rng) {
  const dice = Array.from({ length: game.diceCount || 6 }, () => rollFace(game, rng));
  if (hasBuff(game, player, 'unlucky') && dice.includes(4)) dice[dice.indexOf(4)] = 1;
  if (hasBuff(game, player, 'scholar') && !dice.includes(4)) dice[dice.indexOf(Math.min(...dice))] = 4;
  return dice;
}

/** 运气决定整碗候选组数；内部择优不算额外投掷，不推进公开预告。 */
export function generateRoll(game, rng) {
  const player = game.players[game.turnIndex];
  const luck = effectiveLuck(game, player);
  const bad = hasBuff(game, player, 'thunder') || player.unlucky;
  const sources = [hasBuff(game, player, 'fortune') && '福神赐运', hasBuff(game, player, 'thunder') && '雷公压运', player.lucky && '福气贴', player.unlucky && '倒霉贴'].filter(Boolean);
  for (const id of ['fortune', 'scholar', 'thunder', 'unlucky']) {
    if (!hasBuff(game, player, id)) continue;
    const buff = player.buffs.find(entry => entry.id === id && (!entry.targetId || entry.targetId === player.id));
    const names = { fortune: '福神赐运', scholar: '文昌点红', thunder: '雷公压运', unlucky: '太岁作祟' };
    queueVisual(game, { kind: ['thunder', 'unlucky'].includes(id) ? 'attack' : 'skill', sourceId: buff.sourceId, targetId: player.id, icon: id, title: `${names[id]}影响${player.name}的本次掷骰` });
  }
  const candidates = Array.from({ length: candidateCount(game, player) }, () => candidate(game, player, rng));
  // 厄运先抵消一层择优；完全没有运气时仍按原规则两组取差。
  player.lucky = false;
  player.unlucky = false;
  const selection = bad && luck === 0 ? 'worst' : 'best';
  const selectedIndex = candidates.reduce((best, current, index) => {
    const difference = rollRank(evaluateDice(current)) - rollRank(evaluateDice(candidates[best]));
    if (difference === 0) return current.join('') > candidates[best].join('') ? index : best;
    return (selection === 'worst' ? difference < 0 : difference > 0) ? index : best;
  }, 0);
  // 保存规则实际比较过的结果，演出不能重新掷骰或多推进一次公开预告。
  game.rollPresentation = {
    candidates, selectedIndex, selection,
    label: sources.join(' · ') || (candidates.length === 1 ? '掷骰' : '好运择优'),
    rollingIndices: Array.from({ length: game.diceCount }, (_, index) => index),
  };
  return candidates[selectedIndex];
}

/** 单次或局部重投共用记录；保留明确的选骰范围，即使重投点数恰好相同也要播放。 */
export function describeSingleRoll(game, dice, rollingIndices, label) {
  game.rollPresentation = { candidates: [[...dice]], selectedIndex: 0, selection: 'best', rollingIndices, label };
}

/** 大力卡严格使用60/30/10分支，不再经过场地改点或神明选组。 */
export function miracleRoll(game, rng) {
  const branch = rng();
  if (branch >= .9) return { out: true, dice: null };
  const none = [1, 2, 3, 5, 6, 1, 2, 3].slice(0, game.diceCount);
  if (branch >= .6) return { out: false, dice: none };
  const awards = ['sanhong', 'duitang', 'zhuangyuan'].filter(id => game.pool[id] > 0 && (id !== 'duitang' || game.diceCount >= 6));
  const id = awards[Math.floor(rng() * awards.length)];
  const dice = id === 'zhuangyuan' ? [4, 4, 4, 4, 2, 3, 5, 6] : id === 'duitang' ? [1, 2, 3, 4, 5, 6, 2, 3] : [4, 4, 4, 1, 2, 1, 2, 3];
  return { out: false, dice: dice.slice(0, game.diceCount) };
}

/** 交给reducer的随机输入可复现；不把Math.random放进规则函数中。 */
export function resolveAction(game, action, rng = Math.random) {
  // 开店每人抽八张，另留机器人选择与场地抽签余量；大桌不能耗尽随机输入。
  return { ...action, entropy: Array.from({ length: Math.max(120, game.players.length * 12) }, () => rng()) };
}
