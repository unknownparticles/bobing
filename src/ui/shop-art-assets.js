import manifest from './shop-art-manifest.json';
import archiveArt from './archive-art-manifest.json';

/** 完整牌库的静态插画，部署到 Pages 子目录时仍从当前站点路径加载。 */
export const shopArtAssets = Object.fromEntries(
  Object.entries({ ...manifest, ...archiveArt.cards }).map(([id, path]) => [id, `${import.meta.env.BASE_URL}${path}`]),
);
