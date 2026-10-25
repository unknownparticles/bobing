import { rankOf, scoreOf } from './economy';
import { ACHIEVEMENTS } from './progression-content';
import { publicBuffsOf, publicIdentity } from './encounters';
import { effectiveLuck } from './archetypes';

export const ARCHIVE_VERSION = 1;
export const ARCHIVE_STORAGE_KEY = 'bobing.progression.archive';

/** 新建长期档案；金币、奖项和进行中的对局不写入此档案。 */
export function createArchive() {
  return {
    version: ARCHIVE_VERSION,
    discovered: [], used: [], characters: [], skills: [], unlockedContent: [], achievements: [], titles: [], selectedTitle: '',
    storyWins: { luck: 0, theft: 0, fengshui: 0, patience: 0 },
    cyclesCompleted: 0, storyClears: 0, exploredEffects: [], cursors: {},
  };
}

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isCount = value => Number.isSafeInteger(value) && value >= 0;
const isStringList = value => Array.isArray(value) && value.every(item => typeof item === 'string');

/** 验证整个持久化边界，避免合法 JSON 中错误的字段类型在界面引起白屏。 */
function isValidArchive(value) {
  return isRecord(value) && value.version === ARCHIVE_VERSION
    && ['discovered', 'used', 'unlockedContent', 'achievements', 'titles'].every(key => isStringList(value[key]))
    && ['characters', 'skills'].every(key => value[key] === undefined || isStringList(value[key]))
    && typeof value.selectedTitle === 'string' && (!value.selectedTitle || value.titles.includes(value.selectedTitle))
    && isRecord(value.storyWins) && ['luck', 'theft', 'fengshui', 'patience'].every(key => isCount(value.storyWins[key]))
    && (value.storyClears === undefined || isCount(value.storyClears))
    && (value.exploredEffects === undefined || isStringList(value.exploredEffects))
    && isCount(value.cyclesCompleted) && isRecord(value.cursors)
    && Object.values(value.cursors).every(cursor => isRecord(cursor) && isCount(cursor.seq)
      && typeof cursor.finalized === 'boolean' && isCount(cursor.theft) && typeof cursor.burst === 'boolean'
      && (cursor.maxLuck === undefined || isCount(cursor.maxLuck))
      && (cursor.storyRunId === undefined || typeof cursor.storyRunId === 'string'));
}

/** 读取档案；损坏时提供可用空档案，未知新版只读并保留原始存储。 */
export function loadArchive(storage) {
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    if (!target) throw new Error('浏览器没有提供本地存储');
    const raw = target.getItem(ARCHIVE_STORAGE_KEY);
    if (raw === null) return { archive: createArchive(), error: '', readOnly: false };
    const value = JSON.parse(raw);
    if (isRecord(value) && value.version > ARCHIVE_VERSION) {
      return { archive: { ...createArchive(), version: value.version }, error: '检测到新版档案，当前版本只读，原档案已保留。', readOnly: true };
    }
    if (!isValidArchive(value)) throw new Error('档案结构或版本不受支持');
    // 旧版没有角色与技能字段；补齐集合即可保留原来的卡牌、成就与称号。
    return { archive: { characters: [], skills: [], ...value }, error: '', readOnly: false };
  } catch (error) {
    return { archive: createArchive(), error: `长期档案读取失败：${error.message || '存储不可用'}。`, readOnly: false };
  }
}

/** 保存完整档案并返回错误提示；即使调用方忘记只读标记，也不覆盖新版档案。 */
export function saveArchive(archive, storage) {
  try {
    if (!isValidArchive(archive)) throw new Error('档案无效或来自较新版本');
    const target = storage === undefined ? globalThis.localStorage : storage;
    if (!target) throw new Error('浏览器没有提供本地存储');
    const raw = target.getItem(ARCHIVE_STORAGE_KEY);
    if (raw) {
      let existing;
      try { existing = JSON.parse(raw); } catch { /* 损坏档案可由新的有效档案恢复。 */ }
      if (existing?.version > ARCHIVE_VERSION) throw new Error('检测到新版档案，已停止覆盖');
    }
    target.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archive));
    return { error: '' };
  } catch (error) {
    return { error: `本次长期进度未能保存：${error.message || '存储不可用'}。` };
  }
}

