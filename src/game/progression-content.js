/** 长期奖励目录独立于商品目录，商店、福袋与图鉴共用同一解锁条件。 */
export const ACHIEVEMENTS = [
  {
    id: 'first_win', name: '初登魁首', description: '任意模式首次获得本桌第一名。', progressLabel: '首次夺冠',
    reward: { content: [], titles: ['first_win'], description: '解锁“初登魁首”称号' },
  },
  {
    id: 'story_clear', name: '今晚谁是王中王', description: '获得故事第三章第一名，完成三章旅程。', progressLabel: '故事通关',
    reward: { content: [], titles: ['champion'], description: '解锁新周目与“公司王中王”称号' },
  },
  {
    id: 'luck_master', name: '鸿运当头', description: '本桌通过卡牌或神明使有效运气达到5，并最终获得第一名。', progressLabel: '有效运气达到5，且夺冠',
    reward: { content: ['luck_blessing'], titles: [], description: '“禄运双全”加入神明供奉候选' },
  },
  {
    id: 'theft_master', name: '借来的好彩头', description: '本桌本人成功偷取至少3份奖项，并最终获得第一名。', progressLabel: '本桌夺奖份数 / 3，且夺冠',
    reward: { content: ['double_steal'], titles: [], description: '“满载而归”加入技能商店与随机来源' },
  },
  {
    id: 'fengshui_master', name: '风水轮流转', description: '本人换位后，在换到的座位触发吉位效果。', progressLabel: '换位后触发吉位',
    reward: { content: ['forecast_one'], titles: [], description: '“一投定魁”加入技能商店与随机来源' },
  },
  {
    id: 'forecast_master', name: '就差这一骰', description: '本人通过单骰重投触发公开状元预告。', progressLabel: '单骰触发预告',
    reward: { content: [], titles: ['strategist'], description: '解锁“算无遗策”称号' },
  },
  {
    id: 'patience_master', name: '莫欺老年穷', description: '触发本人厚积薄发保底，并在本桌最终获得第一名。', progressLabel: '触发爆发，且夺冠',
    reward: { content: ['old_master'], titles: [], description: '“老骥伏枥”加入技能商店与随机来源' },
  },
  {
    id: 'all_paths', name: '百家争鸣', description: '亲自实践过养运、夺奖、座位或预告收益、蓄势爆发这四种效果。', progressLabel: '已实践效果 / 4',
    reward: { content: [], titles: ['all_paths'], description: '解锁“百家争鸣”称号与图鉴纪念标记' },
  },
];

/** 可装备称号；解锁不会自动替玩家选择称号。 */
export const TITLES = [
  { id: 'first_win', name: '初登魁首', description: '第一次赢下博饼桌。' },
  { id: 'champion', name: '公司王中王', description: '完成三章故事，赢下公司决赛。' },
  { id: 'strategist', name: '算无遗策', description: '用一颗骰子抢到公开状元预告。' },
  { id: 'all_paths', name: '百家争鸣', description: '通过实际出招探索过四种不同效果。' },
];

/** 返回物品对应的永久解锁成就；基础内容没有前置条件，返回 null。 */
export function getUnlockForItem(itemId) {
  return ACHIEVEMENTS.find(achievement => achievement.reward.content.includes(itemId)) || null;
}

/** 所有随机和购买来源都应先检查资格；未知基础物品沿用现有开放规则。 */
export function isContentUnlocked(itemId, unlockedContent = []) {
  return !getUnlockForItem(itemId) || unlockedContent.includes(itemId);
}

