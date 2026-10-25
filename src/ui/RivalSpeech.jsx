import { useLayoutEffect, useRef, useState } from 'react';
import { Avatar } from './PaperPrimitives';
import '../styles/rival-speech.css';

/** 稳定预留台词空间；可见头像有指向，离屏同桌通过姓名和小头像辨认。 */
export default function RivalSpeech({ speech, players }) {
  const lane = useRef(null);
  const bubble = useRef(null);
  const [position, setPosition] = useState(null);
  const speaker = players.find(player => player.id === speech?.speakerId);

  useLayoutEffect(() => {
    if (!speaker) return undefined;
    const measure = () => {
      const area = lane.current;
      if (!area || !bubble.current) return;
      const row = area.parentElement.querySelector('.paper-rivals');
      const anchor = [...row.querySelectorAll('[data-effect-player]')].find(element => element.dataset.effectPlayer === speaker.id);
      const avatar = anchor?.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const bounds = area.getBoundingClientRect();
      const width = bubble.current.getBoundingClientRect().width;
      const center = avatar ? avatar.left + avatar.width / 2 : bounds.left + bounds.width / 2;
      const attached = Boolean(avatar && center >= Math.max(bounds.left, rowRect.left) && center <= Math.min(bounds.right, rowRect.right));
      const left = Math.max(4, Math.min(bounds.width - width - 4, (attached ? center - bounds.left : bounds.width / 2) - width / 2));
      setPosition({ left, tail: Math.max(14, Math.min(width - 14, center - bounds.left - left)), attached });
    };
    measure();
    window.addEventListener('resize', measure);
    // 大桌的横向滚动不应裁掉气泡，也不应为闲聊自动滚走当前行动者。
    window.addEventListener('scroll', measure, true);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(lane.current);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [speaker?.id, speech?.id]);

  return <div ref={lane} className="paper-banter-lane" role="status" aria-live="polite" aria-atomic="true">
    {speaker && <div ref={bubble} key={speech.id} className={`paper-speech-bubble ${position?.attached ? 'is-attached' : ''}`} data-speaker-id={speaker.id} style={{ left: position?.left, '--speech-tail': `${position?.tail || 20}px` }}>
      <Avatar portrait={speaker.portrait} name={speaker.name} />
      <div><b>{speaker.name}</b><p>{speech.text}</p></div>
    </div>}
  </div>;
}
