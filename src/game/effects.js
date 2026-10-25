import { getItem, SKILLS } from './catalog';
import { pointsOf } from './config';
import { applyScoreChanges, blessingsOf, hasBuff, removeBuff, transferAward } from './economy';
import { evaluateDice, rollRank } from './rules';
import { describeSingleRoll, generateRoll, miracleRoll, rollFace } from './rolls';
import { heroOf } from './heroes';
import { queueVisual } from './visuals';
import { applyActualThrow, missedAward, receivedAward, stolenAward, swappedSeat } from './archetypes';
import { emitEvent } from './events';
import { isContentUnlocked } from './progression-content';
import { careerRedirect, settleCareerThrow } from './careers';
import { dismissGod, summonGod, talismanBuffs } from './god-talismans';

const negativeCards = new Set(['steal', 'double_steal', 'toilet', 'unlucky_note', 'disarm', 'exchange', 'equal_coins', 'exorcism', 'seal', 'swap_seat', 'summon_god']);
const afterCards = new Set(['reroll', 'reroll_one', 'reroll_two', 'keep_red', 'paint_red', 'set_six', 'set_one', 'plus_one', 'minus_one', 'flip', 'copy_face']);

/** 所有选人面板与机器人共用目标规则；不把无效操作留到扣牌后才处理。 */
export function legalTargets(game, itemId) {
  const actor = game.players[game.turnIndex];
  return game.players.filter(target => {
    if (target.id === actor.id) return false;
    if (itemId === 'summon_god') return talismanBuffs(game, itemId, target).length > 0;
    if (itemId === 'steal' || itemId === 'double_steal') return target.awards.length >= (itemId === 'double_steal' ? 2 : 1) && !target.protected;
    if (itemId === 'exchange') return actor.awards.length > 0 && target.awards.length > 0 && !target.protected;
    if (itemId === 'toilet') return !target.skip;
    if (itemId === 'disarm') return SKILLS.some(card => target.items[card.id] > 0);
    if (itemId === 'mirror') return target.lastDice?.length === game.diceCount;
    if (itemId === 'exorcism') return blessingsOf(target).some(buff => !['thunder', 'unlucky'].includes(buff.id));
    if (itemId === 'matchmaker') return actor.gender && target.gender && actor.gender !== target.gender && !actor.partnerId && !target.partnerId && blessingsOf(target).length < 3;
    return true;
  });
}

/** 手牌可用性只取决于库存、时机与合法选择，不存在每回合使用总数限制。 */
export function canUseItem(game, itemId) {
  const card = getItem(itemId);
  const player = game.players[game.turnIndex];
  if (!card || card.category !== 'skill' || !(player.items[itemId] > 0) || player.sealed || game.visuals?.length || !['ready', 'review'].includes(game.stage)) return false;
  if (!isContentUnlocked(itemId, game.match?.unlockedContent)) return false;
  if (afterCards.has(itemId) !== (game.stage === 'review')) return false;
  // 双人桌只有一名对手，不能把需要两名对手的牌标成可用。
  if (card.target === 'twoPlayers') return legalTargets(game, itemId).length >= 2;
  if (itemId === 'summon_god') return legalTargets(game, itemId).length > 0;
  if (itemId === 'dismiss_god') return talismanBuffs(game, itemId).length > 0;
  if (itemId === 'gather_luck') return player.luck < 5;
  if (itemId === 'lucky_note') return !player.lucky;
  if (itemId === 'secure_loot') return !player.secureLoot;
  if (itemId === 'bitter_sweet') return player.missStreak >= 2 && !player.nextMinimum;
  if (itemId === 'never_too_late') return player.missStreak >= 3 && player.nextMinimum !== 'zhuangyuan';
  if (itemId === 'old_master') return player.missStreak >= 3 && player.nextMinimum !== 'zhuangyuan';
  if (itemId === 'miracle') return ['sanhong', 'zhuangyuan', ...(game.diceCount >= 6 ? ['duitang'] : [])].some(id => game.pool[id] > 0);
  if (itemId === 'gift') return player.awards.length > 0;
  if (itemId === 'cleanse') return player.unlucky || hasBuff(game, player, 'thunder') || hasBuff(game, player, 'unlucky');
  if (itemId === 'recycle') return SKILLS.some(other => other.id !== 'recycle' && player.items[other.id] > 0);
  if (itemId === 'keep_red') return game.dice.some(value => value !== 4);
  if (itemId === 'paint_red') return game.dice.some(value => value !== 4);
  if (itemId === 'set_six') return game.dice.some(value => value !== 6);
  if (itemId === 'set_one') return game.dice.some(value => value !== 1);
  if (itemId === 'plus_one') return game.dice.some(value => value < 6);
  if (itemId === 'minus_one') return game.dice.some(value => value > 1);
  if (['steal', 'double_steal', 'toilet', 'disarm', 'exchange', 'mirror', 'exorcism', 'unlucky_note', 'equal_coins', 'seal', 'substitute', 'swap_seat'].includes(itemId)) return legalTargets(game, itemId).length > 0;
  return true;
}

