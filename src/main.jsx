import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { defaultPortrait } from './Art';
import { Home, ProfileSetup, StoryIntro } from './ui/PaperScreens';
import Game from './game/Game.jsx';
import { getHero } from './game/heroes';
import './paper-theme.css';

const initialPlayers = [
  { id: 'you', name: '林小满', title: '你', avatar: '满', color: 'coral', seat: 'bottom', awards: [] },
  { id: 'chen', name: '陈主管', title: '鸿运型', portrait: 'chen', avatar: '陈', color: 'red', seat: 'top', awards: [] },
  { id: 'mei', name: '小美', title: '稳健型', portrait: 'mei', avatar: '美', color: 'pink', seat: 'right-top', awards: [] },
  { id: 'wu', name: '老吴', title: '掠夺型', portrait: 'wu', avatar: '吴', color: 'green', seat: 'right-bottom', awards: [] },
  { id: 'lin', name: '大林', title: '控制型', portrait: 'lin', avatar: '林', color: 'purple', seat: 'left-bottom', awards: [] },
  { id: 'jie', name: '阿杰', title: '赌徒型', avatar: '杰', color: 'blue', seat: 'left-top', awards: [] },
];

/** 首页、角色设置与剧情入口；进入对局后由 Game 管理完整轮次与商店。 */
function App() {
  const [phase, setPhase] = useState('home');
  const [profile, setProfile] = useState({ name: '林小满', avatar: '满', color: 'coral', role: '新人', portrait: defaultPortrait, gender: getHero(defaultPortrait).gender });
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    // 手机结算页较长，切换页面时回到顶部，避免首页沿用上一页的滚动位置。
    window.scrollTo({ top: 0 });
  }, [phase]);
  if (phase === 'home') return <Home onStart={() => setPhase('setup')} muted={muted} setMuted={setMuted}/>;
  if (phase === 'setup') return <ProfileSetup profile={profile} setProfile={setProfile} onNext={() => setPhase('story')}/>;
  if (phase === 'story') return <StoryIntro profile={profile} onStart={() => setPhase('game')}/>;
  const players = initialPlayers.map(player => player.id === 'you' ? {
    ...player, name: profile.name, portrait: profile.portrait, avatar: profile.avatar, color: profile.color, title: profile.role, gender: getHero(profile.portrait).gender,
  } : { ...player, gender: player.id === 'mei' ? 'female' : 'male' });
  return <Game players={players} profile={profile} muted={muted} setMuted={setMuted} onHome={() => setPhase('home')}/>;
}

createRoot(document.getElementById('root')).render(<App/>);
