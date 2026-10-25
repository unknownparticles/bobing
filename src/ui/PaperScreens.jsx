import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Dices, Leaf, Sparkles, UserRound } from 'lucide-react';
import { Portrait, officialCharacters } from '../Art';
import { Brand, SoundButton } from './PaperPrimitives';
import HomeBowl from './HomeBowl';
import { createMatch, GAME_MODES, isValidPlayerCount, MIN_PLAYER_COUNT, MAX_PLAYER_COUNT, STORY_CHAPTERS } from '../game/modes';
import { getHero } from '../game/heroes';
import CardIcon from './CardIcon';
import { chapterRivals } from '../game/rivals';
import { careerOf } from '../game/careers';
import { RivalAvatar, rivalStyle } from './RivalDetails';

/** 首页用骰碗和节令图形建立视觉焦点，不要求玩家先阅读长说明。 */
export function Home({ onStart, muted, setMuted, initialMode = 'story', archive, storageError, onArchive, onNewCycle }) {
  const [mode, setMode] = useState(initialMode);
  const [playerCount, setPlayerCount] = useState('6');
  const valid = mode !== 'classic' || isValidPlayerCount(Number(playerCount));
  const selected = GAME_MODES.find(item => item.id === mode);
  const startLabel = { story: '开启中秋故事', quick: '开始双人对局', classic: '开始经典对局' }[mode];
  return <main className="paper-page paper-home">
    <header className="paper-header"><Brand /><div className="paper-header-tools">{onArchive && <button className="paper-text-button" onClick={onArchive}>图鉴 · 成就</button>}<SoundButton muted={muted} onToggle={() => setMuted(!muted)} /></div></header>
    <section className="paper-home-body">
      <div className="paper-home-copy"><span className="paper-eyebrow"><i />中秋好时节 · 今晚好彩头</span><h1>好彩头，<br />就在<span>这一碗。</span></h1><p>从组内第一，到公司王中王。<br />选一张桌，掷出属于你的好彩头。</p>
        <div className="paper-mode-picker" role="group" aria-label="选择游戏模式">{GAME_MODES.map(item => <button key={item.id} type="button" className={`paper-mode-card ${mode === item.id ? 'is-selected' : ''}`} aria-pressed={mode === item.id} onClick={() => setMode(item.id)}><span><b>{item.name}</b><small>{item.tag}</small></span><span className="paper-mode-detail">{item.detail}</span></button>)}</div>
        <p className="paper-mode-description" aria-live="polite">{selected.description}</p>
        {mode === 'classic' && <div className="paper-classic-options"><label htmlFor="classic-player-count">同桌总人数</label><input id="classic-player-count" type="number" min={MIN_PLAYER_COUNT} max={MAX_PLAYER_COUNT} step="1" value={playerCount} aria-invalid={!valid} aria-describedby="classic-player-hint" onChange={event => setPlayerCount(event.target.value)} /><small id="classic-player-hint">{valid ? `${MIN_PLAYER_COUNT}～${MAX_PLAYER_COUNT} 人，包含你和 ${Number(playerCount) - 1} 名电脑，奖品博完再散席。` : `请填写 ${MIN_PLAYER_COUNT}～${MAX_PLAYER_COUNT} 之间的整数。`}</small></div>}
        <button className="paper-primary home-start" disabled={!valid} onClick={() => onStart(createMatch(mode, { playerCount: Number(playerCount) }))}>{startLabel} <ArrowRight size={19} /></button>
        {archive?.cyclesCompleted > 0 && <button className="paper-text-button new-cycle-button" onClick={onNewCycle}>开启第 {archive.cyclesCompleted + 1} 周目 · 试试新的构筑 <ArrowRight size={15} /></button>}
        <p className="paper-mode-description">商店随机发牌，怎样搭配由你决定。图鉴和成就自动保存。</p>
        {storageError && <p className="archive-storage-error" role="alert">{storageError}</p>}
        <div className="paper-home-meta"><span><Dices size={14} />随机来牌 · 自由出招</span><span><Sparkles size={14} />轮间小铺 · 神明助阵</span><span>点击骰碗 · 手机摇一摇</span></div></div>
      <div className="paper-home-art"><span className="paper-moon" /><span className="paper-art-label">一碗团圆 · 满桌好运</span><HomeBowl /><span className="paper-art-stamp">好<br />彩<br />头</span><div className="paper-cloud cloud-one" /><div className="paper-cloud cloud-two" /></div>
    </section>
    <footer className="paper-home-footer"><Leaf size={14} /><span>故事 · 快速 · 经典，总有一桌等你</span><span>WHO WILL BE TONIGHT’S ZHUANGYUAN?</span></footer>
  </main>;
}

