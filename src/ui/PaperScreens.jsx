import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Dices, Leaf, Sparkles, UserRound } from 'lucide-react';
import { Portrait, officialCharacters } from '../Art';
import { Brand, DiceBowl, SoundButton } from './PaperPrimitives';
import { MAX_ROUNDS } from '../game/config.js';
import { getHero } from '../game/heroes';
import CardIcon from './CardIcon';

/** 首页用骰碗和节令图形建立视觉焦点，不要求玩家先阅读长说明。 */
export function Home({ onStart, muted, setMuted }) {
  return <main className="paper-page paper-home">
    <header className="paper-header"><Brand /><SoundButton muted={muted} onToggle={() => setMuted(!muted)} /></header>
    <section className="paper-home-body">
      <div className="paper-home-copy"><span className="paper-eyebrow"><i />中秋好时节 · 今晚好彩头</span><h1>好彩头，<br />就在<span>这一碗。</span></h1><p>六颗骰子，五位同事，{MAX_ROUNDS} 轮争状元。<br />掷出好运，也用好招守住第一。</p><button className="paper-primary home-start" onClick={onStart}>入席，博个好彩头 <ArrowRight size={19} /></button><div className="paper-home-meta"><span><Dices size={14} />开局送重掷券</span><span><Sparkles size={14} />轮间买招 · 抢夺反击</span><span>点击 / 手机摇一摇</span></div></div>
      <div className="paper-home-art"><span className="paper-moon" /><span className="paper-art-label">一碗团圆 · 满桌好运</span><DiceBowl dice={[4, 4, 2, 6, 3, 1]} decorative /><span className="paper-art-stamp">好<br />彩<br />头</span><div className="paper-cloud cloud-one" /><div className="paper-cloud cloud-two" /></div>
    </section>
    <footer className="paper-home-footer"><Leaf size={14} /><span>第一章 · 公司中秋晚宴</span><span>WHO WILL BE TONIGHT’S ZHUANGYUAN?</span></footer>
  </main>;
}

/** 昵称、形象和身份仍由 App 保存；这里只组织可读的角色选择界面。 */
export function ProfileSetup({ profile, setProfile, onNext }) {
  const choices = officialCharacters.filter(item => item.id.startsWith('hero-')).sort((a, b) => a.id.localeCompare(b.id));
  return <main className="paper-page paper-setup">
    <header className="paper-header"><Brand subtitle="第一步 · 认识你" /><span className="paper-page-step">01 / 02</span></header>
    <div className="paper-setup-body">
      <section className="paper-character-preview"><span className="paper-eyebrow">今晚的主角，是你。</span><div className="paper-character-circle" /><Portrait id={profile.portrait} name={profile.name} /><div className="paper-character-caption"><span>初次入席</span><h2>{profile.name || '今晚的主角'}</h2><p>带上好心情，坐上这张桌。</p></div></section>
      <section className="paper-setup-form"><span className="paper-eyebrow">入席之前</span><h1>给好运一个名字。</h1><p className="paper-description">选个喜欢的模样，和同事们一起热闹一晚。</p>
        <label className="paper-field">你的称呼 <small>最多 8 个字</small><input maxLength={8} value={profile.name} onChange={event => setProfile({ ...profile, name: event.target.value })} placeholder="怎么称呼你？" /></label>
        <fieldset className="paper-character-picker"><legend>选择你的主角</legend>{choices.map(item => <button key={item.id} type="button" aria-pressed={profile.portrait === item.id} onClick={() => setProfile({ ...profile, portrait: item.id, gender: getHero(item.id).gender })}><span className="paper-choice-portrait"><Portrait id={item.id} /></span><b>{getHero(item.id).name} · {getHero(item.id).genderLabel}</b>{profile.portrait === item.id && <Check className="paper-choice-check" size={15} />}</button>)}</fieldset>
        <div className="hero-selection-talent" role="status" aria-live="polite"><CardIcon id={getHero(profile.portrait).icon} size={24} /><div><span>专属基础技能</span><h2>{getHero(profile.portrait).skill}</h2><p>{getHero(profile.portrait).description}</p><small>随主角固定 · 不消耗卡牌 · 不占神明位</small></div></div>
        <fieldset className="paper-role-picker"><legend>你的入席身份</legend>{[{ name: '新人', icon: Dices }, { name: '观察者', icon: UserRound }].map(({ name, icon: Icon }) => <button key={name} type="button" aria-pressed={profile.role === name} onClick={() => setProfile({ ...profile, role: name })}><Icon size={17} />{name}{profile.role === name && <Check size={14} />}</button>)}</fieldset>
        <p className="paper-description">当前主角：{getHero(profile.portrait).genderLabel} · 月老将根据主角形象匹配异性角色。</p>
        <button className="paper-primary" disabled={!profile.name.trim()} onClick={onNext}>就以这个身份入席 <ArrowRight size={18} /></button>
      </section>
    </div>
  </main>;
}

/** 两段原有剧情使用统一的纸面构图，角色形象跟随用户选择。 */
export function StoryIntro({ profile, onStart }) {
  const [scene, setScene] = useState('office');
  return <main className="paper-page paper-story" key={scene}>
    <header className="paper-header"><Brand subtitle="第一章 · 组内博饼" /><div className="paper-story-tools"><span className="paper-page-step">{scene === 'office' ? '01' : '02'} / 02</span><button className="paper-story-skip" onClick={onStart}>跳过剧情，直接入席 <ArrowRight size={14} /></button></div></header>
    <section className="paper-story-body"><div className="paper-story-art"><div className="paper-story-window"><span /><span /><span /><span /></div><span className="paper-story-moon" /><Portrait id={profile.portrait} name={profile.name} /><span className="paper-story-art-note">中秋 · 人月两团圆</span></div><div className="paper-story-copy"><span className="paper-eyebrow">下班之后，故事开始。</span><h1>普通员工，<br />今晚也能<span>拿状元。</span></h1><p>{scene === 'office' ? `${profile.name}，下班铃声响起，同事们叫你一起去参加中秋晚宴。今晚，你决定不再只是旁观者。` : `公司中秋晚宴，最后一桌空出了一个位置。${profile.name}，你被同事们推到了博饼桌前。`}</p><blockquote>“别只看运气。奖项到手之前，<br />谁都不能放心。”<small>—— 陈主管</small></blockquote><button className="paper-primary" onClick={scene === 'office' ? () => setScene('entrance') : onStart}>{scene === 'office' ? '前往晚宴' : '坐好，开博！'} <ArrowRight size={18} /></button>{scene === 'entrance' && <button className="paper-text-button" onClick={() => setScene('office')}><ArrowLeft size={14} />回看上一幕</button>}</div></section>
  </main>;
}
