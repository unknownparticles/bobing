/**
 * 对手陈主管的表情与台词。
 * 台词按档位分组,选取使用可注入的随机数来源,便于测试。
 */

/** 档位到表情:无奖与小奖得意,中奖平常,大奖懊恼。 */
const EXPRESSION_BY_TIER = {
  none: 'smug',
  minor: 'smug',
  major: 'neutral',
  grand: 'upset',
  supreme: 'upset',
};

export const EXPRESSIONS = ['neutral', 'smug', 'upset'];

export const expressionOf = (tier) => EXPRESSION_BY_TIER[tier] ?? 'neutral';

export const LINES = {
  idle: ['来,摇一碗,让我看看你的手气。', '中秋夜,谁是状元,碗里见真章。'],
  rolling: ['骰子在转,别眨眼。', '听这声音……有点意思。'],
  none: ['没中?运气也是实力的一部分。', '这碗……我替你可惜。', '哈,先从基层做起吧。'],
  minor: ['小打小闹,算你有一点运气。', '够发个小红包了。', '不错不错,继续保持。'],
  major: ['嗯?这手气,有点东西。', '别得意,后面还有我。', '我开始有点紧张了。'],
  grand: ['对堂?!这也行?', '哎呀,我得重新评估你了。', '不可能,我的奖金……'],
  supreme: ['状元?!我的中秋奖金啊!', '这碗是不是动了手脚?', '好家伙,今晚的状元就是你了!'],
};

/** 从某档位的台词池里取一句。rng 返回 [0,1)。未知档位退回 idle。 */
export function pickLine(tier, rng = Math.random) {
  const pool = LINES[tier] ?? LINES.idle;
  const i = Math.min(pool.length - 1, Math.max(0, Math.floor(rng() * pool.length)));
  return pool[i];
}
