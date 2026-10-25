import React from 'react';
import { Eye, MapPin } from 'lucide-react';
import { candidateCount, effectiveLuck } from '../game/archetypes';
import { getItem } from '../game/catalog';
import { seatsForCount } from '../game/modes';
import '../styles/archetypes.css';

/** 桌面只展示规则层的真实构筑与公开承诺；座位编号不受行动队列变化影响。 */
export default function BuildStatus({ game }) {
  const player = game.players.find(item => item.id === 'you');
  if (!player) return null;
  const luck = effectiveLuck(game, player);
  const seats = seatsForCount(game.players.length);
  const seatNumber = seat => seats.indexOf(seat) + 1;
  const forecasts = game.forecasts || [];
  const field = game.field;
  const luckyField = field && getItem(field.id)?.target === 'seat';
  const beneficiary = luckyField && game.players.find(item => item.seat === field.seat);
  const nameOf = id => game.players.find(item => item.id === id)?.name || '未记录';
  const minimum = player.nextMinimum === 'zhuangyuan' ? '四点红' : player.nextMinimum === 'sanhong' ? '三红' : '';
  return <section className="build-status" aria-label="本桌构筑与公开预告">
    <div className="build-status-main">
      <b>当前状态</b>
      <span>运气 {luck} · {candidateCount(game, player)} 组候选</span>
      {player.missStreak > 0 && <span>连续未获奖 {player.missStreak} 次</span>}
      {player.stolenCount > 0 && <span>已夺奖 {player.stolenCount} 份</span>}
      <span><MapPin size={13} aria-hidden="true" />当前 {seatNumber(player.seat)}号座位</span>
      {minimum && <span className="build-promise">下一次正式投掷保底{minimum}</span>}
    </div>
    {luckyField && <p className="build-seat-promise"><MapPin size={14} aria-hidden="true" /><b>{getItem(field.id).name}</b>：{seatNumber(field.seat)}号座位 · 当前受益：{beneficiary?.name || '暂无玩家'}<span> · {field.id === 'lucky_seat' ? '至少两个四点' : '至少四个二点'}</span></p>}
    {forecasts.length > 0 && <div className="build-forecasts"><b><Eye size={14} aria-hidden="true" />全场公开预告 · 已投 {game.throwCount || 0} 次</b><ul>{forecasts.map(forecast => <li key={forecast.id}><span>{getItem(forecast.itemId)?.name || '状元预告'} · 还剩 {forecast.remaining} 次实际投掷</span><small>施法者：{nameOf(forecast.sourceId)}</small></li>)}</ul><p>单骰重投也计数；触发时整碗保底四点红，发奖仍受库存约束。</p></div>}
    <details className="build-rules"><summary>投掷与当前效果</summary><p>运气上限5，整碗投掷择优；单骰、双骰重投保留其余骰子，不生成整碗候选。</p><p>蓄势只统计正式行动最终未领到奖项，获奖或夺奖清零，跳过行动不计。吉位按实际座位受益，换位立即生效。</p><p>全场真实投掷均推进预告，单骰、双骰重投也算一次；改点、复制、动画和内部候选组不计。保底保留更高自然奖型，保证骰型不额外生成奖品。</p></details>
  </section>;
}
