/**
 * 奖项分档:把判奖结果映射为反馈强度。
 * 反馈组件只读档位,新增奖项只需要改这张映射表。
 */
export const TIERS = ['none', 'minor', 'major', 'grand', 'supreme'];

const TIER_BY_AWARD = {
  yixiu: 'minor',
  erju: 'minor',
  sanhong: 'major',
  sijin: 'major',
  duitang: 'grand',
  zhuangyuan: 'supreme',
};

/** awardId(可为 null)到档位。未知 id 按无奖处理。 */
export const tierOf = (awardId) => TIER_BY_AWARD[awardId] ?? 'none';

/** 档位强度,从 0 开始。 */
export const tierRank = (tier) => TIERS.indexOf(tier);

/** tier 是否不低于 min。 */
export const atLeast = (tier, min) => tierRank(tier) >= tierRank(min);
