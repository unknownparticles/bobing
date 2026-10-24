/** 完整商品牌库；价格、目标、时机和说明供商店、规则与机器人共用。 */
export const GODS = [
  {"id": "fortune", "name": "福神赐运", "price": 45, "description": "自己每次掷骰生成两组合法点数，自动保留奖型等级更高的一组；同等级取点数组合字典序较高的一组。", "category": "god", "timing": "shop", "target": "none", "effect": "fortune", "duration": 3},
  {"id": "wealth", "name": "财神进宝", "price": 40, "description": "自己从奖池新领取奖项时，基础积分额外增加 25%，通过独立积分账本记录；不额外消耗奖池份数，转移、赠送、交换不重复产生奖金。", "category": "god", "timing": "shop", "target": "none", "effect": "wealth", "duration": 3},
  {"id": "scholar", "name": "文昌点红", "price": 40, "description": "自己正常掷骰时，若一颗四点都没有，将最低点的一颗改为四点；已经有红点则不改。", "category": "god", "timing": "shop", "target": "none", "effect": "scholar", "duration": 3},
  {"id": "salary", "name": "禄神添财", "price": 30, "description": "每轮结算额外获得 10 金币，不改变奖项积分。", "category": "god", "timing": "shop", "target": "none", "effect": "salary", "duration": 3},
  {"id": "land", "name": "土地照拂", "price": 30, "description": "购买技能卡享八折，向上取整；不折扣神明与场地，不与其他价格效果叠加。", "category": "god", "timing": "shop", "target": "none", "effect": "land", "duration": 3},
  {"id": "kitchen", "name": "灶君暖席", "price": 25, "description": "自己一次确认后的掷骰未获奖时得到 5 金币；出碗、上厕所和主动送礼不触发。", "category": "god", "timing": "shop", "target": "none", "effect": "kitchen", "duration": 3},
  {"id": "guardian", "name": "关帝护持", "price": 40, "description": "每轮抵挡第一次针对自己的负面技能；抵挡后本轮不再触发，下轮恢复一次。", "category": "god", "timing": "shop", "target": "none", "effect": "guardian", "duration": 3},
  {"id": "longevity", "name": "寿星留席", "price": 30, "description": "免疫厕所卡造成的行动跳过；不免疫自己大力出碗等主动风险。", "category": "god", "timing": "shop", "target": "none", "effect": "longevity", "duration": 3},
  {"id": "matchmaker", "name": "月老牵线", "price": 45, "description": "自选一位未缔结、与登记性别相反的角色，后续积分得失平分三轮；不追溯缔结前积分。", "category": "god", "timing": "shop", "target": "player", "effect": "matchmaker", "duration": 3},
  {"id": "champion", "name": "魁星点斗", "price": 35, "description": "自己每轮第一次实际领取三红、对堂或状元时额外得到 10 金币；库存耗尽未发奖时不触发。", "category": "god", "timing": "shop", "target": "none", "effect": "champion", "duration": 3},
  {"id": "thunder", "name": "雷公压运", "price": 45, "description": "指定对手：其正常掷骰生成两组合法点数，自动保留奖型等级更低的一组；来源与剩余轮数公开。", "category": "god", "timing": "shop", "target": "player", "effect": "thunder", "duration": 3},
  {"id": "unlucky", "name": "太岁作祟", "price": 40, "description": "指定对手：其每次正常掷骰后，若存在四点，将一颗四点改为一；每次只改一颗。", "category": "god", "timing": "shop", "target": "player", "effect": "unlucky", "duration": 3},
];

