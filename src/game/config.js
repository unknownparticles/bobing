/**
 * 游戏数值的唯一来源。奖项的积分与优先级只在这里定义,
 * 规则、计分、界面都从这里读取,不要在别处重复写数字。
 */

/** 奖项表,数组顺序即优先级(靠前的优先)。 */
export const AWARDS = [
  { id: 'zhuangyuan', name: '状元', points: 1000, count: 2, icon: 'crown', color: 'gold' },
  { id: 'duitang', name: '对堂', points: 500, count: 2, icon: 'leaf', color: 'jade' },
  { id: 'sanhong', name: '三红', points: 100, count: 3, icon: 'circle', color: 'red' },
  { id: 'sijin', name: '四进', points: 80, count: 4, icon: 'diamond', color: 'blue' },
  { id: 'erju', name: '二举', points: 20, count: 20, icon: 'medal', color: 'orange' },
  { id: 'yixiu', name: '一秀', points: 10, count: 20, icon: 'gem', color: 'cream' },
];

/** 按 id 查奖项,找不到返回 undefined。 */
export const getAward = (id) => AWARDS.find((a) => a.id === id);

/** 某奖项的每份积分,无奖(null)或未知 id 为 0。 */
export const pointsOf = (id) => getAward(id)?.points ?? 0;

/** 练习桌:每桌可摇碗的次数(临时玩法,后续由肉鸽主线替换)。 */
export const PRACTICE_ROLLS_PER_TABLE = 3;

/** 从屏幕底部出发逆时针接碗，行动和顺序条共用这份座位顺序。 */
export const COUNTERCLOCKWISE_SEATS = ['bottom', 'right-bottom', 'right-top', 'top', 'left-top', 'left-bottom'];

/** 六人完成一轮后发放，金币不参与奖项积分与排名。 */
export const ROUND_COINS = 20;

/** 完整行动八轮后结算，每位玩家获得相同的正式掷骰机会。 */
export const MAX_ROUNDS = 8;

/** 固定商品；每位玩家每种每轮限购一件，库存可以跨轮积累。 */
export const SHOP_ITEMS = [
  { id: 'reroll', name: '重掷券', price: 15, description: '看结果后重投全部六颗骰子，旧结果作废。' },
  { id: 'steal', name: '顺手牵羊', price: 20, description: '掷骰前夺取一名未受保护对手的最高积分奖项。' },
  { id: 'protect', name: '保护伞', price: 10, description: '掷骰前使用，到你下次行动前免于被夺取。' },
];
