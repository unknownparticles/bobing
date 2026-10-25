import { COUNTERCLOCKWISE_SEATS, MAX_ROUNDS } from './config';
import { getHero } from './heroes';
import { rankOf, scoreOf } from './economy';
import { chapterRivals } from './rivals';

/** 故事的三张桌；每章独立开局，剧情只决定目标，不修改掷骰概率。 */
export const STORY_CHAPTERS = [
  {
    id: 'group', title: '第一章 · 组内博饼', name: '组内博饼', playerCount: 6,
    eyebrow: '下班之后，故事开始。', headline: '普通员工，', highlight: '也能拿状元。',
    location: '办公室 · 六人小组席', speaker: '陈主管',
    scenes: [
      { title: '下班铃响', text: '下班铃声响起，小美抱着一摞奖品走进办公室：“今晚组里六个人，谁也不许先走！”你接过那只青瓷碗，第一次坐到了桌子正中。', quote: '先赢下这一桌，再让整个部门记住你的名字。', action: '跟同事们入席' },
      { title: '一张入场券', text: '陈主管把部门赛的邀请函压在奖盒下。组内第一名才能代表小组出战。老吴已经摩拳擦掌，阿杰说今晚一定要翻盘；这一次，你也想争一争。', quote: '八轮之后，奖项积分第一的人，带着小组的好彩头去下一桌。', action: '开博，争小组第一' },
    ],
    victory: '陈主管把邀请函递给你：“小组的好彩头，交给你带去部门赛。”同事们举起杯子，下一桌的灯已经亮了。',
    defeat: '邀请函暂时留在了桌上。小美替你收好骰子：“再来一桌，我们陪你。”赢下组内第一，才能前往部门赛。',
  },
  {
    id: 'department', title: '第二章 · 部门争锋', name: '部门博饼', playerCount: 8,
    eyebrow: '带着小组的期待，再上一桌。', headline: '从小组出线，', highlight: '向部门第一。',
    location: '晚宴大厅 · 八人部门席', speaker: '乔经理',
    scenes: [
      { title: '推开宴会厅的门', text: '你带着组内冠军的邀请函来到宴会厅。八个座位围成一圈，隔壁组的小许向你招手，乔经理收起名单：“各组的好手都到齐了。”', quote: '到了这张桌，之前的积分先放下。凭今晚的八轮，再争一次第一。', action: '看看部门赛的对手' },
      { title: '为小组再赢一次', text: '小美和老吴在旁边为你打气。乔经理拿出公司王中王的席位牌：这张八人桌的第一名，才能进入最后的十人决赛。你把空碗推向桌心，重新出发。', quote: '别急着亮出所有好招。能守住最后一轮，才算赢到最后。', action: '开博，争部门第一' },
    ],
    victory: '乔经理把决赛席位牌放进你手里：“部门第一，实至名归。去吧，让公司看看我们部门的本事。”',
    defeat: '决赛席位还差一步。陈主管拍拍你的肩：“能从小组走到这里，就能再往前一步。”调整出招时机，再战部门桌。',
  },
  {
    id: 'company', title: '第三章 · 公司王中王', name: '公司王中王', playerCount: 10,
    eyebrow: '最后一桌，全场都在等你。', headline: '十人争魁，', highlight: '今晚谁是王中王。',
    location: '主舞台 · 十人王中王席', speaker: '周总',
    scenes: [
      { title: '聚光灯下的空位', text: '公司晚宴的聚光灯亮起，十人决赛桌只剩你的座位。各桌好手已经入席，周总举起青瓷碗：“不论职级，今晚只凭这一桌的本事。”', quote: '能走到这里的人，都赢过一桌。最后这八轮，每个人重新开始。', action: '走向王中王决赛桌' },
      { title: '替所有普通员工争一回', text: '你听见身后同组伙伴的加油声。行政的苏姐把最后一盒奖品摆上台，碗沿映出十个人的笑脸。从办公室那一碗到现在，今晚的答案，就在这最后八轮。', quote: '把好运接住，把好招用好。公司王中王，等你亲手拿下。', action: '开博，争公司王中王' },
    ],
    victory: '周总把王中王的奖盒交给你。小美、老吴和陈主管挤到台前，笑着喊你的名字。从办公室的小组桌，到全公司的最后一桌，你把大家的期待变成了好彩头。月圆人齐，今晚，你就是公司王中王。',
    defeat: '距离王中王，只差最后这一桌。台下的同事仍在为你鼓掌：“我们陪你再争一次！”留在十人决赛桌，下一局把冠军赢回来。',
  },
];