/** 给界面提供简短禁用原因与目标，不重复维护一份玩法规则。 */
export function getUseOptions(game, itemId) {
  return { available: canUseItem(game, itemId), reason: canUseItem(game, itemId) ? '' : game.players[game.turnIndex].sealed ? '本次行动被封印' : '库存、时机或目标不符合', targets: legalTargets(game, itemId), diceCount: game.diceCount };
}

/** 选人技能的防御链只转移一次，避免反弹互相触发形成无限递归。 */
export function defendedTarget(game, actor, target, id, redirected = false, action = {}) {
  if (!negativeCards.has(id)) return target;
  const block = (icon, title) => {
    queueVisual(game, { kind: 'shield', sourceId: target.id, targetId: target.id, againstId: actor.id, icon, title, outcome: 'blocked' });
    return null;
  };
  if ((id === 'steal' || id === 'double_steal' || id === 'exchange') && target.protected) return block('protect', `${target.name}的保护罩挡住${actor.name}`);
  if (['steal', 'double_steal'].includes(id) && heroOf(target)?.id === 'hero-b' && target.heroGuardRound !== game.round) {
    target.heroGuardRound = game.round;
    game.event += `，${target.name}发动「稳稳护住」`;
    return block('protect', `${target.name}发动稳稳护住，挡住${actor.name}的牵羊`);
  }
  if (id === 'toilet' && hasBuff(game, target, 'longevity')) return block('longevity', `${target.name}的寿星留席挡住厕所卡`);
  if (hasBuff(game, target, 'guardian') && target.guardianRound !== game.round) { target.guardianRound = game.round; return block('guardian', `${target.name}的关帝护持挡住${actor.name}`); }
  if (redirected) return target;
  if (target.reflect) {
    target.reflect = false;
    queueVisual(game, { kind: 'reflect', sourceId: target.id, targetId: actor.id, icon: 'reflect', title: `${target.name}将${getItem(id).name}反弹给${actor.name}`, outcome: 'redirected' });
    return defendedTarget(game, actor, actor, id, true);
  }
  if (target.substituteId) {
    const substitute = game.players.find(player => player.id === target.substituteId);
    target.substituteId = null;
    if (!substitute || substitute.id === actor.id) return null;
    queueVisual(game, { kind: 'substitute', sourceId: target.id, targetId: substitute.id, icon: 'substitute', title: `${target.name}让${substitute.name}替身承受${getItem(id).name}`, outcome: 'redirected' });
    return defendedTarget(game, actor, substitute, id, true);
  }
  // 人脉不止校验“有神明”，还必须能承受本次已选的同名神明效果。
  const careerTargets = legalTargets(game, id).filter(player => {
    if (id === 'exorcism') return blessingsOf(player).some(buff => buff.id === action.buffId && !['thunder', 'unlucky'].includes(buff.id));
    if (id === 'summon_god') return talismanBuffs(game, id, player).some(buff => buff.id === action.buffId);
    return true;
  });
  const redirectedByCareer = careerRedirect(game, actor, target, id, careerTargets.map(player => player.id));
  if (redirectedByCareer) {
    queueVisual(game, { kind: redirectedByCareer.kind, sourceId: target.id, targetId: redirectedByCareer.target.id, icon: redirectedByCareer.icon, outcome: 'redirected', title: `${target.name}的职业防御改变了目标` });
    return defendedTarget(game, actor, redirectedByCareer.target, id, true);
  }
  return target;
}