/** 昵称、形象和身份仍由 App 保存；这里只组织可读的角色选择界面。 */
export function ProfileSetup({ profile, setProfile, onNext, onHome, match, unlockedContent }) {
  const choices = officialCharacters.filter(item => item.id.startsWith('hero-')).sort((a, b) => a.id.localeCompare(b.id));
  // 三列选项里的立绘放大到 190%；sizes 对应手机单栏和桌面双栏的实际图片宽度。
  const choiceSizes = '(max-width: 700px) calc(63.34vw - 40px), (max-width: 1120px) calc(31.67vw - 64px), 292px';
  return <main className="paper-page paper-setup">
    <header className="paper-header"><Brand subtitle={match ? `${match.title} · ${match.playerCount}人同桌${match.cycle > 1 ? ` · 第${match.cycle}周目` : ''}` : '第一步 · 认识你'} />{onHome && <button className="paper-text-button" onClick={onHome}><ArrowLeft size={14} />返回模式选择</button>}</header>
    <div className="paper-setup-body">
      <section className="paper-character-preview"><span className="paper-eyebrow">今晚的主角，是你。</span><div className="paper-character-circle" /><Portrait id={profile.portrait} name={profile.name} sizes="(max-width: 700px) 293px, 327px" loading="eager" fetchPriority="high" /><div className="paper-character-caption"><span>初次入席</span><h2>{profile.name || '今晚的主角'}</h2><p>带上好心情，坐上这张桌。</p></div></section>
      <section className="paper-setup-form"><span className="paper-eyebrow">入席之前</span><h1>给好运一个名字。</h1><p className="paper-description">选个喜欢的模样，和同事们一起热闹一晚。</p>
        <label className="paper-field">你的称呼 <small>最多 8 个字</small><input maxLength={8} value={profile.name} onChange={event => setProfile({ ...profile, name: event.target.value })} placeholder="怎么称呼你？" /></label>
        <fieldset className="paper-character-picker"><legend>选择你的主角</legend>{choices.map(item => <button key={item.id} type="button" aria-pressed={profile.portrait === item.id} onClick={() => setProfile({ ...profile, portrait: item.id, gender: getHero(item.id).gender })}><span className="paper-choice-portrait"><Portrait id={item.id} sizes={choiceSizes} /></span><b>{getHero(item.id).name} · {getHero(item.id).genderLabel}</b>{profile.portrait === item.id && <Check className="paper-choice-check" size={15} />}</button>)}</fieldset>
        <div className="hero-selection-talent" role="status" aria-live="polite"><CardIcon id={getHero(profile.portrait).icon} size={24} /><div><span>专属基础技能</span><h2>{getHero(profile.portrait).skill}</h2><p>{getHero(profile.portrait).description}</p><small>随主角固定 · 不消耗卡牌 · 不占神明位</small></div></div>
        <fieldset className="paper-role-picker"><legend>你的入席身份</legend>{[{ name: '新人', icon: Dices }, { name: '观察者', icon: UserRound }].map(({ name, icon: Icon }) => <button key={name} type="button" aria-pressed={profile.role === name} onClick={() => setProfile({ ...profile, role: name })}><Icon size={17} />{name}{profile.role === name && <Check size={14} />}</button>)}</fieldset>
        <p className="paper-description">当前主角：{getHero(profile.portrait).genderLabel} · 月老将根据主角形象匹配异性角色。</p>
        <button className="paper-primary" disabled={!profile.name.trim()} onClick={onNext}>就以这个身份入席 <ArrowRight size={18} /></button>
      </section>
    </div>
  </main>;
}