/** 将真实规则事件同步到新档案；每桌游标及终局标记共同防止重复奖励。 */
export function syncArchive(archive, game) {
  const unchanged = { archive, changed: false, newAchievements: [], newUnlocks: [] };
  if (archive.version !== ARCHIVE_VERSION || !game?.id) return unchanged;
  const next = structuredClone(archive);
  next.characters ??= [];
  next.skills ??= [];
  // 旧档案的分类通关只保留历史总数，后续通关不再依赖任何身份。
  next.storyClears ??= Object.values(next.storyWins).reduce((sum, count) => sum + count, 0);
  next.exploredEffects ??= [];
  // 独立保存每桌统计，章节晋级或进入另一张桌时不会沿用偷盗份数和爆发状态。
  const cursor = Object.hasOwn(next.cursors, game.id)
    ? next.cursors[game.id] : { seq: 0, finalized: false, theft: 0, burst: false };
  const qualifying = new Set();
  const add = (list, value) => {
    if (typeof value === 'string' && value && !list.includes(value)) list.push(value);
  };
  for (const player of game.players || []) {
    const identity = publicIdentity(player);
    add(next.characters, identity.characterId);
    for (const skillId of identity.skills) add(next.skills, skillId);
    // 自动生效的神明无需主动出牌；进入公开生效阶段也应能查到其规则。
    for (const buff of publicBuffsOf(game, player)) add(next.discovered, buff.itemId || buff.id);
  }
  const you = game.players?.find(player => player.id === 'you');
  cursor.maxLuck = Math.max(cursor.maxLuck || 0, you ? effectiveLuck(game, you) : 0);
  const events = (game.events || []).filter(event => Number.isSafeInteger(event.seq) && event.seq > cursor.seq).sort((a, b) => a.seq - b.seq);
  for (const event of events) {
    // 所有人的公开出牌都算遇见；私有货架、获得记录与成就仍只看本人。
    cursor.seq = event.seq;
    if (event.type === 'use') add(next.discovered, event.itemId);
    if (event.actorId !== 'you') continue;
    if (['discover', 'acquire', 'use'].includes(event.type)) add(next.discovered, event.itemId);
    if (event.type === 'use') add(next.used, event.itemId);
    if (event.type === 'use' && ['gather_luck', 'lucky_note', 'fortune', 'luck_blessing'].includes(event.itemId)) add(next.exploredEffects, 'luck');
    if (event.type === 'theft' && isCount(event.amount)) { cursor.theft += event.amount; add(next.exploredEffects, 'theft'); }
    if (event.type === 'burst') { cursor.burst = true; add(next.exploredEffects, 'patience'); }
    if (event.type === 'wind') add(next.exploredEffects, 'fengshui');
    if (event.type === 'wind' && event.reason === 'seat' && event.swapped === true) qualifying.add('fengshui_master');
    if (event.type === 'wind' && event.reason === 'forecast' && event.singleDie === true) qualifying.add('forecast_master');
  }
  if (game.stage === 'finished' && !cursor.finalized) {
    cursor.finalized = true;
    const player = game.players?.find(entry => entry.id === 'you');
    const first = player && !game.players.some(other => scoreOf(other) > scoreOf(player)
      || scoreOf(other) === scoreOf(player) && rankOf(other) > rankOf(player));
    if (first) {
      qualifying.add('first_win');
      if (cursor.theft >= 3) qualifying.add('theft_master');
      if (cursor.burst) qualifying.add('patience_master');
      if (cursor.maxLuck >= 5) qualifying.add('luck_master');
      if (game.match?.mode === 'story' && game.match.chapterIndex === 2) {
        const runId = game.match.storyRunId || game.id;
        const alreadyCounted = Object.values(next.cursors).some(entry => entry.storyRunId === runId);
        if (!alreadyCounted) {
          cursor.storyRunId = runId;
          next.storyClears += 1;
          next.cyclesCompleted = Math.max(next.cyclesCompleted, isCount(game.match.cycle) ? game.match.cycle : 1);
          qualifying.add('story_clear');
        }
      }
    }
  }
  // defineProperty 同样支持任意字符串桌号，避免 __proto__ 等键改变对象原型。
  Object.defineProperty(next.cursors, game.id, { value: cursor, enumerable: true, writable: true, configurable: true });
  if (['luck', 'theft', 'fengshui', 'patience'].every(effect => next.exploredEffects.includes(effect))) qualifying.add('all_paths');
  const newAchievements = [];
  const newUnlocks = [];
  for (const achievement of ACHIEVEMENTS) {
    if (!qualifying.has(achievement.id) || next.achievements.includes(achievement.id)) continue;
    next.achievements.push(achievement.id);
    newAchievements.push(achievement.id);
    for (const itemId of achievement.reward.content) {
      if (!next.unlockedContent.includes(itemId)) newUnlocks.push(itemId);
      add(next.unlockedContent, itemId);
    }
    for (const titleId of achievement.reward.titles) add(next.titles, titleId);
  }
  if (JSON.stringify(next) === JSON.stringify(archive)) return unchanged;
  return { archive: next, changed: true, newAchievements, newUnlocks };
}