function bestAward(player) {
  return player.awards.reduce((best, id, index) => pointsOf(id) >= pointsOf(player.awards[best]) ? index : best, 0);
}

function refreshPreview(game) {
  game.preview = evaluateDice(game.dice);
  game.event = `点数已改变：${game.preview.label}`;
  game.eventType = 'review';
}

/** 所有技能在克隆状态上执行，失败返回false，由调用者丢弃该克隆避免扣牌。 */
export function applyCard(game, action, rng) {
  const id = action.item;
  if (!canUseItem(game, id)) return false;
  const player = game.players[game.turnIndex];
  const card = getItem(id);
  const beforeDice = [...game.dice];
  let target = game.players.find(entry => entry.id === action.targetId);
  const needsTarget = ['steal', 'double_steal', 'toilet', 'disarm', 'exchange', 'mirror', 'exorcism', 'unlucky_note', 'equal_coins', 'seal', 'substitute', 'swap_seat', 'gift', 'summon_god'].includes(id);
  if (needsTarget && !legalTargets(game, id).some(entry => entry.id === action.targetId)) return false;
  if (['summon_god', 'dismiss_god'].includes(id) && !talismanBuffs(game, id, target).some(buff => buff.id === action.buffId)) return false;
  const indices = action.diceIndices || [];
  const need = ['reroll_two', 'copy_face'].includes(id) ? 2 : ['reroll_one', 'paint_red', 'set_six', 'set_one', 'plus_one', 'minus_one', 'flip'].includes(id) ? 1 : 0;
  if (need && (indices.length !== need || new Set(indices).size !== need || indices.some(index => !Number.isInteger(index) || index < 0 || index >= game.dice.length))) return false;
  if (id === 'gift' && (!Number.isInteger(action.awardIndex) || action.awardIndex < 0 || action.awardIndex >= player.awards.length)) return false;
  if (id === 'recycle' && (!SKILLS.some(entry => entry.id === action.cardId && entry.id !== 'recycle') || !(player.items[action.cardId] > 0))) return false;
  const exorcismGods = id === 'exorcism' ? blessingsOf(target).filter(buff => buff.id === action.buffId && !['thunder', 'unlucky'].includes(buff.id)) : [];
  const selectedGod = exorcismGods.find(buff => action.buffSourceId ? buff.sourceId === action.buffSourceId : exorcismGods.length === 1);
  if (id === 'exorcism' && !selectedGod) return false;
  if (id === 'swap_others' && (action.targetIds?.length !== 2 || new Set(action.targetIds).size !== 2 || action.targetIds.some(targetId => !game.players.some(entry => entry.id === targetId && entry.id !== player.id)))) return false;
  if (id === 'plus_one' && game.dice[indices[0]] >= 6 || id === 'minus_one' && game.dice[indices[0]] <= 1) return false;
  if (id === 'paint_red' && game.dice[indices[0]] === 4 || id === 'set_six' && game.dice[indices[0]] === 6 || id === 'set_one' && game.dice[indices[0]] === 1) return false;
  player.items[id] -= 1;
  emitEvent(game, 'use', player.id, { itemId: id });
  game.event = `${player.name} 使用「${card.name}」`;
  game.eventType = 'skill';
  if (needsTarget && negativeCards.has(id)) queueVisual(game, { kind: 'attack', sourceId: player.id, targetId: target.id, icon: id, title: `${player.name}对${target.name}使用${card.name}`, outcome: 'pending' });
  if (needsTarget) {
    target = defendedTarget(game, player, target, id, false, action);
    if (!target || target.id === player.id && ['steal', 'double_steal', 'exchange', 'equal_coins', 'swap_seat', 'summon_god'].includes(id)) { game.event += '，效果被抵挡'; return true; }
  }
  switch (id) {
    case 'protect': player.protected = true; break;
    case 'steal': case 'double_steal': if (target.awards.length >= (id === 'double_steal' ? 2 : 1) && !target.protected) {
      const amount = id === 'double_steal' ? 2 : 1;
      for (let count = 0; count < amount; count += 1) {
        const index = Math.floor(rng() * target.awards.length);
        const award = target.awards[index];
        queueVisual(game, { kind: 'transfer', sourceId: target.id, targetId: player.id, icon: 'steal', awardId: award, title: `${player.name}从${target.name}手中夺取一份奖项` });
        transferAward(game, target, player, index);
      }
      stolenAward(game, player, amount);
      game.event += `，从${target.name}手中夺取${amount}份奖项`;
    } break;
    case 'toilet': if (!hasBuff(game, target, 'longevity')) target.skip = true; break;
    case 'seal': target.sealPending = true; break;
    case 'unlucky_note': target.unlucky = true; break;
    case 'lucky_note': player.lucky = true; break;
    case 'gather_luck': player.luck = Math.min(5, player.luck + 1); break;
    case 'secure_loot': player.secureLoot = true; break;
    case 'bitter_sweet': player.nextMinimum = 'sanhong'; break;
    case 'never_too_late': player.nextMinimum = 'zhuangyuan'; break;
    case 'old_master': player.nextMinimum = 'zhuangyuan'; break;
    case 'forecast_three': case 'forecast_one': {
      game.forecasts ??= [];
      game.forecasts.push({ id: game.events.length, itemId: id, sourceId: player.id, remaining: id === 'forecast_one' ? 1 : 3 });
      game.event += `，全场还剩${id === 'forecast_one' ? 1 : 3}次实际投掷触发状元`;
      break;
    }
    case 'reflect': player.reflect = true; break;
    case 'substitute': player.substituteId = target.id; break;
    case 'priority': if (!game.priority.includes(player.id)) game.priority.push(player.id); break;
    case 'swap_seat': [player.seat, target.seat] = [target.seat, player.seat]; swappedSeat(game, player); break;
    case 'swap_others': {
      const [first, second] = action.targetIds.map(targetId => game.players.find(entry => entry.id === targetId));
      [first.seat, second.seat] = [second.seat, first.seat]; swappedSeat(game, player, { moved: false }); break;
    }
    case 'disarm': {
      const cards = SKILLS.flatMap(entry => Array(Math.max(0, target.items[entry.id] || 0)).fill(entry.id));
      if (cards.length) target.items[cards[Math.floor(rng() * cards.length)]] -= 1;
      break;
    }
    case 'gift': queueVisual(game, { kind: 'transfer', sourceId: player.id, targetId: target.id, icon: 'gift', title: `${player.name}将一份奖项送给${target.name}` }); transferAward(game, player, target, action.awardIndex); player.coins += 10; break;
    case 'exchange': {
      if (!target.awards.length || target.protected) break;
      const first = bestAward(player), second = bestAward(target);
      const delta = pointsOf(target.awards[second]) - pointsOf(player.awards[first]);
      [player.awards[first], target.awards[second]] = [target.awards[second], player.awards[first]];
      [player.awardRanks[first], target.awardRanks[second]] = [target.awardRanks[second], player.awardRanks[first]];
      receivedAward(player); receivedAward(target);
      applyScoreChanges(game, { [player.id]: delta, [target.id]: -delta }); break;
    }
    case 'equal_coins': {
      const total = player.coins + target.coins, extra = player.coins >= target.coins;
      player.coins = Math.floor(total / 2) + (extra ? total % 2 : 0);
      target.coins = total - player.coins; break;
    }
    case 'cleanse': player.unlucky = false; removeBuff(game, player, 'thunder'); removeBuff(game, player, 'unlucky'); break;
    case 'summon_god': summonGod(game, player, target, action.buffId); break;
    case 'dismiss_god': dismissGod(game, player, action.buffId); break;
    case 'exorcism': {
      // 月老可能同时有自身供奉与别人缔结的关系，驱邪只能解除明确选中的来源。
      const buff = blessingsOf(target).find(entry => entry.id === action.buffId && (target.id !== action.targetId || entry.sourceId === selectedGod.sourceId));
      if (buff) removeBuff(game, target, buff.id, buff.sourceId);
      break;
    }
    case 'lucky_bag': {
      const cheap = SKILLS.filter(entry => entry.id !== id && entry.price <= 15 && isContentUnlocked(entry.id, game.match?.unlockedContent));
      for (let count = 0; count < 2; count += 1) {
        const itemId = cheap[Math.floor(rng() * cheap.length)].id;
        player.items[itemId] += 1; emitEvent(game, 'acquire', player.id, { itemId });
      }
      break;
    }
    case 'recycle': player.items[action.cardId] -= 1; player.coins += Math.floor(getItem(action.cardId).price * .6); break;
    case 'miracle': {
      const result = miracleRoll(game, rng);
      const dice = applyActualThrow(game, result.dice || [1, 2, 3, 5, 6, 1, 2, 3].slice(0, game.diceCount), { formal: true, out: result.out });
      if (!dice) {
        settleCareerThrow(game, player);
        // 出碗仍是真实投掷失败；原有主动风险不发补偿金币。
        missedAward(game, player, { compensate: false });
        game.stage = 'settled'; game.event += '，骰子出碗，本次行动结束'; game.preview = null;
      }
      else {
        game.stage = 'rolling'; game.pendingDice = dice;
        describeSingleRoll(game, dice, dice.map((_, index) => index), card.name);
      }
      break;
    }
    case 'mirror': game.dice = [...target.lastDice]; game.stage = 'review'; refreshPreview(game); break;
    case 'reroll': game.pendingDice = applyActualThrow(game, generateRoll(game, rng)); game.stage = 'rolling'; game.preview = null; break;
    case 'reroll_one': case 'reroll_two': case 'keep_red': {
      const selected = id === 'keep_red' ? game.dice.map((value, index) => value === 4 ? -1 : index).filter(index => index >= 0) : indices;
      const rolledDice = game.dice.map((value, index) => selected.includes(index) ? rollFace(game, rng) : value);
      game.pendingDice = applyActualThrow(game, rolledDice, { singleDie: selected.length === 1 });
      describeSingleRoll(game, rolledDice, selected, card.name);
      game.stage = 'rolling'; game.preview = null; break;
    }
    case 'paint_red': game.dice[indices[0]] = 4; refreshPreview(game); break;
    case 'set_six': game.dice[indices[0]] = 6; refreshPreview(game); break;
    case 'set_one': game.dice[indices[0]] = 1; refreshPreview(game); break;
    case 'plus_one': game.dice[indices[0]] += 1; refreshPreview(game); break;
    case 'minus_one': game.dice[indices[0]] -= 1; refreshPreview(game); break;
    case 'flip': game.dice[indices[0]] = 7 - game.dice[indices[0]]; refreshPreview(game); break;
    case 'copy_face': game.dice[indices[1]] = game.dice[indices[0]]; refreshPreview(game); break;
    default: return false;
  }
  if (!['steal', 'double_steal', 'gift', 'summon_god'].includes(id)) {
    const affected = id === 'swap_others' ? action.targetIds : [needsTarget ? target.id : player.id];
    const changesDice = ['mirror', 'paint_red', 'set_six', 'set_one', 'plus_one', 'minus_one', 'flip', 'copy_face'].includes(id);
    if (changesDice) game.rollPresentation = null;
    const diceChange = changesDice ? {
      before: beforeDice, after: [...game.dice],
      indices: game.dice.map((value, index) => value !== beforeDice[index] ? index : -1).filter(index => index >= 0),
    } : undefined;
    for (const targetId of affected) queueVisual(game, { kind: ['protect', 'reflect', 'substitute'].includes(id) ? 'shield' : 'skill', sourceId: player.id, targetId, icon: id, title: `${player.name}的${card.name}${targetId !== player.id ? `作用于${game.players.find(entry => entry.id === targetId).name}` : '已生效'}`, ...(diceChange ? { diceChange } : {}) });
  }
  return true;
}

// 兼容旧导出；供奉登记与场上发动统一由神明模块处理。
export { applyBlessing } from './gods';
