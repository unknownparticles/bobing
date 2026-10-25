import React, { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Crown, Gem, RotateCcw } from 'lucide-react';
import { AWARDS } from '../game/config.js';
import { scoreOf, rankOf } from '../game/state.js';
import { Avatar } from './PaperPrimitives.jsx';
import { placeOf, STORY_CHAPTERS } from '../game/modes';
import { ACHIEVEMENTS } from '../game/progression-content';
import { getItem } from '../game/catalog';

/** 模式结算与故事晋级；胜负从真实资源派生，并列第一也可晋级。 */
export default function PaperSummary({ game, rewards, onRestart, onHome, onContinue }) {
  const heading = useRef(null);
  const standings = game.players.map(player => ({ player, score: scoreOf(player) })).sort((a, b) => b.score - a.score || rankOf(b.player) - rankOf(a.player));
  // 与晋级共用名次规则；同积分和状元等级并列，例如第 1、1、3 名。
  const ranked = standings.map(entry => ({ ...entry, rank: placeOf(game, entry.player.id) }));
  const you = ranked.find(entry => entry.player.id === 'you');
  const winners = ranked.filter(entry => entry.rank === 1);
  const highest = AWARDS.find(award => you.player.awards.includes(award.id));
  const tied = winners.length > 1;
  const won = you.rank === 1;
  const chapter = game.match.mode === 'story' ? STORY_CHAPTERS[game.match.chapterIndex] : null;
  const finalChapter = chapter && game.match.chapterIndex === STORY_CHAPTERS.length - 1;
  const canAdvance = Boolean(chapter && won && !finalChapter && onContinue);
  let title = '下一局，把状元赢回来';
  let message = `距第一名还差 ${standings[0].score - you.score} 分。换个出招时机，再争一回。`;
  let restartLabel = '再来一局';
  if (standings[0].score === 0) {
    title = '今晚，平分秋色';
    message = '这一桌还没分出高下，再开一局，博个好彩头。';
  } else if (won) {
    title = tied ? '今晚，并列状元' : '今晚，你是状元';
    message = tied ? '这一晚，与你一起分享头名。下局试试独占鳌头。' : '这一桌的好运与好招，都有了回响。';
  }
  if (chapter) {
    if (won) {
      title = finalChapter ? '今晚，你是公司王中王' : `${chapter.name}，你拿下第一`;
      message = finalChapter ? '三章通关 · 从普通员工到公司王中王' : '本章夺冠 · 下一张桌，等你入席';
      restartLabel = finalChapter ? '再战王中王' : '再战本章';
    } else {
      title = '好彩头未落定，再争一次';
      message = `本章暂列第 ${you.rank} 名，重试本章争取第一。`;
      restartLabel = '重试本章';
    }
  }

  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);

  return <section className="paper-summary" aria-labelledby="summary-title">
    <div className="paper-summary-intro">
      <span className="paper-eyebrow">{game.match.mode === 'classic' ? `奖池已博完 · 共进行 ${game.round} 轮` : `${game.match.maxRounds} 轮已毕 · ${chapter ? chapter.name : '双人好彩头'}`}</span>
      <span className="paper-summary-seal"><Crown size={32} aria-hidden="true" /></span>
      <h1 id="summary-title" ref={heading} tabIndex={-1}>{title}</h1>
      <p>{message}</p>
      {game.match.cycle > 1 && <p>第 {game.match.cycle} 周目 · 本桌数值重新成长</p>}
      <div className="paper-summary-stats">
        <div><span>你的最终积分</span><strong>{you.score}<small> 分</small></strong></div>
        <div><span>最终名次</span><strong>{ranked.filter(entry => entry.score === you.score && rankOf(entry.player) === rankOf(you.player)).length > 1 ? '并列 ' : ''}{you.rank}<small> 名</small></strong></div>
        <div><span>你持有的最高奖项</span><strong className="paper-summary-best">{highest?.name || '暂无奖项'}</strong></div>
      </div>
    </div>
    {rewards && <section className="paper-story-epilogue" aria-label="本桌收集与成就"><span className="paper-eyebrow">本桌新发现 {rewards.discovered.length} 项 · 新成就 {rewards.achievements.length} 项</span>
      {rewards.discovered.length > 0 && <p>{rewards.discovered.map(id => getItem(id)?.name).filter(Boolean).join('、')}</p>}
      {rewards.achievements.map(id => { const achievement = ACHIEVEMENTS.find(item => item.id === id); return achievement && <p key={id}><b>{achievement.name}</b> · {achievement.reward.description}</p>; })}
      {rewards.unlocked.length > 0 && <small>已解锁：{rewards.unlocked.map(id => getItem(id)?.name).filter(Boolean).join('、')}。返回首页查看图鉴或佩戴称号。</small>}
    </section>}
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
    {chapter && <section className={`paper-story-epilogue ${won ? 'is-victory' : ''}`} aria-label="本章故事结局"><span className="paper-eyebrow">{finalChapter && won ? '故事终章 · 好彩头属于你' : won ? '这一章，有了好结果' : '故事未完，下一碗继续'}</span><p>{won ? chapter.victory : chapter.defeat}</p>{canAdvance && <small>下一章：{STORY_CHAPTERS[game.match.chapterIndex + 1].name} · {STORY_CHAPTERS[game.match.chapterIndex + 1].playerCount} 人桌，积分、金币、道具和祝福重新开始。</small>}</section>}
    <div className="paper-summary-actions">
      {canAdvance && <button className="paper-primary" onClick={onContinue}>{game.match.chapterIndex === 0 ? '晋级部门赛' : '晋级公司王中王'}<ArrowRight size={18} /></button>}
      <button className={canAdvance ? 'paper-text-button' : 'paper-primary'} onClick={onRestart}><RotateCcw size={18} />{restartLabel}{!canAdvance && <ArrowRight size={18} />}</button>
      <button className="paper-text-button" onClick={onHome}><ArrowLeft size={15} />返回首页</button>
      <p>保留你的昵称与形象，重新开一桌，每人再领一张重掷券。</p>
    </div>
  </section>;
}
