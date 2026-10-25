import { getItem } from './catalog';
import { blessingsOf, hasBuff } from './economy';
import { careerPrice } from './careers';
import { GROUP_CARDS } from './rivals';

const PREFERENCES = {
  boss: ['fortune', 'wealth', 'salary', 'gather_luck', 'keep_red', 'reroll_one', 'paint_red'],
  hr: ['fortune', 'guardian', 'gather_luck', 'reroll_one', 'cleanse', 'protect'],
  tech: ['longevity', 'kitchen', 'bitter_sweet', 'keep_red', 'reroll_one', 'protect'],
  finance: ['salary', 'longevity', 'kitchen', 'bitter_sweet', 'protect', 'reroll_one'],
  sales: ['thief_god', 'steal', 'secure_loot', 'double_steal', 'protect', 'keep_red'],
  project: ['geomancer', 'forecast_three', 'swap_seat', 'priority', 'reroll_one', 'lucky_seat', 'four_twos'],
  qa: ['fortune', 'keep_red', 'reroll_two', 'reroll_one', 'gather_luck', 'copy_face'],
  admin: ['longevity', 'kitchen', 'cleanse', 'protect', 'bitter_sweet', 'reroll_two'],
  risk: ['guardian', 'thief_god', 'steal', 'disarm', 'unlucky_note', 'seal', 'protect'],
  procurement: ['land', 'fortune', 'gather_luck', 'reroll_one', 'keep_red', 'protect'],
  steady: ['reroll_one', 'protect', 'lucky_note', 'reroll', 'steal'],
  defend: ['protect', 'longevity', 'guardian', 'reroll_one', 'bitter_sweet'],
  steal: ['steal', 'thief_god', 'secure_loot', 'protect', 'reroll_one'],
  precision: ['reroll_one', 'keep_red', 'copy_face', 'fortune', 'paint_red'],
  gamble: ['reroll', 'lucky_note', 'reroll_one', 'steal', 'protect'],
  forecast: ['geomancer', 'forecast_three', 'priority', 'reroll_one', 'lucky_seat'],
};

/** 章节采购从实际货架挑牌并试算余额；财务前期保留本金，后期投入构筑。 */
export function rivalShoppingList(player, game) {
  const stock = game.shopStock?.[player.id];
  if (!stock) return [];
  const preferences = PREFERENCES[player.career || player.strategy] || [];
  const priority = card => {
    const index = preferences.indexOf(card.id);
    return index < 0 ? 100 : index;
  };
  const candidates = Object.values(stock).flat().map(getItem).filter(Boolean)
    .filter(card => player.careerTier !== 'group' || GROUP_CARDS.includes(card.id))
    .sort((a, b) => priority(a) - priority(b) || a.price - b.price);
  const choices = [];
  const trial = { ...player, careerState: player.careerState ? { ...player.careerState } : null };
  const ownedGods = blessingsOf(player);
  let godCount = ownedGods.length;
  for (const card of candidates) {
    if (card.category === 'god' && (godCount >= 3 || ownedGods.some(buff => buff.id === card.id))) continue;
    if (card.category !== 'god' && player.items[card.id] >= 2) continue;
    // 场地必须配合当前职业，避免将构筑资金花在随机改变骰数上。
    if (card.category === 'field' && !preferences.includes(card.id)) continue;
    const ordinaryPrice = card.category === 'skill' && hasBuff(game, player, 'land') ? Math.ceil(card.price * .8) : card.price;
    const price = careerPrice(game, trial, card, ordinaryPrice);
    const saving = player.career === 'finance' && game.round < 4;
    const keyGod = card.category === 'god' && ['salary', 'longevity', 'kitchen'].includes(card.id);
    if (trial.coins < price || saving && !keyGod && trial.coins - price < 40) continue;
    trial.coins -= price;
    if (card.category === 'god') { godCount += 1; choices.push({ item: card.id }); }
    else choices.push(card.id);
    if (player.career === 'procurement' && card.category === 'skill') trial.careerState.rebateRound = game.round;
  }
  return choices;
}
