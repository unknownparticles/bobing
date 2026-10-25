import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { defaultPortrait } from './Art';
import { Home, ProfileSetup, StoryIntro } from './ui/PaperScreens';
import Game from './game/Game.jsx';
import { getHero } from './game/heroes';
import { createMatch, createPlayers, placeOf, STORY_CHAPTERS } from './game/modes';
import { loadArchive, saveArchive, syncArchive } from './game/archive';
import ArchiveScreen from './ui/ArchiveScreen';
import { useAudio } from './audio';
import './paper-theme.css';
import './styles/artisan-ui.css';
import './styles/game-modes.css';
import './styles/interaction-polish.css';

/** 首页、角色设置与剧情入口；进入对局后由 Game 管理完整轮次与商店。 */
function App() {
  const [phase, setPhase] = useState('home');
  const [profile, setProfile] = useState({ name: '林小满', avatar: '满', color: 'coral', role: '新人', portrait: defaultPortrait, gender: getHero(defaultPortrait).gender });
  const [muted, setMuted] = useState(false);
  const [match, setMatch] = useState(createMatch);
  const [loadedArchive] = useState(loadArchive);
  const [archive, setArchive] = useState(loadedArchive.archive);
  const archiveRef = useRef(loadedArchive.archive);
  const [storageError, setStorageError] = useState(loadedArchive.error);
  const [rewards, setRewards] = useState({});
  const audio = useAudio(muted);
  useEffect(() => {
    audio.setMusic(phase === 'game' ? 'bgm.table' : 'bgm.home');
  }, [audio, phase]);
  /** 长期数据在规则外保存；同一事件和同一终局重复渲染不会重复奖励。 */
  const onProgress = useCallback(game => {
    if (loadedArchive.readOnly) return;
    const before = archiveRef.current;
    const result = syncArchive(before, game);
    if (!result.changed) return;
    archiveRef.current = result.archive;
    setArchive(result.archive);
    setStorageError(saveArchive(result.archive).error);
    const discovered = result.archive.discovered.filter(id => !before.discovered.includes(id));
    if (discovered.length || result.newAchievements.length || result.newUnlocks.length) setRewards(current => {
      const previous = current[game.id] || { discovered: [], achievements: [], unlocked: [] };
      return { ...current, [game.id]: {
        discovered: [...new Set([...previous.discovered, ...discovered])],
        achievements: [...new Set([...previous.achievements, ...result.newAchievements])],
        unlocked: [...new Set([...previous.unlocked, ...result.newUnlocks])],
      } };
    });
  }, [loadedArchive.readOnly]);
  useEffect(() => {
    // 手机结算页较长，切换页面时回到顶部，避免首页沿用上一页的滚动位置。
    window.scrollTo({ top: 0 });
  }, [phase]);
  const goHome = () => setPhase('home');
  const startMatch = (nextMatch, cycle = 1) => {
    setMatch({ ...nextMatch, cycle, storyRunId: crypto.randomUUID(), unlockedContent: archive.unlockedContent });
    setPhase('setup');
  };
  if (phase === 'archive') return <ArchiveScreen archive={archive} onHome={goHome} storageError={storageError} onSelectTitle={id => {
    if (loadedArchive.readOnly || id && !archive.titles.includes(id)) return;
    const next = { ...archive, selectedTitle: id };
    archiveRef.current = next; setArchive(next); setStorageError(saveArchive(next).error);
  }} />;
  if (phase === 'home') return <Home initialMode={match.mode} archive={archive} storageError={storageError} onArchive={() => setPhase('archive')} onNewCycle={() => startMatch(createMatch('story'), archive.cyclesCompleted + 1)} onStart={startMatch} muted={muted} setMuted={setMuted}/>;
  if (phase === 'setup') return <ProfileSetup profile={profile} setProfile={setProfile} match={match} unlockedContent={archive.unlockedContent} onHome={goHome} onNext={() => setPhase(match.mode === 'story' ? 'story' : 'game')}/>;
  if (phase === 'story') return <StoryIntro key={match.chapterIndex} profile={profile} chapterIndex={match.chapterIndex} onHome={goHome} onStart={() => setPhase('game')}/>;
  const players = createPlayers({ ...profile, selectedTitle: archive.selectedTitle }, match.playerCount, match);
  const continueStory = game => {
    // 晋级也校验真实终局和排名，不能只凭界面按钮跳到下一章。
    if (game.stage !== 'finished' || game.match.mode !== 'story' || placeOf(game) !== 1 || match.chapterIndex >= STORY_CHAPTERS.length - 1) return;
    setMatch({ ...createMatch('story', { chapterIndex: match.chapterIndex + 1 }), cycle: match.cycle, storyRunId: match.storyRunId, unlockedContent: archive.unlockedContent });
    setPhase('story');
  };
  return <Game key={`${match.mode}-${match.chapterIndex}`} players={players} match={match} profile={profile} archive={archive} rewards={rewards} storageError={storageError} onProgress={onProgress} muted={muted} setMuted={setMuted} audio={audio} onHome={goHome} onContinue={continueStory}/>;
}

createRoot(document.getElementById('root')).render(<App/>);
