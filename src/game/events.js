/** 记录规则已经发生的事实；序号由对局持有，动画和页面重绘不能重复产生事件。 */
export function emitEvent(game, type, actorId, details = {}) {
  game.events ??= [];
  const event = { ...details, seq: game.events.length + 1, type, actorId };
  game.events.push(event);
  return event;
}