/** 两幕剧情后公开完整阵容，让玩家先看清职业能力与限制再入席。 */
export function StoryIntro({ profile, onStart, chapterIndex = 0, onHome }) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const chapter = STORY_CHAPTERS[chapterIndex];
  const scene = chapter.scenes[sceneIndex];
  if (sceneIndex === 2) return <main className="paper-page paper-story paper-roster">
    <header className="paper-header"><Brand subtitle={chapter.title} /><span className="paper-page-step">入席阵容</span></header>
    <section className="chapter-roster" aria-label="章节对手介绍">
      <div className="chapter-roster-heading"><div><span className="paper-eyebrow">{chapter.location}</span><h1>这一桌，与你过招的人。</h1><p>{chapterIndex === 0 ? '先熟悉基础玩法：五位组内同事各有打法，均无职业专属技能。' : chapterIndex === 1 ? '七位部门好手，三位带有职业专属技能；各自根据本桌拿到的牌出招。' : '九位公司强手全部拥有职业专属技能，看准资源与发动时机。'}</p></div><span className="paper-page-step">你 + {chapter.playerCount - 1} 位对手</span></div>
      <ul className="chapter-roster-list" aria-label="本章同桌对手">{chapterRivals(chapterIndex).map(player => {
        const career = careerOf(player);
        return <li className={`chapter-rival ${career ? 'has-career' : ''}`} key={player.id}><header><RivalAvatar player={player} /><div><h2>{player.name}</h2><small>{player.title}</small></div></header><p className="career-style">{rivalStyle(player)}</p>{career ? <><span className="chapter-career-label"><Sparkles size={13} />职业强手</span><p><b>{career.name}</b></p>{(Array.isArray(career.description) ? career.description : [career.description]).map((text, index) => <p key={index}>{text}</p>)}</> : <p>{player.style}。{chapterIndex === 0 ? '无职业技能；开局有一张通用重掷券。' : '无职业专属技能；根据手牌和局势出招。'}</p>}</li>;
      })}</ul>
      <p className="chapter-roster-note">每章独立开桌，金币、手牌与职业资源重新开始。职业主动技能被封印时不能发动，被动收入、补给与资源增长仍照常结算。入席后点击对手，可查看最新公开状态与完整说明。</p>
      <div className="chapter-roster-actions"><button type="button" className="paper-primary" onClick={onStart}>入席，开始本章 <ArrowRight size={18} /></button><button type="button" className="paper-text-button" onClick={() => setSceneIndex(1)}><ArrowLeft size={14} />回看剧情</button>{onHome && <button type="button" className="paper-text-button" onClick={onHome}>返回模式选择</button>}</div>
    </section>
  </main>;
  return <main className="paper-page paper-story" key={`${chapter.id}-${sceneIndex}`}>
    <header className="paper-header"><Brand subtitle={chapter.title} /><div className="paper-story-tools"><span className="paper-page-step">{String(sceneIndex + 1).padStart(2, '0')} / 02</span><button className="paper-story-skip" onClick={onStart}>跳过剧情，直接入席 <ArrowRight size={14} /></button></div></header>
    <ol className="paper-chapter-path" aria-label="故事旅程">{STORY_CHAPTERS.map((item, index) => <li key={item.id} className={index === chapterIndex ? 'is-current' : index < chapterIndex ? 'is-complete' : ''} aria-current={index === chapterIndex ? 'step' : undefined}><span>{index < chapterIndex ? <Check size={13} /> : `0${index + 1}`}</span><div><b>{item.name}</b><small>{item.playerCount} 人桌{index < chapterIndex ? ' · 已夺冠' : index > chapterIndex ? ' · 待晋级' : ' · 当前章节'}</small></div></li>)}</ol>
    <section className="paper-story-body"><div className="paper-story-art"><div className="paper-story-window"><span /><span /><span /><span /></div><span className="paper-story-moon" /><Portrait id={profile.portrait} name={profile.name} loading="eager" fetchPriority="high" /><span className="paper-story-art-note">{chapter.location}</span></div><div className="paper-story-copy"><span className="paper-eyebrow">{chapter.eyebrow}</span><h1>{chapter.headline}<br /><span>{chapter.highlight}</span></h1><h2 className="paper-scene-title">{scene.title}</h2><p>{profile.name}，{scene.text}</p><blockquote>“{scene.quote}”<small>—— {chapter.speaker}</small></blockquote><p className="paper-chapter-rule">{chapter.playerCount} 人同桌 · 每人 8 轮 · {chapterIndex === 2 ? '夺冠即成为公司王中王' : '第一名晋级，未夺冠可重试'}</p><button className="paper-primary" onClick={() => setSceneIndex(sceneIndex + 1)}>{sceneIndex === 1 ? '看看本章同桌阵容' : scene.action} <ArrowRight size={18} /></button>{sceneIndex === 1 && <button className="paper-text-button" onClick={() => setSceneIndex(0)}><ArrowLeft size={14} />回看上一幕</button>}{onHome && <button className="paper-text-button" onClick={onHome}><ArrowLeft size={14} />返回模式选择</button>}</div></section>
  </main>;
}
