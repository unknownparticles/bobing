/** 动画只描述已结算事务，不承担发奖或扣牌；序号用于逐条确认且防止旧回调误删新事件。 */
export const VISUAL_DURATION_MS = 1100;

/** 在当前状态尾部追加一条真实作用记录，可包含原始目标、最终目标与奖项。 */
export function queueVisual(game, event) {
  game.visualSequence = (game.visualSequence || 0) + 1;
  game.visuals ??= [];
  game.visuals.push({ id: game.visualSequence, kind: 'skill', outcome: 'applied', ...event });
}
