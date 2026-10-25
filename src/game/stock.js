import { GODS, SKILLS, FIELDS } from './catalog';
import { heroOf } from './heroes';
import { isContentUnlocked } from './progression-content';
import { emitEvent } from './events';

export const STOCK_COUNTS = { god: 2, skill: 3, field: 3 };

/** 已解锁分类牌池内随机无放回抽取，不按玩家身份保底；购买/渲染不改变已确定的货架，刷新才重新抽取。 */
export function drawStock(rng, player, unlockedContent = []) {
  return Object.fromEntries([['god', GODS], ['skill', SKILLS], ['field', FIELDS]].map(([category, source]) => {
    const remaining = source.filter(card => isContentUnlocked(card.id, unlockedContent)).map(card => card.id);
    const selected = [];
    for (let index = selected.length; index < STOCK_COUNTS[category]; index += 1) {
      const [id] = remaining.splice(Math.floor(rng() * remaining.length), 1);
      selected.push(id);
    }
    return [category, selected];
  }));
}

/** 每位玩家有独立货架和刷新次数；进入新轮商店时免费生成并重置价格。 */
export function initializeShop(game, rng) {
  game.shopStock = Object.fromEntries(game.players.map(player => [player.id, drawStock(rng, player, game.match.unlockedContent)]));
  for (const player of game.players) for (const itemId of Object.values(game.shopStock[player.id]).flat()) emitEvent(game, 'discover', player.id, { itemId });
  game.shopRefreshes = Object.fromEntries(game.players.map(player => [player.id, 0]));
}

/** C的首刷免费，付费部分仍为5、10、15；offset用于界面预告下次真实价格。 */
export function refreshPrice(game, userId, offset = 0) {
  const count = (game.shopRefreshes?.[userId] || 0) + offset;
  const player = game.players.find(entry => entry.id === userId);
  return heroOf(player)?.id === 'hero-c' ? 5 * count : 5 * (count + 1);
}