export const GAME_MODES = [
  { id: 'story', name: '故事模式', tag: '三章晋级', detail: '组内 6 人 → 部门 8 人 → 公司王中王 10 人', description: '每章八轮，夺冠晋级，写下你的中秋故事。' },
  { id: 'quick', name: '快速模式', tag: '双人对局', detail: '你与一名电脑 · 八轮见分晓', description: '直接开桌，少些等待，随时来一局。' },
  { id: 'classic', name: '经典模式', tag: '自定义人数', detail: '不限回合 · 奖池博完为止', description: '你与电脑同桌，保留卡牌、商店和主角技能。' },
];

/** 用户确认自定义人数为二到十人；界面与规则层共用边界，避免超大输入白屏。 */
export const MIN_PLAYER_COUNT = 2;
export const MAX_PLAYER_COUNT = 10;
export const isValidPlayerCount = count => Number.isInteger(count) && count >= MIN_PLAYER_COUNT && count <= MAX_PLAYER_COUNT;

/** 生成单局配置；经典模式用 null 明确表示没有轮数上限。 */
export function createMatch(mode = 'story', { chapterIndex = 0, playerCount = 6 } = {}) {
  if (!GAME_MODES.some(item => item.id === mode)) throw new RangeError('未知的游戏模式');
  if (mode === 'story') {
    const chapter = STORY_CHAPTERS[chapterIndex];
    if (!Number.isInteger(chapterIndex) || !chapter) throw new RangeError('故事章节不存在');
    return { mode, chapterIndex, title: chapter.title, playerCount: chapter.playerCount, maxRounds: MAX_ROUNDS };
  }
  const count = mode === 'quick' ? 2 : playerCount;
  if (!isValidPlayerCount(count)) throw new RangeError(`总人数请填写 ${MIN_PLAYER_COUNT}～${MAX_PLAYER_COUNT} 之间的整数`);
  return { mode, chapterIndex: null, title: mode === 'quick' ? '快速模式 · 双人对局' : '经典模式 · 团圆博饼', playerCount: count, maxRounds: mode === 'classic' ? null : MAX_ROUNDS };
}

/** 从底部开始逆时针编号；六人沿用原座位名，保证既有规则入口兼容。 */
export function seatsForCount(count) {
  if (!isValidPlayerCount(count)) throw new RangeError(`对局人数必须为 ${MIN_PLAYER_COUNT}～${MAX_PLAYER_COUNT} 之间的整数`);
  if (count === 6) return [...COUNTERCLOCKWISE_SEATS];
  if (count === 2) return ['bottom', 'top'];
  return Array.from({ length: count }, (_, index) => index === 0 ? 'bottom' : `seat-${index}`);
}

/** 同桌角色的稳定身份；portrait 指向正式立绘或同事头像，角色图鉴和入桌名单共用，不能用头像代替身份。 */
export const COLLEAGUES = [
  { id: 'chen', name: '陈主管', title: '鸿运型', portrait: 'chen', gender: 'male' },
  { id: 'mei', name: '小美', title: '稳健型', portrait: 'mei', gender: 'female' },
  { id: 'wu', name: '老吴', title: '掠夺型', portrait: 'wu', gender: 'male' },
  { id: 'lin', name: '大林', title: '控制型', portrait: 'lin', gender: 'male' },
  { id: 'jie', name: '阿杰', title: '赌徒型', portrait: 'jie', gender: 'male' },
  { id: 'xu', name: '小许', title: '稳健型', portrait: 'xu', gender: 'female' },
  { id: 'qiao', name: '乔经理', title: '控制型', portrait: 'qiao', gender: 'female' },
  { id: 'zhou', name: '周总', title: '鸿运型', portrait: 'zhou', gender: 'male' },
  { id: 'su', name: '苏姐', title: '掠夺型', portrait: 'su', gender: 'female' },
];

/** 按总人数创建独立身份；portrait 已覆盖正式立绘与同事头像，仍未配置形象的同事使用通用头像。 */
export function createPlayers(profile, count, match) {
  const rivals = match?.mode === 'story' ? chapterRivals(match.chapterIndex) : COLLEAGUES;
  if (match?.mode === 'story' && rivals.length + 1 !== count) throw new RangeError('章节阵容与人数不符');
  return seatsForCount(count).map((seat, index) => {
    const identity = index === 0
      ? { ...profile, id: 'you', name: profile.name.trim(), title: profile.role, gender: getHero(profile.portrait).gender }
      : rivals[index - 1] || { id: `colleague-${index}`, name: `同事${index + 1}`, title: '同桌好手', gender: index % 2 ? 'male' : 'female' };
    return { ...identity, seat, awards: [] };
  });
}

/** 与成绩单共用胜负判断；积分和最高状元等级都相同的人并列。 */
export function placeOf(game, playerId = 'you') {
  const player = game.players.find(entry => entry.id === playerId);
  if (!player) return null;
  return game.players.filter(other => scoreOf(other) > scoreOf(player) || scoreOf(other) === scoreOf(player) && rankOf(other) > rankOf(player)).length + 1;
}
