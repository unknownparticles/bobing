import { ArrowRight, Check, Dices } from 'lucide-react';
import { evaluateDice } from '../game/rules';
import { Die } from './PaperPrimitives';
import '../styles/dice-presentation.css';

/** 只展示已经揭晓的真实候选和改点过程，不提前泄露未播放的组或最终选组。 */
export default function DicePresentation({ presentation }) {
  if (!presentation) return null;
  const { phase, title, candidates = [], revealedCount = 0, selectedIndex, selection, before, after, changedIndices = [] } = presentation;
  const comparing = ['comparison', 'complete', 'changing', 'changed'].includes(phase);
  const multiple = candidates.length > 1;
  const changing = before && after;
  if (!multiple && !changing && !['rolling', 'holding'].includes(phase)) return null;
  return <section className="dice-presentation" aria-label="掷骰效果过程" data-phase={phase}>
    <p className="dice-presentation-title" role="status"><Dices size={15} /><span>{title || `${selection === 'worst' ? '取较差结果' : '取较好结果'} · 保留第 ${selectedIndex + 1} 组`}</span></p>
    {multiple && <ol className="dice-candidates">{candidates.map((dice, index) => {
      const revealed = index < revealedCount;
      const chosen = comparing && index === selectedIndex;
      return <li key={index} className={`${chosen ? 'is-kept' : ''} ${comparing && !chosen ? 'is-discarded' : ''} ${!revealed ? 'is-pending' : ''}`}>
        <span className="dice-candidate-number">第 {index + 1} 组</span>
        <div className="dice-candidate-dice">{revealed ? dice.map((value, dieIndex) => <Die key={dieIndex} value={value} />) : <span>{index === presentation.candidateIndex ? '投掷中…' : '等待投掷'}</span>}</div>
        <b>{revealed ? evaluateDice(dice).label : '待揭晓'}</b>
        <small>{comparing ? chosen ? <><Check size={12} />保留</> : '舍弃' : revealed ? '已落定' : '待投掷'}</small>
      </li>;
    })}</ol>}
    {changing && <div className="dice-face-changes" aria-label="改点前后对比">{changedIndices.length ? changedIndices.map(index => <span key={index}><small>第 {index + 1} 颗</small><Die value={before[index]} /><ArrowRight size={13} /><Die value={after[index]} /></span>) : <span>点数相同，本次结果保持</span>}</div>}
  </section>;
}
