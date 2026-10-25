import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import ArchiveScreen from '/src/ui/ArchiveScreen';
import { createArchive } from '/src/game/archive';
import { CATALOG } from '/src/game/catalog';
import { CHARACTERS, PUBLIC_SKILLS } from '/src/game/encounters';
import '/src/paper-theme.css';
import '/src/styles/interaction-polish.css';
import '/src/styles/encounter-guide.css';

/** 仅用于检查图片和状态的独立演示档案，完全不写浏览器的实际游戏进度。 */
function exampleArchive(earned) {
  return {
    ...createArchive(),
    discovered: CATALOG.filter((_, index) => index % 3 !== 0).map(item => item.id),
    used: CATALOG.filter((_, index) => index % 4 === 0).map(item => item.id),
    characters: CHARACTERS.map(item => item.id),
    skills: PUBLIC_SKILLS.map(item => item.id),
    achievements: earned ? ['first_win', 'story_clear', 'luck_master'] : [],
    titles: earned ? ['first_win', 'champion'] : [],
    unlockedContent: earned ? ['luck_blessing'] : [],
    cyclesCompleted: earned ? 1 : 0,
    storyClears: earned ? 1 : 0,
  };
}

function Preview() {
  const [earned, setEarned] = useState(true);
  const [archive, setArchive] = useState(() => exampleArchive(true));
  return <>
    <aside style={{ padding: '12px 20px', background: '#304d3d', color: '#fff5dd', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
      <span>插画与状态演示 · 不写入真实进度</span><button type="button" style={{ minHeight: '44px', padding: '8px 12px', border: '1px solid #b7a77b', borderRadius: '5px', color: '#304d3d', background: '#fff5df' }} onClick={() => { setEarned(!earned); setArchive(exampleArchive(!earned)); }}>{earned ? '查看全部未达成状态' : '查看部分已达成状态'}</button>
    </aside>
    <ArchiveScreen archive={archive} onHome={() => { window.location.href = '/'; }} onSelectTitle={id => setArchive(current => ({ ...current, selectedTitle: id }))} />
  </>;
}

createRoot(document.getElementById('root')).render(<Preview />);
