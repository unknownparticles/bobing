/** 同桌闲聊只负责表达，不参与掷骰、发奖或道具规则。 */
const lines = {
  wait: ['快点吧，等到花儿都谢了！', '骰子都等困了，就差你这一碗啦！', '别光看呀，好运可不等人！'],
  win: ['这手气，谁看了不说一句漂亮！', '承让承让，这份彩头我先收下啦！', '别急，我的好运才刚开始！'],
  champion: ['状元到手！今晚这桌我可有话说了！', '都看见了吧？这碗才叫好彩头！'],
  envy: ['可以啊！不过下一碗可就轮到我了！', '这手气借我用一碗，行不行？', '先让你乐一会儿，我还没发力呢！'],
  championEnvy: ['状元都让你拿了？给我们留点盼头呀！', '好家伙，这下我可得认真了！'],
  hurt: ['这也能冲我来？我可记住了！', '好好好，下一碗咱们走着瞧！', '你这招挺会挑时候啊！'],
  attack: ['嘿嘿，桌上过招，可别怪我手快！', '先送你一招，热闹热闹！'],
  guarded: ['想整我？这回可没那么容易！', '嘿，留了一手，没想到吧！'],
  career: ['这手看家本领，刚好派上用场。'],
};

const characterLines = {
  chen: { wait: ['这碗还没摇，大家都快等到下班了！'], win: ['看来今晚的好运，也归我管！'] },
  mei: { wait: ['快摇吧，我连替你加油的词都想好了！'], hurt: ['哎呀，刚攒的好运就被你惦记上了！'] },
  wu: { wait: ['你再不摇，我可要连碗一起牵走了！'], attack: ['手快有，手慢无，承让啦！'] },
  lin: { wait: ['算了这么久，这碗该有谱了吧？'], guarded: ['这一步，我可提前算到了。'] },
  jie: { wait: ['别犹豫啦！摇起来才有翻盘的机会！'], win: ['看见没？敢搏一碗就有机会！'] },
  tang: { wait: ['挑好招也得挑好价格，咱慢慢看。'], career: ['内部渠道，省下的都是下一碗的本钱。'] },
  lu: { wait: ['先把账算清，这碗才摇得安心。'], career: ['预算有方，留点本金也能生出好彩头。'] },
  qiao: { wait: ['这桌的进度，可就等你这一碗了。'], career: ['统筹一下，换个位置把节奏接起来。'] },
  xu: { wait: ['别紧张，先摇一碗试试手气嘛！'], guarded: ['已经拿到的好彩头，可得先收稳。'] },
  ye: { wait: ['这碗的构图不错，就差几颗好点数。'], win: ['点睛之笔，正好落在这一碗。'] },
  liang: { wait: ['热度都起来了，好彩头该轮到我啦。'], attack: ['先抓住这个机会，奖品我来接！'] },
  fei: { wait: ['后面几碗的节奏，我已经想好了。'], guarded: ['方案里留了后手，这步刚好用上。'] },
  zhou: { wait: ['大家都看着呢，大胆摇一碗！'], career: ['本钱备足，好招也得花钱买。'] },
  su: { wait: ['同桌都是熟人，热热闹闹开一碗。'], career: ['人脉用在关键处，这回请你照应一下。'] },
  gu: { wait: ['先观察输入，再看这碗的结果。'], career: ['积累有了用处，每颗点数都值得认真看。'] },
  xuguan: { wait: ['机会就在这碗，赶紧接着往前冲。'], career: ['一单得手，再接下一单的机会！'] },
  yan: { wait: ['先别急着确认，我再检查一遍。'], career: ['找到可以改善的那一点，修正到位。'] },
  an: { wait: ['补给都备好了，就等大家接碗。'], career: ['缺什么补什么，后勤得跟上。'] },
  shen: { wait: ['落碗前先想想风险，准备好再来。'], career: ['这次风险已经触发预案，请接回去。'] },
};

// 这里只识别需要吐槽的效果；是否生效、是否反弹仍以真实事务为准。
const teasingItems = new Set(['steal', 'toilet', 'unlucky_note', 'disarm', 'exchange', 'equal_coins', 'exorcism', 'seal', 'swap_seat', 'swap_others', 'thunder', 'unlucky', 'summon_god']);

/** 从新结算事务选择发言主题；跳过出招预告、预览结果和重复动画确认。 */
export function banterCue(previous, game) {
  if (['shop', 'finished'].includes(game.stage)) return null;
  const events = game.visuals.filter(event => event.id > previous.visualSequence);
  const harmful = events.find(event => event.outcome === 'applied' && teasingItems.has(event.icon));
  if (harmful) {
    // 夺奖轨迹从原持有人飞向获得者；其他整蛊轨迹指向实际受害者。
    const victimId = harmful.icon === 'steal' ? harmful.sourceId : harmful.targetId;
    const actorId = harmful.icon === 'steal' ? harmful.targetId : harmful.sourceId;
    if (victimId !== 'you') return { kind: 'hurt', speakerId: victimId };
    if (actorId !== 'you') return { kind: 'attack', speakerId: actorId };
  }
  const defense = events.find(event => ['shield', 'reflect', 'substitute'].includes(event.kind) && ['blocked', 'redirected'].includes(event.outcome) && event.sourceId !== 'you');
  if (defense) return { kind: 'guarded', speakerId: defense.sourceId };
  // 职业台词跟随已提交的规则事件，重渲染和动画确认不会再说一次。
  const career = (game.events || []).slice(previous.events?.length || 0).find(event => event.type === 'career' && event.actorId !== 'you');
  if (career) return { kind: 'career', speakerId: career.actorId };

  if (game.stage !== 'settled' || previous.stage === 'settled' || !['award', 'jackpot'].includes(game.eventType)) return null;
  const active = game.players[game.turnIndex];
  const champion = game.eventType === 'jackpot';
  if (active.id === 'you') return { kind: champion ? 'championEnvy' : 'envy' };
  return { kind: champion ? 'champion' : 'win', speakerId: active.id };
}

/** 选出真实同桌的台词，尽量不重复上一句；随机源与游戏规则独立。 */
export function chooseSpeech(cue, players, previousText = '', rng = Math.random) {
  const rivals = players.filter(player => player.id !== 'you');
  const speaker = cue.speakerId ? rivals.find(player => player.id === cue.speakerId) : rivals[Math.floor(rng() * rivals.length)];
  if (!speaker || !lines[cue.kind]) return null;
  const pool = [...lines[cue.kind], ...(characterLines[speaker.id]?.[cue.kind] || [])].filter(text => text !== previousText);
  return { speakerId: speaker.id, kind: cue.kind, text: pool[Math.floor(rng() * pool.length)] };
}
