/** 主角身份以形象为准；选择外观、入局和重开都读取同一份定义。 */
export const HEROES = {
  'hero-a': { id: 'hero-a', name: '初来乍到', gender: 'male', genderLabel: '男生', skill: '再搏一次', icon: 'reroll_one', description: '每轮看结果后，可免费重掷一颗骰子一次。' },
  'hero-b': { id: 'hero-b', name: '从容入席', gender: 'female', genderLabel: '女生', skill: '稳稳护住', icon: 'protect', description: '每轮自动抵挡第一次顺手牵羊夺奖。' },
  'hero-c': { id: 'hero-c', name: '心有妙计', gender: 'male', genderLabel: '男生', skill: '精打细算', icon: 'land', description: '每次进商店首次刷新免费，之后从5金币递增。' },
};

/** 非主角形象没有主角定义，避免为同桌角色猜测外观或性别。 */
export const getHero = portrait => HEROES[portrait];

/** 仅可选主角享有基础技能；同桌角色不会因复用头像资源意外取得天赋。 */
export const heroOf = player => player?.id === 'you' ? getHero(player.portrait) : undefined;

/** A的免费重掷仅限自己的结果阶段，每轮一次，与手牌库存和封印相互独立。 */
export function canUseHeroReroll(game) {
  const player = game.players[game.turnIndex];
  return game.stage === 'review' && !game.visuals?.length && heroOf(player)?.id === 'hero-a' && player.heroRerollRound !== game.round;
}
