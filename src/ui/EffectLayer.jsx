import { useId, useLayoutEffect, useEffect, useRef, useState } from 'react';
import { Crown, Gift, Swords, Shield, Undo2, UserRound, HeartHandshake, Coins, Orbit, Sparkles, ArrowRight, Ban } from 'lucide-react';
import { Avatar } from './PaperPrimitives';
import CardIcon from './CardIcon';
import '../effect-layer.css';

const effectIcons = { champion: Crown, transfer: Gift, attack: Swords, shield: Shield, reflect: Undo2, substitute: UserRound, bond: HeartHandshake, score: Coins, field: Orbit, skill: Sparkles };
const endpointRoles = {
  champion: ['原持有人', '新状元'], transfer: ['原持有人', '获得者'], attack: ['出招', '目标'],
  shield: ['守护', '受保护'], reflect: ['反弹者', '原施法者'], substitute: ['原目标', '替身'],
  bond: ['牵缘', '结缘'], score: ['来源', '获得'], field: ['发动', '作用'], skill: ['发动', '目标'],
};
const outcomeLabels = { applied: '已生效', blocked: '已抵挡', redirected: '已转移' };

/** 优先使用真实头像；离屏玩家使用有姓名的浮动端点，保证方向始终可辨。 */
function measureEndpoint(playerId, side, width, height) {
  const anchor = [...document.querySelectorAll('[data-effect-player]')].find(element => element.dataset.effectPlayer === String(playerId));
  const element = anchor?.querySelector('.paper-avatar') || anchor;
  const rect = element?.getBoundingClientRect();
  const style = element && window.getComputedStyle(element);
  const visible = rect && rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < width && rect.bottom > 0 && rect.top < height && style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
  if (visible) return {
    x: Math.max(30, Math.min(width - 30, rect.left + rect.width / 2)),
    y: Math.max(30, Math.min(height - 46, rect.top + rect.height / 2)),
    size: Math.max(58, Math.min(100, Math.max(rect.width, rect.height) + 14)),
    floating: false,
  };
  return { x: width * (side === 'source' ? 0.23 : 0.77), y: height * 0.47, size: 70, floating: true };
}

