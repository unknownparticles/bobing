import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Avatar, Brand, DiceBowl } from '/src/ui/PaperPrimitives';
import CardInventory from '/src/ui/CardInventory';
import EffectLayer from '/src/ui/EffectLayer';
import { createGame, gameReducer } from '/src/game/state';
import { createMatch, createPlayers } from '/src/game/modes';
import { resolveAction } from '/src/game/rolls';
import { VISUAL_DURATION_MS } from '/src/game/visuals';
import '/src/paper-theme.css';
import '/src/styles/artisan-ui.css';
import '/src/styles/interaction-polish.css';
import './ui-effects-showcase.css';

const profile = { name: '林小满', portrait: 'hero-a', gender: 'male', role: '新人' };

/** 预览保留真实手牌组件与 reducer，仅提供明确标注的演示初始资源。 */
function createPreviewGame() {
  const game = createGame(createPlayers(profile, 6), createMatch('story'));
  Object.assign(game.players[0].items, { steal: 2, protect: 2, reroll: 2, paint_red: 2, reflect: 2, substitute: 2, swap_seat: 2, cleanse: 2, toilet: 2 });
  game.players[1].awards.push('yixiu');
  game.pool.yixiu -= 1;
  return game;
}

function Showcase() {
  const [game, setGame] = useState(createPreviewGame);
  const [demoEvent, setDemoEvent] = useState(null);
  const [reduced, setReduced] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const sequence = useRef(0);
  const realEvent = game.visuals[0];
  const event = realEvent || demoEvent;
  const [you, first, second] = game.players;
  const examples = [
    { id: 'dice', label: '改骰 · 青瓷环', kind: 'skill', icon: 'reroll_one', sourceId: you.id, targetId: you.id, title: '单骰重投 · 其余骰子保持' },
    { id: 'transfer', label: '抢夺 · 奖章飞移', kind: 'transfer', icon: 'steal', sourceId: first.id, targetId: you.id, title: `顺手牵羊 · ${first.name}的奖项转给${you.name}` },
    { id: 'attack', label: '出招 · 尚未命中', kind: 'attack', icon: 'toilet', sourceId: you.id, targetId: first.id, outcome: 'pending', title: '厕所卡 · 正在出招' },
    { id: 'guard', label: '抵挡 · 青瓷护盾', kind: 'shield', icon: 'protect', sourceId: first.id, targetId: first.id, outcome: 'blocked', title: '保护罩 · 抵挡本次抢夺' },
    { id: 'redirect', label: '反弹 · 轨迹折返', kind: 'reflect', icon: 'reflect', sourceId: first.id, targetId: you.id, outcome: 'redirected', title: '反弹符 · 原施法者承受' },
    { id: 'substitute', label: '替身 · 改向目标', kind: 'substitute', icon: 'substitute', sourceId: first.id, targetId: second.id, outcome: 'redirected', title: '替身纸人 · 目标已转移' },
    { id: 'blessing', label: '祝福 · 金色印记', kind: 'shield', icon: 'fortune', sourceId: you.id, targetId: you.id, title: '福神赐运 · 神明祝福' },
    { id: 'bond', label: '牵缘 · 红线相连', kind: 'bond', icon: 'matchmaker', sourceId: you.id, targetId: second.id, title: '月老牵线 · 双方缔结姻缘' },
    { id: 'field', label: '场地 · 波纹展开', kind: 'field', icon: 'eight_dice', sourceId: you.id, targetId: first.id, title: '八仙过海 · 场地生效' },
    { id: 'champion', label: '状元 · 好彩转移', kind: 'champion', icon: 'champion', sourceId: first.id, targetId: you.id, delta: 1000, title: '状元归你 · 好彩头易主' },
  ];

  useEffect(() => {
    // 只读快照供浏览器核对真实手牌消耗与事件生命周期，不暴露改状态入口。
    window.render_game_to_text = () => JSON.stringify({
      mode: 'effects-preview', stage: game.stage, reduced,
      event: event ? { id: event.id, kind: event.kind, icon: event.icon, outcome: event.outcome } : null,
      players: game.players.map(player => ({ id: player.id, name: player.name, items: player.items, protected: player.protected, awards: player.awards })),
    });
    return () => { delete window.render_game_to_text; };
  }, [game, event, reduced]);

  useEffect(() => {
    if (!demoEvent) return undefined;
    const timer = setTimeout(() => setDemoEvent(null), VISUAL_DURATION_MS);
    return () => clearTimeout(timer);
  }, [demoEvent?.id]);
  useEffect(() => {
    if (!realEvent) return undefined;
    const timer = setTimeout(() => setGame(current => gameReducer(current, { type: 'ACK_VISUAL', id: realEvent.id })), VISUAL_DURATION_MS);
    return () => clearTimeout(timer);
  }, [realEvent?.id]);

  function dispatch(action) {
    setGame(current => gameReducer(current, resolveAction(current, action)));
  }

  function play(example) {
    sequence.current += 1;
    setDemoEvent({ ...example, exampleId: example.id, id: sequence.current, outcome: example.outcome || 'applied' });
  }

  return <main className="paper-page paper-game effects-showcase">
    <header className="paper-header"><Brand subtitle="界面与技能表现 · 轻快版" /><a href="/">返回游戏</a></header>
    <section className="showcase-controls">
      <div><span className="paper-eyebrow">一牌一式 · 好招登场</span><h1>点一下，看看这招。</h1><p>每次约 1.1 秒；可重复点击。预览初始手牌用于体验，正式游戏遵循真实库存。</p></div>
      <label className="showcase-motion"><input type="checkbox" checked={reduced} onChange={e => setReduced(e.target.checked)} />减少动画 · 保留静态结果</label>
      <div className="showcase-examples">{examples.map(example => <button key={example.id} type="button" className="paper-skill" data-example={example.id} aria-pressed={event?.exampleId === example.id} onClick={() => play(example)}>{example.label}</button>)}</div>
    </section>
    <div className="paper-game-layout showcase-layout">
      <section className="paper-play-area showcase-table" aria-label="技能表现预览桌面">
        <div className="paper-rivals">{game.players.slice(1).map(player => <article className="paper-rival" key={player.id}>
          <div className="paper-rival-avatar" data-effect-player={player.id}><Avatar portrait={player.portrait} name={player.name} /></div><b>{player.name}</b><span className="paper-rival-title">对手座位</span>
        </article>)}</div>
        <DiceBowl dice={game.dice} />
        <div className="showcase-self" data-effect-player={you.id}><Avatar portrait={you.portrait} name={you.name} /><div><b>{you.name}</b><small>你的座位</small></div></div>
      </section>
      <aside className="showcase-resources"><h2>同一套好彩头</h2><div className="showcase-icons">{[16, 32, 64].map(size => <span key={size}><img src="/icons/bobing-mark.svg" width={size} height={size} alt={`${size}像素骰碗标识`} /><small>{size}px</small></span>)}</div><p>图标、插画、纸面与按钮延续同一组配色。</p><button type="button" className="paper-primary" onClick={() => setInventoryOpen(true)}>打开手牌 · 体验真实出招</button><button type="button" className="paper-primary" disabled>等待中的主操作</button><a href="/docs/ui-preview/shop-art-gallery.html">查看整库插画</a><p className="showcase-event" role="status">{game.event}</p></aside>
    </div>
    {inventoryOpen && <CardInventory game={game} dispatch={dispatch} onClose={() => setInventoryOpen(false)} />}
    <EffectLayer key={event ? `${realEvent ? 'real' : 'demo'}-${event.id}` : 'idle'} event={event} players={game.players} reducedMotion={reduced} />
  </main>;
}

createRoot(document.getElementById('root')).render(<Showcase />);
