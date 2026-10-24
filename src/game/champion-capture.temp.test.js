import { describe, it, expect } from 'vitest';
import { createGame, gameReducer, scoreOf } from './state';
import { COUNTERCLOCKWISE_SEATS } from './config';
import { evaluateDice, rollRank } from './rules';

const lowDice = [2, 2, 2, 2, 2, 3];
const highDice = [4, 4, 4, 4, 2, 3];
function prepared(dice = highDice) {
  const game = createGame(COUNTERCLOCKWISE_SEATS.map((seat, index) => ({ id: index ? `bot-${index}` : 'you', name: `玩家${index}`, seat, portrait: index === 1 ? 'hero-b' : 'hero-a' })));
  game.stage = 'review'; game.dice = dice; game.preview = evaluateDice(dice); game.pool.zhuangyuan = 0;
  for (const index of [1, 2]) { game.players[index].awards = ['zhuangyuan']; game.players[index].awardRanks = [rollRank(evaluateDice(index === 1 ? lowDice : Array(6).fill(4)))]; }
  return game;
}
function confirm(game, value = 0) { return gameReducer(game, { type: 'CONFIRM', entropy: [value] }); }

describe('抢状元判奖', () => {
  it('奖池空时转移最低状元并升级，奖池与总份数不变', () => {
    const game = prepared(); const next = confirm(game);
    expect(next.players[0].awards).toEqual(['zhuangyuan']); expect(next.players[1].awards).toEqual([]);
    expect(next.players[0].awardRanks).toEqual([rollRank(game.preview)]);
    expect(next.pool.zhuangyuan).toBe(0); expect(next.players.reduce((sum, player) => sum + player.awards.filter(id => id === 'zhuangyuan').length, 0)).toBe(2);
    expect(next.visuals.some(event => event.kind === 'champion' && event.sourceId === 'bot-1' && event.targetId === 'you')).toBe(true);
  });
  it('同级和更低不能抢，不能拿自己持有的状元', () => {
    const tied = prepared(lowDice); expect(confirm(tied).players[0].awards).toEqual([]);
    const own = prepared(); own.players[0].awards = own.players[1].awards; own.players[0].awardRanks = own.players[1].awardRanks; own.players[1].awards = []; own.players[1].awardRanks = [];
    expect(confirm(own).players[0].awards).toHaveLength(1);
  });
  it.each([[0, 1], [.9999, 2]])('最低档并列随机值%s选中%d', (value, target) => {
    const game = prepared(); game.players[2].awardRanks = [...game.players[1].awardRanks];
    const next = confirm(game, value); expect(next.players[target].awards).toEqual([]);
  });
  it('绕过保护、反弹、替身和B护奖且不消耗防护次数', () => {
    const game = prepared(); game.players[1].protected = true; game.players[1].reflect = true; game.players[1].substituteId = 'bot-2';
    const next = confirm(game); expect(next.players[0].awards).toEqual(['zhuangyuan']);
    expect(next.players[1].protected).toBe(true); expect(next.players[1].reflect).toBe(true); expect(next.players[1].heroGuardRound).toBe(null);
  });
  it('姻缘共享得失但财神不重复增加奖金', () => {
    const game = prepared();
    for (const [first, second] of [[0, 3], [1, 4]]) {
      game.players[first].partnerId = game.players[second].id; game.players[second].partnerId = game.players[first].id;
      for (const index of [first, second]) game.players[index].buffs = [{ id: 'matchmaker', sourceId: game.players[first].id, fromRound: 1, untilRound: 3 }];
    }
    game.players[0].buffs.push({ id: 'wealth', sourceId: 'you', targetId: 'you', fromRound: 1, untilRound: 3 });
    const next = confirm(game);
    expect(scoreOf(next.players[0])).toBe(500); expect(scoreOf(next.players[3])).toBe(500);
    expect(scoreOf(next.players[1])).toBe(500); expect(scoreOf(next.players[4])).toBe(-500);
    expect(next.visuals.filter(event => event.kind === 'bond')).toHaveLength(2);
  });
  it('尚有库存优先领取，不抢夺；重复确认不重复转移', () => {
    const game = prepared(); game.pool.zhuangyuan = 1;
    const next = confirm(game); expect(next.players[1].awards).toHaveLength(1); expect(next.pool.zhuangyuan).toBe(0);
    expect(gameReducer(next, { type: 'CONFIRM' })).toBe(next);
  });
  it('抢状元失败仍触发灶君未中奖补给', () => {
    const game = prepared(lowDice);
    game.players[0].buffs = [{ id: 'kitchen', sourceId: 'you', targetId: 'you', fromRound: 1, untilRound: 3 }];
    expect(confirm(game).players[0].coins).toBe(5);
  });
});
