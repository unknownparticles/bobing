import React from 'react';
import artManifest from './art-manifest.json';
import officialManifest from './official-art.json';
import './art.css';

/** 将清单中的站点根路径转为部署目录内的地址，避免 Pages 子目录丢失图片。 */
function resolveArtwork(manifest) {
  return manifest.map(item => ({
    ...item,
    src: `${import.meta.env.BASE_URL}${item.src.slice(1)}`,
    ...(item.thumbnail ? { thumbnail: `${import.meta.env.BASE_URL}${item.thumbnail.slice(1)}` } : {}),
  }));
}

const art = resolveArtwork(artManifest);
const official = resolveArtwork(officialManifest);

export const officialCharacters = official.filter(item => item.type === 'character');
export const scenes = official.filter(item => item.type === 'scene');
export const defaultPortrait = 'hero-a';

export function getOfficial(id) { return official.find(item => item.id === id); }
export function Portrait({ id, name = '', className = '' }) {
  const asset = getOfficial(id) || art.find(item => item.id === id);
  if (!asset) return null;
  return <img className={`portrait ${asset.transparent ? 'transparent' : 'opaque'} ${className}`} src={asset.src} alt={name ? `${name}的形象` : ''} />;
}

export function ArtPicker({ value, onChange }) {
  const choices = officialCharacters.filter(item => item.id.startsWith('hero-'));
  return <section className="art-picker" aria-label="立绘选择">
    <h2>选择你的主角</h2>
    <p>主角 A、B、C 会进入今晚的故事。角色名由你填写，画面不嵌入文字。</p>
    <div className="portrait-preview official-preview"><Portrait id={value} name="当前选择" /></div>
    <div className="art-options">{choices.map(item => <button key={item.id} type="button" aria-pressed={item.id === value} onClick={() => onChange(item.id)}>
      <img src={item.src} alt="" loading="lazy" /><b>{item.label}</b><small>{item.transparent ? '透明立绘' : '完整立绘'}</small>
    </button>)}</div>
    <p className="art-source">资源已按角色身份接入；机器人立绘将在入桌时使用。</p>
  </section>;
}
