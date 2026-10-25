import React from 'react';
import { CHARACTERS, PUBLIC_SKILLS } from '../game/encounters';
import { Avatar } from './PaperPrimitives';
import CardIcon from './CardIcon';
import ShopArtwork from './ShopArtwork';
import { CharacterArtwork } from './ArchiveArtwork';
import { getItem } from '../game/catalog';

/** 公开技能只收录实际入席的角色，不把尚未遇见的技能当作已发现。 */
export function SkillCollection({ archive }) {
  const skills = PUBLIC_SKILLS.filter(skill => archive.skills?.includes(skill.id));
  return <>
    <p className="archive-panel-note">已遇见 {skills.length} / {PUBLIC_SKILLS.length} 项技能 · 人物专属技能随角色入席记录，技能卡请查卡牌图鉴。</p>
    <div className="archive-collection">{skills.map(skill => <article className="archive-card" key={skill.id}>
      {getItem(skill.icon) && <div className="archive-card-art"><ShopArtwork item={getItem(skill.icon)} /></div>}
      <div className="archive-card-top"><CardIcon id={skill.icon} size={26} /><span className="archive-state">已遇见</span></div>
      <h2>{skill.name}</h2><small>{skill.source}</small><p>{skill.description}</p>
    </article>)}</div>
    {!skills.length && <p className="archive-panel-note">还没有遇见技能。入席后，本桌公开技能会自动留在这里。</p>}
  </>;
}

/** 角色按稳定身份收集，缺少专属立绘时沿用桌面的通用头像。 */
export function CharacterCollection({ archive }) {
  const characters = CHARACTERS.filter(character => archive.characters?.includes(character.id));
  return <>
    <p className="archive-panel-note">已遇见 {characters.length} / {CHARACTERS.length} 位角色 · 同桌一次便会收录，换桌后仍可查看。</p>
    <div className="archive-collection">{characters.map(character => <article className="archive-card" key={character.id}>
      <CharacterArtwork character={character} />
      <div className="archive-card-top"><Avatar portrait={character.portrait} name={character.name} /><span className="archive-state">已遇见</span></div>
      <h2>{character.name}</h2><small>{character.title}</small><p>{character.description}</p>
    </article>)}</div>
    {!characters.length && <p className="archive-panel-note">还没有同桌记录。开一桌博饼，认识今晚的好手。</p>}
  </>;
}
