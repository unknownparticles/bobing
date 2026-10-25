import { careerOf, announceCareer } from './careers';
import { defendedTarget, legalTargets } from './effects';
import { evaluateDice, rollRank } from './rules';
import { pointsOf } from './config';
import { scoreOf } from './economy';
import { swappedSeat } from './archetypes';

/** 依据公开奖池评估实际收益；高等级空奖型不能无条件替代可领的低奖型。 */
export function claimValue(game, dice, playerId = game.players[game.turnIndex].id) {
  const result = evaluateDice(dice);
  if (!result.awardId) return 0;
  if (game.pool[result.awardId] > 0) return pointsOf(result.awardId) + rollRank(result) / 1000;
  if (result.awardId !== 'zhuangyuan') return 0;
  const ranks = game.players.filter(player => player.id !== playerId).flatMap(player => player.awards.flatMap((id, index) => id === 'zhuangyuan' ? [player.awardRanks[index] || 0] : []));
  return ranks.length && rollRank(result) > Math.min(...ranks) ? 1000 + rollRank(result) / 1000 : 0;
}

/** 四种职业主动技能统一校验；失败由 reducer 丢弃副本，不扣资源。 */
export function applyCareerAction(game, action) {
  const player = game.players[game.turnIndex];
  if (!careerOf(player) || player.sealed || game.visuals?.length) return false;
  const state = player.careerState;
  const beforeDice = [...game.dice];
  if (player.career === 'hr') {
    if (game.stage !== 'ready' || state.selectionRound === game.round) return false;
    const target = game.players.find(other => other.id === action.targetId && other.id !== player.id);
    if (!target) return false;
    state.contactId = target.id;
    state.contactRound = game.round;
    state.selectionRound = game.round;
    announceCareer(game, player, `指定${target.name}为人脉对象，剩余${state.contacts}人脉`, target.id);
    return true;
  }
  if (state.usedRound === game.round) return false;
  if (player.career === 'project') {
    if (game.stage !== 'ready' || state.swapsLeft < 1 || !legalTargets(game, 'swap_seat').some(other => other.id === action.targetId)) return false;
    const original = game.players.find(other => other.id === action.targetId);
    state.swapsLeft -= 1;
    state.usedRound = game.round;
    const target = defendedTarget(game, player, original, 'swap_seat');
    if (!target || target.id === player.id) {
      announceCareer(game, player, '调度被抵挡，已消耗一次调度');
      return true;
    }
    [player.seat, target.seat] = [target.seat, player.seat];
    swappedSeat(game, player);
    if (player.careerTier === 'company' && !game.priority.includes(player.id)) game.priority.push(player.id);
    announceCareer(game, player, `与${target.name}换位${player.careerTier === 'company' ? '，登记下轮先手' : ''}，剩余${state.swapsLeft}次`, target.id);
    return true;
  }
  if (!['tech', 'qa'].includes(player.career) || game.stage !== 'review') return false;
  const index = action.diceIndex;
  if (!Number.isInteger(index) || index < 0 || index >= game.dice.length) return false;
  const dice = [...game.dice];
  if (player.career === 'tech') {
    if (state.experience < 3 || dice[index] === 4) return false;
    dice[index] = 4;
  } else {
    if (![1, -1].includes(action.delta)) return false;
    dice[index] += action.delta;
    if (dice[index] < 1 || dice[index] > 6) return false;
  }
  if (rollRank(evaluateDice(dice)) <= rollRank(evaluateDice(game.dice))) return false;
  game.dice = dice;
  game.rollPresentation = null;
  game.preview = evaluateDice(dice);
  state.usedRound = game.round;
  if (player.career === 'tech') state.experience -= 3;
  announceCareer(game, player, `修正第${index + 1}颗骰子，成为${game.preview.label}`);
  // 纯改点复用骰子变化演出，不调用实际投掷出口，避免错误推进公开预告。
  const visual = game.visuals[game.visuals.length - 1];
  visual.diceChange = { before: beforeDice, after: [...dice], indices: [index] };
  return true;
}

/** 职业电脑只读当前公有信息，确定性寻找有实际收益的技能动作。 */
export function botCareerAction(game) {
  const player = game.players[game.turnIndex];
  if (!careerOf(player) || player.sealed) return null;
  const state = player.careerState;
  if (game.stage === 'ready' && player.career === 'hr' && state.selectionRound !== game.round) {
    const seats = Object.values(game.startingSeats);
    const targets = game.players.filter(other => other.id !== player.id).sort((a, b) => scoreOf(b) - scoreOf(a) || seats.indexOf(a.seat) - seats.indexOf(b.seat));
    return { type: 'USE_CAREER', targetId: targets[0].id };
  }
  if (state.usedRound === game.round) return null;
  if (game.stage === 'ready' && player.career === 'project' && state.swapsLeft > 0) {
    const targets = legalTargets(game, 'swap_seat');
    const lucky = ['lucky_seat', 'four_twos'].includes(game.field?.id) && game.field.seat !== player.seat;
    let target = lucky ? targets.find(other => other.seat === game.field.seat) : null;
    if (!target && player.careerTier === 'company' && game.round >= 4 && game.round < game.match.maxRounds && !game.priority.includes(player.id)) target = targets[0];
    return target ? { type: 'USE_CAREER', targetId: target.id } : null;
  }
  if (game.stage !== 'review' || !['tech', 'qa'].includes(player.career)) return null;
  if (player.career === 'tech' && state.experience < 3) return null;
  let best = null;
  let bestValue = claimValue(game, game.dice);
  for (let index = 0; index < game.dice.length; index += 1) {
    for (const delta of player.career === 'qa' ? [1, -1] : [0]) {
      const action = { type: 'USE_CAREER', diceIndex: index, delta };
      const trial = structuredClone(game);
      if (!applyCareerAction(trial, action)) continue;
      const value = claimValue(trial, trial.dice);
      if (value > bestValue) { bestValue = value; best = action; }
    }
  }
  return best;
}
