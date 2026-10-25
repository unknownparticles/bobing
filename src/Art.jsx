import React from 'react';
import artManifest from './art-manifest.json';
import officialManifest from './official-art.json';
import avatarManifest from './archive-avatars.json';
import artVariants from './art-variants.json';
import './art.css';

/** 将清单中的站点根路径转为部署目录内的地址，避免 Pages 子目录丢失图片。 */
function resolveArtwork(manifest) {
  const resolvePath = path => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
  return manifest.map(item => {
    const variants = artVariants[item.id];
    const sources = variants ? [...variants.sources, { src: item.src, width: variants.width }] : [];
    return {
      ...item,
      src: resolvePath(item.src),
      ...(item.thumbnail ? { thumbnail: resolvePath(item.thumbnail) } : {}),
      ...(variants ? {
        width: variants.width,
        height: variants.height,
        thumbnail: resolvePath(sources[0].src),
        srcSet: sources.map(source => `${resolvePath(source.src)} ${source.width}w`).join(', '),
      } : {}),
    };
  });
}

const art = resolveArtwork(artManifest);
const official = resolveArtwork(officialManifest);

/** 部门与公司同事的桌边头像；按 id 稳定寻址，避免和正式立绘或旧素材混淆。 */
const avatars = Object.fromEntries(Object.entries(avatarManifest).map(([id, asset]) => {
  const resolvePath = path => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
  return [id, { ...asset, src: resolvePath(asset.src) }];
}));

export const officialCharacters = official.filter(item => item.type === 'character');
export const scenes = official.filter(item => item.type === 'scene');
export const defaultPortrait = 'hero-a';

/** 查询正式角色或场景；未知 id 返回 undefined，由展示组件提供占位。 */
export function getOfficial(id) { return official.find(item => item.id === id); }

/** 查询同事头像；正式立绘不在此列，头像只在没有全身立绘时使用。 */
export function getArchiveAvatar(id) { return avatars[id]; }

/** 是否已有可用形象：正式立绘或同事头像，二者皆无才由组件给出占位。 */
export function hasPortraitArt(id) { return !!getOfficial(id) || !!getArchiveAvatar(id); }

/** 复用清单中的响应式候选；sizes 应传入图片经 CSS 放大后的宽度。 */
export function ArtworkImage({ asset, alt = '', className = '', sizes = '100vw', loading = 'lazy', fetchPriority = 'auto' }) {
  if (!asset) return null;
  return <img className={className} src={asset.srcSet ? asset.thumbnail : asset.src}
    srcSet={asset.srcSet} sizes={asset.srcSet ? sizes : undefined}
    width={asset.width} height={asset.height} alt={alt}
    loading={loading} decoding="async" fetchPriority={fetchPriority} />;
}

/** 角色立绘兼容旧素材；大图默认按桌面/手机实际高度换算选图宽度。 */
export function Portrait({ id, name = '', className = '', sizes = '(max-width: 700px) 293px, 353px', loading = 'lazy', fetchPriority = 'auto' }) {
  const asset = getOfficial(id) || art.find(item => item.id === id);
  if (!asset) return null;
  return <ArtworkImage asset={asset} className={`portrait ${asset.transparent ? 'transparent' : 'opaque'} ${className}`}
    alt={name ? `${name}的形象` : ''} sizes={sizes} loading={loading} fetchPriority={fetchPriority} />;
}

/** 素材选择器复用同一图片入口，列表项进入视口后再加载。 */
export function ArtPicker({ value, onChange }) {
  const choices = officialCharacters.filter(item => item.id.startsWith('hero-'));
  return <section className="art-picker" aria-label="立绘选择">
    <h2>选择你的主角</h2>
    <p>主角 A、B、C 会进入今晚的故事。角色名由你填写，画面不嵌入文字。</p>
    <div className="portrait-preview official-preview"><Portrait id={value} name="当前选择" loading="eager" fetchPriority="high" /></div>
    <div className="art-options">{choices.map(item => <button key={item.id} type="button" aria-pressed={item.id === value} onClick={() => onChange(item.id)}>
      <ArtworkImage asset={item} sizes="68px" /><b>{item.label}</b><small>{item.transparent ? '透明立绘' : '完整立绘'}</small>
    </button>)}</div>
    <p className="art-source">资源已按角色身份接入；机器人立绘将在入桌时使用。</p>
  </section>;
}
