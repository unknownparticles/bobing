import React, { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Crown, Gem, RotateCcw } from 'lucide-react';
import { AWARDS, MAX_ROUNDS } from '../game/config.js';
import { scoreOf, rankOf } from '../game/state.js';
import { Avatar } from './PaperPrimitives.jsx';

/** 八轮最终排名与重开入口；名次和奖项全部从持有资源派生，同分并列。 */
export default function PaperSummary({ game, onRestart, onHome }) {
  const heading = useRef(null);
  const standings = game.players.map(player => ({ player, score: scoreOf(player) })).sort((a, b) => b.score - a.score || rankOf(b.player) - rankOf(a.player));
  // 同分使用首次出现的位置：100、100、20 对应第 1、1、3 名。
  const ranked = standings.map(entry => ({ ...entry, rank: standings.findIndex(other => other.score === entry.score && rankOf(other.player) === rankOf(entry.player)) + 1 }));
  const you = ranked.find(entry => entry.player.id === 'you');
  const winners = ranked.filter(entry => entry.rank === 1);
  const highest = AWARDS.find(award => you.player.awards.includes(award.id));
  const tied = winners.length > 1;
  const won = you.rank === 1;
  let title = '下一局，把状元赢回来';
  let message = `距第一名还差 ${standings[0].score - you.score} 分。换个出招时机，再争一回。`;
  if (standings[0].score === 0) {
    title = '今晚，平分秋色';
    message = '这一桌还没分出高下，再开一局，博个好彩头。';
  } else if (won) {
    title = tied ? '今晚，并列状元' : '今晚，你是状元';
    message = tied ? '这一晚，与你一起分享头名。下局试试独占鳌头。' : '这一桌的好运与好招，都有了回响。';
  }

  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);

  return <section className="paper-summary" aria-labelledby="summary-title">
    <div className="paper-summary-intro">
      <span className="paper-eyebrow">{MAX_ROUNDS} 轮已毕 · 今晚好彩头</span>
      <span className="paper-summary-seal"><Crown size={32} aria-hidden="true" /></span>
      <h1 id="summary-title" ref={heading} tabIndex={-1}>{title}</h1>
      <p>{message}</p>
      <div className="paper-summary-stats">
        <div><span>你的最终积分</span><strong>{you.score}<small> 分</small></strong></div>
        <div><span>最终名次</span><strong>{ranked.filter(entry => entry.score === you.score && rankOf(entry.player) === rankOf(you.player)).length > 1 ? '并列 ' : ''}{you.rank}<small> 名</small></strong></div>
        <div><span>你持有的最高奖项</span><strong className="paper-summary-best">{highest?.name || '暂无奖项'}</strong></div>
      </div>
    </div>
    <div className="paper-summary-board">
      <div className="paper-summary-board-heading"><h2><Gem size={17} /> 今晚成绩单</h2><span>积分优先 · 同分比较状元等级</span></div>
      <ol className="paper-summary-ranking" aria-label="最终排名">
        {ranked.map(({ player, score, rank }) => <li key={player.id} value={rank} aria-label={`${player.name}，第${rank}名，${score}分`} className={`${player.id === 'you' ? 'is-you' : ''} ${rank === 1 ? 'is-winner' : ''}`}>
          <span className="paper-summary-rank">{rank === 1 ? <Crown size={20} aria-hidden="true" /> : String(rank).padStart(2, '0')}</span>
          <Avatar portrait={player.portrait} name={player.name} />
          <div className="paper-summary-player"><b>{player.name}{player.id === 'you' && <small>你</small>}</b><span>{AWARDS.filter(award => player.awards.includes(award.id)).map(award => `${award.name} ×${player.awards.filter(id => id === award.id).length}`).join(' · ') || '这一晚，积攒了些手气'}</span></div>
          <strong>{score}<small> 分</small></strong>
        </li>)}
      </ol>
    </div>
    <div className="paper-summary-actions">
      <button className="paper-primary" onClick={onRestart}><RotateCcw size={18} />再来一局<ArrowRight size={18} /></button>
      <button className="paper-text-button" onClick={onHome}><ArrowLeft size={15} />返回首页</button>
      <p>保留你的昵称与形象，重新开一桌，每人再领一张重掷券。</p>
    </div>
  </section>;
}
