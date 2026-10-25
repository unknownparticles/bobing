import { useId, useState } from 'react';
import CardIcon from './CardIcon';
import { shopArtAssets } from './shop-art-assets';
import '../styles/shop-artwork.css';

/** 商品插画与详情共用；未配图或图片加载失败时，仍显示该商品自己的 SVG 徽记。 */
export default function ShopArtwork({ item }) {
  const token = useId().replaceAll(':', '');
  const [failedSource, setFailedSource] = useState(null);
  const source = shopArtAssets[item.id];
  const god = item.category === 'god';
  const field = item.category === 'field';
  const warm = item.category === 'skill';
  if (source && failedSource !== source) return <div className={`stock-art art-${item.category} has-illustration`} aria-hidden="true">
    <img className="stock-illustration" src={source} width={512} height={288} alt="" loading="lazy" decoding="async" onError={() => setFailedSource(source)} />
  </div>;
  return <div className={`stock-art art-${item.category}`} aria-hidden="true">
    <svg viewBox="0 0 220 180" className="stock-illustration" fill="none">
      <defs><radialGradient id={`${token}-sky`}><stop stopColor={god ? '#fff0bc' : field ? '#cfe1c3' : '#ffe4c2'} /><stop offset="1" stopColor={god ? '#c99c53' : field ? '#668d7a' : '#c87f5e'} /></radialGradient><linearGradient id={`${token}-cloth`} x2="1" y2="1"><stop stopColor="#ba5038" /><stop offset="1" stopColor="#65362e" /></linearGradient></defs>
      <rect x="1" y="1" width="218" height="178" rx="10" fill={`url(#${token}-sky)`} />
      <circle cx="110" cy="77" r="60" fill="#fff5d1" opacity=".4" /><circle cx="110" cy="77" r="52" stroke="#fff6d6" opacity=".6" />
      <path d="M-10 151q33-45 67-13t61-6 57 1 57-19v70H-10Z" fill={field ? '#365d4d' : '#8f6745'} opacity=".28" />
      <path d="M0 165q39-28 71-11t61-3 88-4v33H0Z" fill={field ? '#254b40' : '#72513b'} opacity=".45" />
      <path d="M15 37h18q17-22 31 0h17M150 129h14q10-14 22 0h22M157 30h27m-15-7h22" stroke="#fff4cf" strokeWidth="3" strokeLinecap="round" opacity=".6" />
      {god ? <g stroke="#63432b" strokeWidth="1.7" strokeLinejoin="round">
        <path d="M64 156q8-52 25-64h42q24 23 28 64Z" fill={`url(#${token}-cloth)`} />
        <path d="M90 94l20 36 20-36-20 8Z" fill="#f0d59a" />
        <path d="M99 118l-7 38h36l-7-38-11 12Z" fill="#e3aa4f" stroke="none" />
        <rect x="88" y="40" width="44" height="58" rx="20" fill="#e6b47d" />
        <path d="M86 58h48l-5-23-19-12-19 12Z" fill="#4e5f43" /><path d="M80 42l-14-9 2 22 18 3m48-16 14-9-2 22-12 3" fill="#4e5f43" />
        <circle cx="110" cy="40" r="6" fill="#e1bc62" />
        <path d="M98 65q4-3 8 0m8 0q4-3 8 0m-17 16q5 3 10 0" strokeLinecap="round" />
        <path d="M97 83q13 8 26 0-2 27-13 35-11-9-13-35Z" fill="#f4e3bd" stroke="none" />
        <path d="M70 126l27 10-6 15-28-8m87-17-23 10 5 15 25-8" fill="#e5b787" />
        <path d="M87 129h45v22H87Z" fill="#d8ab54" />
        <path d="M97 137h25m-19 7h13" stroke="#fff0c2" />
      </g> : field ? <g strokeLinejoin="round">
        <path d="M20 108L79 69l56 31 55-21 31 70H0Z" fill="#56785b" />
        <path d="M31 136l45-40 52 29 48-23 28 50H18Z" fill="#345c46" />
        <path d="M66 143v-32l44-17 43 17v32" fill="#e1d2a0" stroke="#344d39" strokeWidth="3" />
        <path d="M49 110l61-30 61 30-61-11Z" fill="#9b4536" stroke="#5c392b" strokeWidth="2" />
        <path d="M60 105l50-30 50 30" stroke="#e4bd76" strokeWidth="3" />
        <path d="M92 142v-28h36v28m-52-28v28m68-28v28" stroke="#77623a" strokeWidth="4" />
        <path d="M17 146h189" stroke="#ecdcb0" strokeWidth="3" />
      </g> : <g stroke="#654333" strokeWidth="2">
        <path d="M32 132q74-31 155 0v19H32Z" fill="#77503a" /><ellipse cx="110" cy="128" rx="70" ry="25" fill="#c7d8bc" /><ellipse cx="110" cy="121" rx="70" ry="23" fill="#f5deb2" />
        <g transform="rotate(-14 87 117)"><rect x="69" y="99" width="31" height="31" rx="5" fill="#fff2cf" /><circle cx="78" cy="108" r="3" fill="#ad432f" /><circle cx="91" cy="108" r="3" fill="#ad432f" /><circle cx="78" cy="121" r="3" fill="#ad432f" /><circle cx="91" cy="121" r="3" fill="#ad432f" /></g>
        <g transform="rotate(15 133 117)"><rect x="114" y="101" width="31" height="31" rx="5" fill="#fff2cf" /><circle cx="129" cy="116" r="4" fill="#ad432f" /></g>
        <path d="M44 79l-10-9m15-6-3-13m121 29 11-12m-12-4 3-13" stroke="#fff1c5" strokeWidth="3" strokeLinecap="round" />
      </g>}
      <path d="M8 21V8h16m172 0h16v13M8 159v13h16m172 0h16v-13" stroke="#fff2cc" strokeWidth="2" opacity=".8" />
    </svg>
    <span className={`stock-art-emblem ${warm ? 'warm' : ''}`}><CardIcon id={item.id} size={god ? 15 : 26} /></span>
  </div>;
}
