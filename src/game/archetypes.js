import { hasBuff } from './economy';
import { evaluateDice, rollRank } from './rules';
import { emitEvent } from './events';
import { queueVisual } from './visuals';
import { careerStoleAward } from './careers';

/** 所有玩家从相同的构筑状态开始；旧档案中的选派和分支不授予能力。 */
export function initialBuild() {
  return {
    archetype: null, branch: null, luck: 0,
    missStreak: 0, stolenCount: 0, swappedSeats: [], swapRewardRound: null,
    thiefGiftRound: null, secureLoot: false, nextMinimum: null,
  };
}

/** 运气封顶五；本桌成长、临时加成与供奉叠加，公开显示实际候选组数。 */
export function effectiveLuck(game, player) {
  return Math.min(5, Math.max(0, (player.luck || 0) + (player.lucky ? 2 : 0) + (hasBuff(game, player, 'fortune') ? 2 : 0) + (hasBuff(game, player, 'luck_blessing') ? 1 : 0)));
}

/** 返回本次整碗投掷的真实候选数量；厄运会抵消一层择优。 */
export function candidateCount(game, player) {
  const luck = effectiveLuck(game, player);
  const bad = hasBuff(game, player, 'thunder') || player.unlucky;
  return bad && luck === 0 ? 2 : Math.max(1, 1 + luck - (bad ? 1 : 0));
}

/** 领取或转移得到真实奖项时清零；不根据得分加成推测是否拿到奖项。 */
export function receivedAward(player) { player.missStreak = 0; }

/** 每次正式行动最终只调用一次；跳过行动没有投掷，不从这里经过。 */
export function missedAward(game, player, { compensate = true } = {}) {
  player.missStreak = (player.missStreak || 0) + 1;
  if (compensate && hasBuff(game, player, 'longevity')) player.coins += 5;
}

/** 成功夺奖才记录；配套护奖和职业补牌必须有对应的实际效果来源。 */
export function stolenAward(game, player, amount = 1) {
  receivedAward(player);
  player.stolenCount = (player.stolenCount || 0) + amount;
  emitEvent(game, 'theft', player.id, { amount });
  careerStoleAward(game, player);
  if (player.secureLoot) { player.protected = true; player.secureLoot = false; }
}

/** 换位立刻改变实际座位；队列仍在轮初固定，不能通过换位重复行动。 */
export function swappedSeat(game, player, { moved = true } = {}) {
  if (moved) player.swappedSeats = [...new Set([...(player.swappedSeats || []), player.seat])];
  if (hasBuff(game, player, 'geomancer') && player.swapRewardRound !== game.round) {
    player.coins += 5;
    player.swapRewardRound = game.round;
  }
}

/** 神明补牌按本人行动和轮次发放，三张封顶，跳过行动不会反复刷补牌。 */
export function beginBuildTurn(game, player) {
  player.secureLoot = false;
  if (hasBuff(game, player, 'thief_god') && player.thiefGiftRound !== game.round) {
    player.thiefGiftRound = game.round;
    if (player.items.steal < 3) {
      player.items.steal += 1;
      emitEvent(game, 'acquire', player.id, { itemId: 'steal' });
      queueVisual(game, { kind: 'skill', sourceId: player.id, targetId: player.id, icon: 'steal', title: `${player.name}的盗神补给一张顺手牵羊` });
    }
  }
}

function betterDice(first, second) {
  return rollRank(evaluateDice(first)) >= rollRank(evaluateDice(second)) ? first : second;
}

function minimumDice(dice, awardId) {
  const pattern = awardId === 'zhuangyuan' ? [4, 4, 4, 4, 2, 3, 5, 6] : [4, 4, 4, 1, 2, 3, 5, 6];
  return betterDice(dice, pattern.slice(0, dice.length));
}

/** 所有真实投掷的共同出口；候选择优、动画与纯改点都不能调用此函数。 */
export function applyActualThrow(game, inputDice, { formal = false, singleDie = false, out = false } = {}) {
  const player = game.players[game.turnIndex];
  if (formal) player.formalThrowRound = game.round;
  game.throwCount = (game.throwCount || 0) + 1;
  let dice = [...inputDice];
  if (game.field?.seat === player.seat && ['lucky_seat', 'four_twos'].includes(game.field.id)) {
    const face = game.field.id === 'lucky_seat' ? 4 : 2;
    const needed = game.field.id === 'lucky_seat' ? 2 : 4;
    const constrained = [...dice];
    let count = constrained.filter(value => value === face).length;
    for (let index = 0; index < constrained.length && count < needed; index += 1) {
      if (constrained[index] !== face) { constrained[index] = face; count += 1; }
    }
    dice = betterDice(dice, constrained);
    emitEvent(game, 'wind', player.id, { reason: 'seat', swapped: player.swappedSeats?.includes(player.seat) || false });
  }
  let personalMinimum = formal ? player.nextMinimum : null;
  if (personalMinimum) {
    dice = minimumDice(dice, personalMinimum);
    player.missStreak = 0; player.nextMinimum = null;
    emitEvent(game, 'burst', player.id, { awardId: personalMinimum });
    queueVisual(game, { kind: 'skill', sourceId: player.id, targetId: player.id, icon: 'longevity', title: `${player.name}厚积薄发，本次保底${personalMinimum === 'zhuangyuan' ? '四点红' : '三红'}` });
  }
  const forecasts = game.forecasts || [];
  const triggered = forecasts.filter(entry => entry.remaining === 1);
  game.forecasts = forecasts.filter(entry => entry.remaining > 1).map(entry => ({ ...entry, remaining: entry.remaining - 1 }));
  if (triggered.length) {
    dice = minimumDice(dice, 'zhuangyuan');
    emitEvent(game, 'wind', player.id, { reason: 'forecast', singleDie });
    queueVisual(game, { kind: 'champion', sourceId: triggered[0].sourceId, targetId: player.id, icon: 'champion', title: `${player.name}抢到公开预告，本碗保底四点红` });
  }
  // 公开保底与蓄势承诺优先；没有保底时仍保留大力出碗的原风险。
  return out && !triggered.length && !personalMinimum ? null : dice;
}
