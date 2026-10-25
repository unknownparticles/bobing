/** 点数变更只比较实际不同的骰子；局部重投的范围由规则单独记录。 */
export function changedDice(before, after) {
  return after.map((value, index) => value !== before[index] ? index : -1).filter(index => index >= 0);
}

/** 改点分为旧点数收起、新点数亮起两段，合计与卡牌特效的 1100ms 一致。 */
export function changeFrames(before, after, title) {
  const changedIndices = changedDice(before, after);
  const common = { changedIndices, before, after, title, rollingIndices: [] };
  return [
    { ...common, phase: 'changing', dice: before, duration: 450 },
    { ...common, phase: 'changed', dice: after, duration: 650 },
  ];
}

/** 将已确定的候选转成展示步骤；不生成规则随机数，也不调用真实投掷结算。 */
export function rollFrames(game, reducedMotion = false) {
  const trace = game.rollPresentation;
  const candidates = trace?.candidates || [game.pendingDice];
  const selectedIndex = trace?.selectedIndex || 0;
  const robot = game.players[game.turnIndex].id !== 'you';
  const rollingIndices = trace?.rollingIndices || game.pendingDice.map((_, index) => index);
  const multiple = candidates.length > 1;
  const common = { candidates, selectedIndex, selection: trace?.selection || 'best', label: trace?.label || '掷骰' };
  const frames = [];
  candidates.forEach((dice, index) => {
    const title = multiple ? `${common.label} · 第 ${index + 1} / ${candidates.length} 次投掷` : common.label;
    if (!reducedMotion) frames.push({
      ...common, phase: 'rolling', dice: index === 0 ? game.dice : candidates[index - 1],
      rollingIndices, candidateIndex: index, revealedCount: index, title, duration: robot ? 480 : 880,
    });
    frames.push({
      ...common, phase: 'holding', dice, rollingIndices: [], candidateIndex: index,
      revealedCount: index + 1, title: `${title} · 点数落定`,
      duration: reducedMotion ? 240 : multiple ? robot ? 260 : 420 : 240,
    });
  });
  if (multiple) frames.push({
    ...common, phase: 'comparison', dice: candidates[selectedIndex], rollingIndices: [],
    revealedCount: candidates.length, title: `${common.selection === 'worst' ? '取较差结果' : '取较好结果'} · 保留第 ${selectedIndex + 1} 组`,
    duration: robot || reducedMotion ? 650 : 900,
  });
  const selected = candidates[selectedIndex];
  // 吉位或保底可能在候选选组后改变点数，单独演出才能解释最终确认结果。
  if (changedDice(selected, game.pendingDice).length) {
    frames.push(...changeFrames(selected, game.pendingDice, '场地或保底生效 · 点数变化').map(frame => ({
      ...common, ...frame, revealedCount: candidates.length,
    })));
  }
  return frames;
}