export const SKILLS = [
  {"id": "reroll", "name": "重掷券", "price": 15, "description": "当前整组骰子作废，按当前场地的骰子数量重新掷一次。", "category": "skill", "timing": "after", "target": "none", "effect": "reroll", "group": "改骰"},
  {"id": "steal", "name": "顺手牵羊", "price": 20, "description": "选择一位未受保护且持有奖项的对手，从其当前持有的奖项中随机夺取一份，每份概率相同。", "category": "skill", "timing": "before", "target": "player", "effect": "steal", "group": "干扰"},
  {"id": "protect", "name": "保护罩", "price": 10, "description": "从使用到自己下一次行动开始，阻止对手夺取自己的奖项。沿用现有保护伞的效果，界面统一命名。", "category": "skill", "timing": "before", "target": "none", "effect": "protect", "group": "防守"},
  {"id": "toilet", "name": "厕所卡", "price": 20, "description": "指定对手跳过接下来一次行动；已行动者顺延下一轮，使用者本次仍可掷骰。", "category": "skill", "timing": "before", "target": "player", "effect": "toilet", "group": "干扰"},
  {"id": "miracle", "name": "大力出奇迹", "price": 25, "description": "本次直接进入掷骰：60% 获得库存允许的三红或以上奖型，30% 无奖，10% 骰子出碗、结束本次行动；无可发的高奖时不能使用。", "category": "skill", "timing": "before", "target": "none", "effect": "miracle", "group": "改骰"},
  {"id": "reroll_one", "name": "单骰重投", "price": 8, "description": "选择一颗骰子重新掷，其他点数保持。", "category": "skill", "timing": "after", "target": "die", "effect": "reroll_one", "group": "改骰"},
  {"id": "reroll_two", "name": "双骰重投", "price": 12, "description": "选择两颗不同骰子重新掷，其他点数保持。", "category": "skill", "timing": "after", "target": "twoDice", "effect": "reroll_two", "group": "改骰"},
  {"id": "keep_red", "name": "留红再博", "price": 20, "description": "保留全部四点，重新掷其余骰子；全红时不可浪费使用。", "category": "skill", "timing": "after", "target": "none", "effect": "keep_red", "group": "改骰"},
  {"id": "paint_red", "name": "点石成红", "price": 30, "description": "选择一颗非四点骰子，将点数改为四。", "category": "skill", "timing": "after", "target": "die", "effect": "paint_red", "group": "改骰"},
  {"id": "set_six", "name": "六六大顺", "price": 12, "description": "选择一颗非六点骰子，将点数改为六。", "category": "skill", "timing": "after", "target": "die", "effect": "set_six", "group": "改骰"},
  {"id": "set_one", "name": "一点灵犀", "price": 12, "description": "选择一颗非一点骰子，将点数改为一。", "category": "skill", "timing": "after", "target": "die", "effect": "set_one", "group": "改骰"},
  {"id": "plus_one", "name": "添一分运", "price": 8, "description": "选择一颗小于六点的骰子，点数加一，不循环到一。", "category": "skill", "timing": "after", "target": "die", "effect": "plus_one", "group": "改骰"},
  {"id": "minus_one", "name": "退一步海阔", "price": 8, "description": "选择一颗大于一点的骰子，点数减一，不循环到六。", "category": "skill", "timing": "after", "target": "die", "effect": "minus_one", "group": "改骰"},
  {"id": "flip", "name": "翻面见喜", "price": 10, "description": "选择一颗骰子翻到相对面，新点数为 7 减原点数。", "category": "skill", "timing": "after", "target": "die", "effect": "flip", "group": "改骰"},
  {"id": "copy_face", "name": "好事成双", "price": 15, "description": "先选来源骰子，再选另一颗目标骰子，将目标改成来源点数。", "category": "skill", "timing": "after", "target": "sourceDice", "effect": "copy_face", "group": "改骰"},
  {"id": "mirror", "name": "镜花水月", "price": 20, "description": "选择一位有同数量历史骰型的对手，复制其最近一次确认的点数直接进入结果确认；没有符合条件历史时不可用。", "category": "skill", "timing": "before", "target": "player", "effect": "mirror", "group": "改骰"},
  {"id": "lucky_note", "name": "福气贴", "price": 15, "description": "本次掷骰生成两组，保留奖型较高的一组；与福神重复时不再增加候选组数量。", "category": "skill", "timing": "before", "target": "none", "effect": "lucky_note", "group": "改骰"},
  {"id": "unlucky_note", "name": "倒霉贴", "price": 15, "description": "指定对手接下来一次掷骰取两组中较差者；与雷公不重复叠加组数。", "category": "skill", "timing": "before", "target": "player", "effect": "unlucky_note", "group": "干扰"},
  {"id": "disarm", "name": "两手空空", "price": 20, "description": "指定一位有技能卡的对手，随机销毁其一张技能卡；不能销毁神明、场地或已打出的牌。", "category": "skill", "timing": "before", "target": "player", "effect": "disarm", "group": "干扰"},
  {"id": "gift", "name": "借花献佛", "price": 10, "description": "选择自己持有的一份奖项送给对手，获得 10 金币；送出和收到的积分变化都参与姻缘分账。", "category": "skill", "timing": "before", "target": "award", "effect": "gift", "group": "资源"},
  {"id": "exchange", "name": "礼尚往来", "price": 25, "description": "选择同样有奖项的对手，交换双方最高基础积分奖项；展示交换对象，不能凭空生成奖项。", "category": "skill", "timing": "before", "target": "player", "effect": "exchange", "group": "资源"},
  {"id": "equal_coins", "name": "均分盘缠", "price": 25, "description": "选择一位对手，将双方金币总额平分；余一金币保留给原本金币更多的一方，不改变积分。", "category": "skill", "timing": "before", "target": "player", "effect": "equal_coins", "group": "资源"},
  {"id": "cleanse", "name": "金蝉脱壳", "price": 15, "description": "清除自己的倒霉贴、雷公、太岁效果；不清除姻缘、厕所或封印，不返还对手已消耗的牌。", "category": "skill", "timing": "before", "target": "none", "effect": "cleanse", "group": "防守"},
  {"id": "exorcism", "name": "驱邪令", "price": 35, "description": "选择一位对手及其一项正面神明效果，提前解除；解除月老时同步解除双方关系。", "category": "skill", "timing": "before", "target": "god", "effect": "exorcism", "group": "干扰"},
  {"id": "reflect", "name": "反弹符", "price": 20, "description": "到下次行动前，将第一张单目标负面技能反弹给原使用者；反弹不再次触发反弹。", "category": "skill", "timing": "before", "target": "none", "effect": "reflect", "group": "防守"},
  {"id": "substitute", "name": "替身纸人", "price": 20, "description": "到下次行动前，第一张单目标负面技能改由另一位合法对手承受；使用时预先选择替身目标，无合法替身则不能使用。", "category": "skill", "timing": "before", "target": "player", "effect": "substitute", "group": "防守"},
  {"id": "priority", "name": "抢个先手", "price": 15, "description": "下一轮自己优先行动一次，不增加行动次数；多人都使用时按本轮使用先后排列。", "category": "skill", "timing": "before", "target": "none", "effect": "priority", "group": "座位"},
  {"id": "swap_seat", "name": "换个风水", "price": 15, "description": "与指定对手交换座位；本轮已确定的行动队列保持，下轮按新座位生成顺序。", "category": "skill", "timing": "before", "target": "player", "effect": "swap_seat", "group": "座位"},
  {"id": "swap_others", "name": "调虎离山", "price": 20, "description": "选择两位其他玩家交换座位；本轮行动不重复，下轮按新座次行动。", "category": "skill", "timing": "before", "target": "twoPlayers", "effect": "swap_others", "group": "座位"},
  {"id": "seal", "name": "暂停施法", "price": 20, "description": "指定对手的下一次行动不能使用技能卡；神明被动仍生效，正常掷骰不受影响。", "category": "skill", "timing": "before", "target": "player", "effect": "seal", "group": "干扰"},
  {"id": "lucky_bag", "name": "拆个福袋", "price": 20, "description": "获得两张基础标价不超过 15 金币的随机技能卡，排除福袋本身；获得的新牌符合当前时机即可立即继续使用。", "category": "skill", "timing": "before", "target": "none", "effect": "lucky_bag", "group": "资源"},
  {"id": "recycle", "name": "旧物换钱", "price": 5, "description": "选择背包里另一张技能卡销毁，按其基础标价 60% 向下取整回收金币；不能回收正在用的回收卡、神明或场地。", "category": "skill", "timing": "before", "target": "card", "effect": "recycle", "group": "资源"},
];

