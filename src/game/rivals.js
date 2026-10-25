/** 各章节的固定阵容；保留职业身份，卡牌组合由本桌随机货架形成。 */
const ROSTERS = [
  [
    { id: 'chen', name: '陈主管', title: '组内主管', portrait: 'chen', gender: 'male', strategy: 'steady', style: '求稳' },
    { id: 'mei', name: '小美', title: '同组伙伴', portrait: 'mei', gender: 'female', strategy: 'defend', style: '守成' },
    { id: 'wu', name: '老吴', title: '同组前辈', portrait: 'wu', gender: 'male', strategy: 'steal', style: '手快' },
    { id: 'lin', name: '大林', title: '同组同事', portrait: 'lin', gender: 'male', strategy: 'precision', style: '细算' },
    { id: 'jie', name: '阿杰', title: '同组新人', gender: 'male', strategy: 'gamble', style: '敢搏' },
  ],
  [
    { id: 'tang', name: '唐采购', title: '采购专员', gender: 'male', career: 'procurement', style: '采购流' },
    { id: 'lu', name: '陆会计', title: '部门财务', gender: 'female', career: 'finance', style: '精算流' },
    { id: 'qiao', name: '乔经理', title: '项目经理', gender: 'female', career: 'project', style: '调度流' },
    { id: 'xu', name: '小许', title: '部门同事', gender: 'female', strategy: 'defend', style: '守成' },
    { id: 'ye', name: '叶设计', title: '设计师', gender: 'female', strategy: 'precision', style: '改骰' },
    { id: 'liang', name: '梁运营', title: '运营专员', gender: 'male', strategy: 'steal', style: '掠夺' },
    { id: 'fei', name: '费策划', title: '策划专员', gender: 'male', strategy: 'forecast', style: '预告' },
  ],
  [
    { id: 'zhou', name: '周总', title: '老板', gender: 'male', career: 'boss', style: '资本流' },
    { id: 'su', name: '苏姐', title: '人事主管', gender: 'female', career: 'hr', style: '人脉流' },
    { id: 'gu', name: '顾工', title: '技术主管', gender: 'male', career: 'tech', style: '资历流' },
    { id: 'lu', name: '陆主管', title: '财务主管', gender: 'female', career: 'finance', style: '精算流' },
    { id: 'xuguan', name: '许冠', title: '销售冠军', gender: 'male', career: 'sales', style: '掠夺流' },
    { id: 'qiao', name: '乔经理', title: '项目经理', gender: 'female', career: 'project', style: '调度流' },
    { id: 'yan', name: '严主管', title: '测试主管', gender: 'male', career: 'qa', style: '纠错流' },
    { id: 'an', name: '安主管', title: '行政主管', gender: 'female', career: 'admin', style: '补给流' },
    { id: 'shen', name: '沈主管', title: '风控主管', gender: 'female', career: 'risk', style: '反制流' },
  ],
];

/** 返回独立身份；未知章节拒绝创建，避免悄悄使用错误阵容。 */
export function chapterRivals(chapterIndex) {
  if (!Number.isInteger(chapterIndex) || !ROSTERS[chapterIndex]) throw new RangeError('故事章节不存在');
  return ROSTERS[chapterIndex].map(identity => ({ ...identity, careerTier: ['group', 'department', 'company'][chapterIndex], archetype: null, branch: null }));
}

/** 组内电脑的基础牌组；玩家和其他章节不受此采购限制。 */
export const GROUP_CARDS = ['reroll', 'reroll_one', 'protect', 'steal', 'lucky_note'];