function useReducedMotion(override) {
  const [preferred, setPreferred] = useState(() => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return undefined;
    const update = () => setPreferred(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return override ?? preferred;
}

function EffectSymbol({ event, size = 27 }) {
  const Icon = effectIcons[event.kind] || Sparkles;
  return event.icon ? <CardIcon id={event.icon} size={size} /> : <Icon size={size} strokeWidth={1.7} />;
}

function Endpoint({ point, player, role, side, self }) {
  return <div className={`effect-endpoint effect-endpoint-${side} ${point.floating ? 'is-floating' : ''} ${self ? 'is-self' : ''}`} style={{ left: point.x, top: point.y, '--endpoint-size': `${point.size}px` }}>
    <span className="effect-player-ring" />
    {point.floating && <Avatar portrait={player?.portrait} name={player?.name || '牌桌'} />}
    <span className="effect-player-label"><small>{role}</small><b>{player?.name || '牌桌'}</b></span>
  </div>;
}

/** 显示一条已经结算的互动；父层以 event.id 为 key，并在 1100ms 后确认事件。 */
export default function EffectLayer({ event, players = [], reducedMotion }) {
  const markerId = `effect-arrow-${useId().replace(/:/g, '')}`;
  const layerRef = useRef(null);
  const reduce = useReducedMotion(reducedMotion);
  const [layout, setLayout] = useState(null);
  const sourceId = event?.sourceId;
  const targetId = event?.targetId ?? sourceId;
  const self = sourceId === targetId;

  useLayoutEffect(() => {
    if (!event) return undefined;
    let frame;
    const measure = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const source = measureEndpoint(sourceId, 'source', width, height);
      const target = self ? source : measureEndpoint(targetId, 'target', width, height);
      const board = document.querySelector('.paper-play-area')?.getBoundingClientRect();
      setLayout({ width, height, source, target, board });
    };
    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('resize', scheduleMeasure);
    // 捕获容器滚动，让固定定位的轨迹继续跟随桌边头像。
    window.addEventListener('scroll', scheduleMeasure, true);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(scheduleMeasure) : null;
    document.querySelectorAll('[data-effect-player]').forEach(element => observer?.observe(element));
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('scroll', scheduleMeasure, true);
    };
  }, [event?.id, sourceId, targetId, self]);

  useLayoutEffect(() => {
    const layer = layerRef.current;
    if (!event || !layer?.showPopover) return undefined;
    // 原生 dialog 位于浏览器顶层；手动 popover 能让出牌动效显示在它上方，且不抢焦点。
    layer.showPopover();
    return () => {
      if (layer.matches(':popover-open')) layer.hidePopover();
    };
  }, [event?.id, Boolean(layout)]);

  if (!event || !layout) return null;
  const sourcePlayer = players.find(player => player.id === sourceId);
  const targetPlayer = players.find(player => player.id === targetId);
  const sourceName = sourcePlayer?.name || '牌桌';
  const targetName = targetPlayer?.name || '牌桌';
  const roles = endpointRoles[event.kind] || endpointRoles.skill;
  const { source, target, width, height, board } = layout;
  // 弯曲回线与普通出招的上拱路径不同，反弹时更容易辨认来回关系。
  const bend = event.kind === 'reflect' ? 100 : -Math.min(120, Math.max(58, Math.abs(target.x - source.x) * 0.23));
  const controlX = (source.x + target.x) / 2 + (event.kind === 'reflect' ? 35 : 0);
  const controlY = Math.max(76, Math.min(height - 82, (source.y + target.y) / 2 + bend));
  const path = `M ${source.x} ${source.y} Q ${controlX} ${controlY} ${target.x} ${target.y}`;
  const midpoint = { x: source.x * 0.25 + controlX * 0.5 + target.x * 0.25, y: source.y * 0.25 + controlY * 0.5 + target.y * 0.25 };
  const staticSymbol = self ? { left: source.x, top: Math.max(40, source.y - source.size / 2 - 28) } : { left: midpoint.x, top: midpoint.y };
  const status = outcomeLabels[event.outcome] || outcomeLabels.applied;
  const description = `${sourceName}${self ? '对自己' : `对${targetName}`}：${event.title}，${status}`;

  return <div ref={layerRef} popover="manual" className={`effect-layer effect-kind-${event.kind} effect-outcome-${event.outcome} ${reduce ? 'is-reduced' : ''} ${self ? 'is-self-effect' : ''}`}>
    <p className="effect-screen-reader" role="status" aria-live="polite">{description}</p>
    <div className="effect-banner" style={board ? { top: Math.max(25, Math.min(height - 125, board.top + board.height * .48)), left: Math.max(130, Math.min(width - 130, board.left + board.width / 2)) } : undefined} aria-hidden="true">
      <span className="effect-banner-icon"><EffectSymbol event={event} size={22} /></span>
      <div><span className="effect-banner-players"><b>{sourceName}</b><ArrowRight size={14} /><b>{self ? '自己' : targetName}</b></span><strong>{event.title}</strong></div>
      <small className="effect-outcome">{event.outcome === 'blocked' && <Ban size={12} />}{status}</small>
    </div>
    <div aria-hidden="true">
      {!self && <svg className="effect-trajectory" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs><marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="currentColor" strokeWidth="1.8" /></marker></defs>
        <path className="effect-path-shadow" d={path} />
        <path className="effect-path" d={path} markerEnd={`url(#${markerId})`} />
      </svg>}
      <Endpoint point={source} player={sourcePlayer} role={self ? '作用于自己' : roles[0]} side="source" self={self} />
      {!self && <Endpoint point={target} player={targetPlayer} role={roles[1]} side="target" />}
      <div className={`effect-traveler ${self || reduce ? 'is-still' : ''}`} style={self || reduce ? staticSymbol : { offsetPath: `path("${path}")` }}>
        <span className="effect-token"><EffectSymbol event={event} /></span>
        {event.delta != null && <b className="effect-delta">{event.delta > 0 ? '+' : ''}{event.delta}</b>}
      </div>
      <span className="effect-impact" style={{ left: target.x, top: target.y }} />
    </div>
  </div>;
}