export const FIELDS = [
  {"id": "reverse", "name": "逆水行舟", "price": 20, "description": "下一轮改为顺时针接碗，只改变行动顺序，不额外行动。", "category": "field", "timing": "shop", "target": "none", "effect": "reverse", "duration": 1},
  {"id": "shuffle", "name": "乾坤换席", "price": 25, "description": "下一轮开始时随机重排六个座位，随后按新座次逆时针行动；每人仍一次。", "category": "field", "timing": "shop", "target": "none", "effect": "shuffle", "duration": 1},
  {"id": "rotate", "name": "移步换景", "price": 15, "description": "所有人座位顺时针平移一格；下一轮从新的底部座位开始逆时针行动。", "category": "field", "timing": "shop", "target": "none", "effect": "rotate", "duration": 1},
  {"id": "leader_last", "name": "后来居上", "price": 20, "description": "下一轮按开始时积分从低到高行动；同分按原座次，不在轮中重新排序。", "category": "field", "timing": "shop", "target": "none", "effect": "leader_last", "duration": 1},
  {"id": "five_dice", "name": "五福临门", "price": 20, "description": "下一轮每次只掷五颗，奖型门槛保持原规则，不自动补骰。", "category": "field", "timing": "shop", "target": "none", "effect": "five_dice", "duration": 1},
  {"id": "seven_dice", "name": "七星高照", "price": 30, "description": "下一轮每次掷七颗，可出现七红、七颗全一、七颗其他同点。", "category": "field", "timing": "shop", "target": "none", "effect": "seven_dice", "duration": 1},
  {"id": "eight_dice", "name": "八仙过海", "price": 40, "description": "下一轮每次掷八颗，可出现八红及八颗同点；七同、六同等已有门槛仍成立。", "category": "field", "timing": "shop", "target": "none", "effect": "eight_dice", "duration": 1},
  {"id": "six_dice", "name": "六六归真", "price": 15, "description": "下一轮固定六颗，免受其他骰子数量修正；仍与所有场地一起参与单一场地选择。", "category": "field", "timing": "shop", "target": "none", "effect": "six_dice", "duration": 1},
  {"id": "red_table", "name": "鸿运当头", "price": 30, "description": "下一轮四点的抽取权重为其他每个点数的两倍，即四点 2/7，其他各 1/7。", "category": "field", "timing": "shop", "target": "none", "effect": "red_table", "duration": 1},
  {"id": "black_table", "name": "红运暂歇", "price": 20, "description": "下一轮四点的抽取权重为其他点数的一半，即四点 1/11，其他各 2/11。", "category": "field", "timing": "shop", "target": "none", "effect": "black_table", "duration": 1},
  {"id": "small_table", "name": "小点成双", "price": 20, "description": "下一轮正常生成骰子后，将五点变一点、六点变两点，其余保持；让一点、两点更集中，确实改变同点奖型概率。显式改点技能作用于变换后的点数，不再重复变换。", "category": "field", "timing": "shop", "target": "none", "effect": "small_table", "duration": 1},
  {"id": "harvest", "name": "团圆丰收席", "price": 25, "description": "下一轮结算基础收入由 20 提高到 30 金币；禄神额外收入继续另算，积分不变。", "category": "field", "timing": "shop", "target": "none", "effect": "harvest", "duration": 1},
];

export const CATALOG = [...GODS, ...SKILLS, ...FIELDS];

/** 按商品 ID 取配置；未知 ID 返回 undefined，由规则层拒绝动作。 */
export const getItem = id => CATALOG.find(item => item.id === id);
