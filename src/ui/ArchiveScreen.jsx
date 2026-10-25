import React, { useState } from 'react';
import { ArrowLeft, Award, BookOpen, Check, Crown, LockKeyhole, Sparkles, Users } from 'lucide-react';
import { CATALOG } from '../game/catalog';
import { ACHIEVEMENTS, TITLES, getUnlockForItem, isContentUnlocked } from '../game/progression-content';
import { Brand } from './PaperPrimitives';
import CardIcon from './CardIcon';
import ShopArtwork from './ShopArtwork';
import { AchievementArtwork } from './ArchiveArtwork';
import { CharacterCollection, SkillCollection } from './GuideCollections';
import '../styles/archetypes.css';

const categories = { god: '神明', skill: '技能', field: '场地' };
const tabs = [{ id: 'collection', name: '卡牌图鉴', icon: BookOpen }, { id: 'skills', name: '技能图鉴', icon: Sparkles }, { id: 'characters', name: '角色图鉴', icon: Users }, { id: 'achievements', name: '成就', icon: Award }, { id: 'titles', name: '称号', icon: Crown }];

/** 每桌统计独立取证，不能把多桌偷盗份数相加来满足单桌成就。 */
function achievementProgress(achievement, archive) {
  if (archive.achievements.includes(achievement.id)) return '已达成 · 奖励已永久解锁';
  const cursors = Object.values(archive.cursors);
  const wins = archive.storyClears ?? Object.values(archive.storyWins).reduce((sum, count) => sum + count, 0);
  switch (achievement.id) {
    case 'first_win': return '尚未记录本人夺冠';
    case 'story_clear': return `完整故事通关：${wins} 次`;
    case 'luck_master': return `单桌最高有效运气：${Math.max(0, ...cursors.map(cursor => cursor.maxLuck || 0))} / 5；还需同桌夺冠`;
    case 'theft_master': return `单桌最高夺奖：${Math.max(0, ...cursors.map(cursor => cursor.theft))} / 3；还需同桌夺冠`;
    case 'patience_master': return cursors.some(cursor => cursor.burst) ? '已有爆发记录；还需触发爆发的同一桌夺冠' : '尚无本人厚积薄发爆发记录';
    case 'all_paths': return `已实践效果：${(archive.exploredEffects || []).length} / 4`;
    // 档案未保存这两类事件的次数，只展示已知状态，避免伪造百分比。
    default: return '尚未达成 · 达成时记录';
  }
}

