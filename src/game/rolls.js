import { evaluateDice, rollRank } from './rules';
import { hasBuff } from './economy';
import { queueVisual } from './visuals';

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

/** 好运/厄运同时存在则相互抵消，候选点数在动画开始前只确定一次。 */
export function generateRoll(game, rng) {
  const player = game.players[game.turnIndex];
  const good = hasBuff(game, player, 'fortune') || player.lucky;
  const bad = hasBuff(game, player, 'thunder') || player.unlucky;
  for (const id of ['fortune', 'scholar', 'thunder', 'unlucky']) {
    if (!hasBuff(game, player, id)) continue;
    const buff = player.buffs.find(entry => entry.id === id && (!entry.targetId || entry.targetId === player.id));
    const names = { fortune: '福神赐运', scholar: '文昌点红', thunder: '雷公压运', unlucky: '太岁作祟' };
    queueVisual(game, { kind: ['thunder', 'unlucky'].includes(id) ? 'attack' : 'skill', sourceId: buff.sourceId, targetId: player.id, icon: id, title: `${names[id]}影响${player.name}的本次掷骰` });
  }
  const first = candidate(game, player, rng);
  player.lucky = false;
  player.unlucky = false;
  if (Boolean(good) === Boolean(bad)) return first;
  const second = candidate(game, player, rng);
  const difference = rollRank(evaluateDice(second)) - rollRank(evaluateDice(first));
  if (difference === 0) return second.join('') > first.join('') ? second : first;
  return (good ? difference > 0 : difference < 0) ? second : first;
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
  // 六名玩家开店共抽48张，预留完整随机输入，避免后排货架退化为固定结果。
  return { ...action, entropy: Array.from({ length: 120 }, () => rng()) };
}
