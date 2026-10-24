import { describe, it, expect, vi, afterEach } from 'vitest';
import { createGame, gameReducer } from './state';
import { COUNTERCLOCKWISE_SEATS } from './config';
import { initializeShop } from './stock';
import { SKILLS } from './catalog';
import { evaluateDice } from './rules';

function ready() {
  const game = createGame(COUNTERCLOCKWISE_SEATS.map((seat, index) => ({ id: index ? `bot-${index}` : 'you', name: `玩家${index}`, seat, gender: index === 1 ? 'female' : 'male' })));
  for (const player of game.players) {
    player.coins = 100; player.awards = ['yixiu', 'erju']; player.awardRanks = [0, 0];
    for (const card of SKILLS) player.items[card.id] = 1;
    player.lastDice = [1, 2, 3, 4, 5, 6];
  }
  game.players[0].unlucky = true;
  game.players[1].buffs = [{ id: 'fortune', sourceId: 'bot-1', targetId: 'bot-1', fromRound: 1, untilRound: 4 }];
  return game;
}
describe('所有技能提供真实作用事件', () => {
  it.each(SKILLS.map(card => [card.id, card]))('%s显示来源目标', (id, card) => {
    const game = ready();
    if (card.timing === 'after') { game.stage = 'review'; game.dice = [2, 3, 4, 5, 1, 6]; game.preview = evaluateDice(game.dice); }
    const next = gameReducer(game, { type: 'USE_ITEM', item: id, targetId: 'bot-1', targetIds: ['bot-1', 'bot-2'], diceIndices: ['reroll_two', 'copy_face'].includes(id) ? [0, 1] : [0], awardIndex: 0, buffId: 'fortune', cardId: 'reroll', entropy: Array(120).fill(.4) });
    expect(next).not.toBe(game); expect(next.visuals.length).toBeGreaterThan(0);
    expect(next.visuals.every(event => event.sourceId && event.targetId && event.title)).toBe(true);
    expect(new Set(next.visuals.map(event => event.id)).size).toBe(next.visuals.length);
  });
  it('反弹链按出招、反弹、最终作用顺序，不误报原目标被封印', () => {
    const game = ready(); game.players[1].reflect = true;
    const next = gameReducer(game, { type: 'USE_ITEM', item: 'seal', targetId: 'bot-1' });
    expect(next.visuals.map(event => [event.kind, event.sourceId, event.targetId])).toEqual([
      ['attack', 'you', 'bot-1'], ['reflect', 'bot-1', 'you'], ['skill', 'you', 'you'],
    ]);
    expect(next.players[0].sealPending).toBe(true); expect(next.players[1].sealPending).toBe(false);
  });
  it('替身最终被关帝挡住，最后事件是抵挡而非成功', () => {
    const game = ready(); game.players[1].substituteId = 'bot-2';
    game.players[2].buffs = [{ id: 'guardian', sourceId: 'bot-2', fromRound: 1, untilRound: 3 }];
    const next = gameReducer(game, { type: 'USE_ITEM', item: 'seal', targetId: 'bot-1' });
    expect(next.visuals.map(event => event.kind)).toEqual(['attack', 'substitute', 'shield']);
    expect(next.visuals.at(-1).outcome).toBe('blocked'); expect(next.players[2].sealPending).toBe(false);
  });
  it('ACK只移除队首，旧回调和重开不删除新事件', () => {
    const game = ready(); const next = gameReducer(game, { type: 'USE_ITEM', item: 'protect' });
    expect(gameReducer(next, { type: 'ACK_VISUAL', id: -1 })).toBe(next);
    const ack = gameReducer(next, { type: 'ACK_VISUAL', id: next.visuals[0].id }); expect(ack.visuals).toEqual([]);
    expect(gameReducer(ack, { type: 'ACK_VISUAL', id: next.visuals[0].id })).toBe(ack);
    next.stage = 'finished'; expect(gameReducer(next, { type: 'RESTART' }).visuals).toEqual([]);
  });
  it('自用牌忽略机器人多传的targetId，保护罩仍指向自己', () => {
    const game = ready();
    const next = gameReducer(game, { type: 'USE_ITEM', item: 'protect', targetId: 'bot-1' });
    expect(next.visuals[0]).toMatchObject({ kind: 'shield', sourceId: 'you', targetId: 'you' });
    expect(next.players[0].protected).toBe(true); expect(next.players[1].protected).toBe(false);
  });
  it('失败技能不排队、不扣牌；神明供奉按真实目标记录', () => {
    const game = ready(); expect(gameReducer(game, { type: 'USE_ITEM', item: 'steal', targetId: 'missing' })).toBe(game);
    game.stage = 'shop'; initializeShop(game, () => .1); game.shopStock.you.god = ['matchmaker', 'thunder'];
    const next = gameReducer(game, { type: 'BUY', userId: 'you', item: 'matchmaker', targetId: 'bot-1' });
    expect(next.visuals[0]).toMatchObject({ kind: 'bond', sourceId: 'you', targetId: 'bot-1' });
  });
});
