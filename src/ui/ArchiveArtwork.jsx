import { useState } from 'react';
import { ArtworkImage, getOfficial } from '../Art';
import manifest from './archive-art-manifest.json';
import '../styles/archive-art.css';

/** 静态图片加载失败时退回原文字信息，不把破图图标留在图鉴里。 */
function GeneratedImage({ path, portrait = false }) {
  const [failedPath, setFailedPath] = useState(null);
  if (!path || failedPath === path) return null;
  return <img className="archive-generated-image" src={`${import.meta.env.BASE_URL}${path}`} width={portrait ? 576 : 768} height={portrait ? 768 : 432} alt="" loading="lazy" decoding="async" onError={() => setFailedPath(path)} />;
}

/** 成就和关联称号复用同一幅插画；是否已达成由父组件的真实档案决定。 */
export function AchievementArtwork({ id }) {
  const path = manifest.achievements[id];
  if (!path) return null;
  return <div className="archive-achievement-art" aria-hidden="true"><GeneratedImage path={path} /></div>;
}

/** 优先保留既有角色立绘；同一人物跨章节的新增画像使用清单中的稳定映射。 */
export function CharacterArtwork({ character }) {
  const existing = getOfficial(character.portrait);
  const path = manifest.characters[character.id];
  if (!existing && !path) return null;
  return <div className="archive-character-art" aria-hidden="true">
    {existing ? <ArtworkImage asset={existing} sizes="224px" /> : <GeneratedImage path={path} portrait />}
  </div>;
}
