import { HEROES, heroOf } from './heroes';
import { COLLEAGUES } from './modes';
import { getItem } from './catalog';
import { getAward } from './config';
import { chapterRivals } from './rivals';
import { careerOf } from './careers';

const chapterNames = { group: '组内桌', department: '部门桌', company: '公司桌' };
const storyCharacters = [0, 1, 2].flatMap(chapterRivals);

/** 技能说明直接来自实际规则配置，避免图鉴和角色选择的文案分叉。 */
export const PUBLIC_SKILLS = [
  ...Object.values(HEROES).map(hero => ({ id: `hero:${hero.id}`, name: hero.skill, icon: hero.icon, description: hero.description, source: `${hero.name} · 主角专属技能` })),
  ...storyCharacters.filter(player => careerOf(player)).map(player => ({
    id: `career:${player.careerTier}:${player.career}`, ...careerOf(player),
    source: `${chapterNames[player.careerTier]} · ${player.title}`,
  })),
];

/** 固定角色资料不保存对手的手牌，公开效果按每桌实时读取。 */
export const CHARACTERS = [
  ...Object.values(HEROES).map(hero => ({ id: hero.id, name: hero.name, portrait: hero.id, title: '可选主角', description: `${hero.skill}：${hero.description}` })),
  ...COLLEAGUES.map(person => ({ ...person, description: `同桌好手 · ${person.title}。本桌公开效果与出招可在玩家详情查看。` })),
  // 同一同事在不同章节可能有不同称呼或职业数值，保留当时遇见的资料。
  ...storyCharacters.map(person => ({ ...person, id: `story:${person.careerTier}:${person.id}`, title: `${chapterNames[person.careerTier]} · ${person.title}`, description: careerOf(person)?.description || `${person.style}打法；公开技能与本桌出招可在玩家详情查看。` })),
];

/** 返回玩家公开身份与人物专属技能；未配置的身份不凭空生成档案。 */
export function publicIdentity(player) {
  const hero = heroOf(player);
  const characterId = player.id === 'you' ? hero?.id : player.careerTier ? `story:${player.careerTier}:${player.id}` : player.id;
  const skills = [];
  if (hero) skills.push(`hero:${hero.id}`);
  if (careerOf(player)) skills.push(`career:${player.careerTier}:${player.career}`);
  return { characterId: CHARACTERS.some(character => character.id === characterId) ? characterId : null, skills };
}

/** 只查询实际使用事件；不读取 items 或购买事件，因此不会泄露未出手的牌。 */
export function usedCardsOf(game, playerId) {
  const ids = new Set((game.events || []).filter(event => event.type === 'use' && event.actorId === playerId).map(event => event.itemId));
  return [...ids].map(getItem).filter(Boolean);
}

/** 神明供奉在真正生效后公开；尚未开始的供奉和待选目标都不能暴露为已使用。 */
export function publicBuffsOf(game, player) {
  return (player.buffs || []).filter(buff => {
    const item = getItem(buff.itemId || buff.id);
    if (!item || buff.fromRound > game.round || buff.untilRound < game.round) return false;
    return buff.role !== 'offering' || item.target !== 'player' || !!buff.targetId;
  });
}

/** 已公开出招产生的实时状态；普通详情和故事对手详情共用，消耗后自动移除。 */
export function publicStatesOf(game, player) {
  const substitute = game.players.find(entry => entry.id === player.substituteId);
  return [
    player.protected && '保护中：阻止对手夺取奖项',
    player.reflect && `反弹符：${getItem('reflect').description}`,
    player.skip && '下一次行动跳过',
    player.sealed && '本次行动被封印：不能使用手牌或职业主动技能',
    player.sealPending && '下一次行动被封印',
    player.lucky && `福气贴：${getItem('lucky_note').description}`,
    player.unlucky && `倒霉贴：${getItem('unlucky_note').description}`,
    substitute && `替身纸人：下一张单目标负面技能转给${substitute.name}`,
    player.secureLoot && getItem('secure_loot') && `得手就收：${getItem('secure_loot').description}`,
    player.nextMinimum && `下一次正式投掷保底${getAward(player.nextMinimum)?.name}`,
  ].filter(Boolean);
}
