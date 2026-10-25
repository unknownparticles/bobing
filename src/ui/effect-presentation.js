import { getItem } from '../game/catalog';

/** 只读取真实结果选择表现；抵挡与改向优先，避免把防住的攻击画成命中。 */
export function effectPresentation(event) {
  const item = getItem(event.icon);
  // 抢夺结果的方向是原持有人→获得者；只有施法事件可以标为攻击。
  const hostile = event.kind === 'attack' || event.kind === 'skill' && item?.group === '干扰' && event.sourceId !== (event.targetId ?? event.sourceId);
  let theme = 'blessing';
  if (event.outcome === 'blocked') theme = 'guard';
  else if (['reflect', 'substitute'].includes(event.kind)) theme = 'redirect';
  else if (event.kind === 'field' || item?.category === 'field') theme = 'field';
  else if (event.kind === 'bond') theme = 'blessing';
  else if (item?.category === 'god' && event.kind === 'shield') theme = 'blessing';
  else if (event.kind === 'shield') theme = 'guard';
  else if (['transfer', 'champion', 'score', 'attack'].includes(event.kind)) theme = 'transfer';
  else if (hostile) theme = 'transfer';
  else if (item?.group === '座位') theme = 'field';
  else if (item?.group === '改骰' || event.icon === 'reroll_one') theme = 'dice';
  return { theme, item, hostile };
}