/** 长期收集、成就与称号入口；只通过回调切换称号，不在展示层写存储。 */
export default function ArchiveScreen({ archive, onHome, onSelectTitle, storageError = '', inGame = false }) {
  const [tab, setTab] = useState('collection');
  const [category, setCategory] = useState('all');
  const [onlySeen, setOnlySeen] = useState(false);
  const items = CATALOG.filter(item => (category === 'all' || item.category === category) && (!onlySeen || archive.discovered.includes(item.id) || archive.used.includes(item.id)));
  const discovered = CATALOG.filter(item => archive.discovered.includes(item.id) || archive.used.includes(item.id)).length;
  const used = CATALOG.filter(item => archive.used.includes(item.id)).length;
  const unlocked = CATALOG.filter(item => isContentUnlocked(item.id, archive.unlockedContent)).length;
  const filteredDiscovered = items.filter(item => archive.discovered.includes(item.id) || archive.used.includes(item.id)).length;
  return <main className="paper-page archive-page">
    <header className="paper-header"><Brand subtitle="长期档案 · 好彩头留在这里" /><button type="button" className="archive-home" onClick={onHome}><ArrowLeft size={17} aria-hidden="true" />{inGame ? '返回对局' : '返回首页'}</button></header>
    <div className="archive-body">
      <section className="archive-intro"><span className="paper-eyebrow">{inGame ? '桌上遇见的好招，随时查一查' : '每次入席，都是新故事'}</span><h1>{inGame ? '桌边图鉴' : '好彩头档案'}</h1><p>{!inGame && `已完成 ${archive.cyclesCompleted} 个故事周目 · `}图鉴发现 {discovered} / {CATALOG.length} · 使用 {used} / {CATALOG.length}</p>{!inGame && <p>解锁内容加入后续商店与随机来源，每桌金币、奖项与卡牌成长重新开始。</p>}</section>
      {storageError && <p className="archive-storage-error" role="alert">{storageError}</p>}
      <div className="archive-tabs" role="tablist" aria-label="档案内容">{tabs.map((item, index) => <button key={item.id} id={`archive-tab-${item.id}`} type="button" role="tab" tabIndex={tab === item.id ? 0 : -1} aria-selected={tab === item.id} aria-controls="archive-panel" onClick={() => setTab(item.id)} onKeyDown={event => {
        const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (!offset && !['Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = tabs[event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + offset + tabs.length) % tabs.length];
        setTab(next.id);
        document.getElementById(`archive-tab-${next.id}`)?.focus();
      }}><item.icon size={17} aria-hidden="true" />{item.name}</button>)}</div>
      <section id="archive-panel" className="archive-panel" role="tabpanel" aria-labelledby={`archive-tab-${tab}`}>
        {tab === 'collection' && <>
          <div className="archive-filter-bar"><label>按分类筛选<select value={category} onChange={event => setCategory(event.target.value)}><option value="all">全部分类</option>{Object.entries(categories).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label><p>本次筛选发现 {filteredDiscovered} / {items.length}<br />全图鉴已解锁 {unlocked} / {CATALOG.length}</p></div>
          <p className="archive-state-guide">本人货架、获得的卡牌和全桌公开出招都会记录；“已使用”仅统计你亲自用过的卡牌。</p>
          <label className="archive-seen-filter"><input type="checkbox" checked={onlySeen} onChange={event => setOnlySeen(event.target.checked)} />仅看遇见过的卡牌</label>
          <div className="archive-collection">{items.map(item => {
            const open = isContentUnlocked(item.id, archive.unlockedContent);
            const wasUsed = archive.used.includes(item.id);
            const wasDiscovered = archive.discovered.includes(item.id) || wasUsed;
            const state = wasUsed ? '已使用' : wasDiscovered ? `已发现${open ? '' : ' · 未解锁'}` : !open ? '未解锁' : '已解锁未发现';
            const unlock = getUnlockForItem(item.id);
            return <article key={item.id} className={`archive-card ${open ? '' : 'is-locked'} ${wasUsed ? 'is-used' : ''} ${wasDiscovered ? '' : 'is-undiscovered'}`}>
              <div className="archive-card-art"><ShopArtwork item={item} /></div>
              <div className="archive-card-top"><CardIcon id={item.id} size={24} /><span className="archive-state">{!open ? <LockKeyhole size={12} aria-hidden="true" /> : wasUsed ? <Check size={12} aria-hidden="true" /> : null}{state}</span></div><h2>{item.name}</h2><small>{categories[item.category]} · {item.price} 金币</small><p>{item.description}</p><p className="archive-card-source">{unlock ? `解锁条件 · ${unlock.name}：${unlock.description}` : '基础开放 · 可在商店遇到'}{open && '；浏览本人货架、获得或见到公开使用后记录发现。'}</p>
            </article>;
          })}</div>{!items.length && <p className="archive-panel-note">当前筛选还没有遇见记录。入席出招或逛逛小铺，再回来看看。</p>}
        </>}
        {tab === 'skills' && <SkillCollection archive={archive} />}
        {tab === 'characters' && <CharacterCollection archive={archive} />}
        {tab === 'achievements' && <><p className="archive-panel-note">已达成 {archive.achievements.length} / {ACHIEVEMENTS.length} · 奖励只解锁一次。单桌条件不能跨桌累计。</p><div className="archive-achievements">{ACHIEVEMENTS.map(achievement => {
          const done = archive.achievements.includes(achievement.id);
          return <article key={achievement.id} className={`archive-achievement ${done ? 'is-complete' : ''}`}><AchievementArtwork id={achievement.id} /><div className="archive-achievement-heading"><h2>{achievement.name}</h2><span>{done ? <Check size={15} aria-hidden="true" /> : <LockKeyhole size={14} aria-hidden="true" />}{done ? '已达成' : '未达成'}</span></div><p>{achievement.description}</p><p className="archive-progress">{achievementProgress(achievement, archive)}</p><p className="archive-reward">奖励 · {achievement.reward.description}</p></article>;
        })}</div></>}
        {tab === 'titles' && <><p className="archive-panel-note">佩戴的称号会展示在本人名片；解锁后可自由更换或卸下。</p><div className="archive-titles">{TITLES.map(title => {
          const open = archive.titles.includes(title.id);
          const selected = archive.selectedTitle === title.id;
          const unlock = ACHIEVEMENTS.find(achievement => achievement.reward.titles.includes(title.id));
          return <article key={title.id} className={`archive-title ${selected ? 'is-selected' : ''}`}><AchievementArtwork id={unlock?.id} /><Crown size={23} aria-hidden="true" /><h2>{title.name}</h2><p>{title.description}</p><small>{open ? '已解锁' : `解锁条件：${unlock?.description || '暂无记录'}`}</small><button type="button" disabled={!open || !onSelectTitle} aria-label={`${!open ? '未解锁' : selected ? '卸下' : '佩戴'}${title.name}`} aria-pressed={selected} onClick={() => onSelectTitle(selected ? '' : title.id)}>{!open ? '尚未解锁' : inGame ? '回首页更换称号' : selected ? '卸下称号' : '佩戴称号'}</button></article>;
        })}</div></>}
      </section>
    </div>
  </main>;
}
