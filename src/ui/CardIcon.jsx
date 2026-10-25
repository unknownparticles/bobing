import {
  Sparkles, Coins, GraduationCap, Wallet, Trees, Flame, Swords, HeartPulse,
  HeartHandshake, Crown, CloudLightning, CloudRain, RotateCcw, Hand, Shield,
  DoorOpen, Zap, Dice1, Dice2, Cherry, Paintbrush, Dice6, Fingerprint, Plus,
  Minus, FlipVertical2, Copy, ScanFace, Ticket, CloudDrizzle, Scissors,
  Gift, ArrowLeftRight, Scale, Feather, WandSparkles, Undo2, UserRound,
  Flag, MoveHorizontal, Shuffle, Ban, PackageOpen, Recycle, CornerUpLeft,
  Orbit, MoveRight, ListOrdered, Pentagon, Star, Octagon, Hexagon, Sun,
  Eclipse, Sprout, Wheat, LogIn, LogOut,
} from 'lucide-react';

const icons = {
  fortune: Sparkles, wealth: Coins, scholar: GraduationCap, salary: Wallet,
  land: Trees, kitchen: Flame, guardian: Swords, longevity: HeartPulse,
  matchmaker: HeartHandshake, champion: Crown, thunder: CloudLightning, unlucky: CloudRain,
  reroll: RotateCcw, steal: Hand, protect: Shield, toilet: DoorOpen, miracle: Zap,
  reroll_one: Dice1, reroll_two: Dice2, keep_red: Cherry, paint_red: Paintbrush,
  set_six: Dice6, set_one: Fingerprint, plus_one: Plus, minus_one: Minus,
  flip: FlipVertical2, copy_face: Copy, mirror: ScanFace, lucky_note: Ticket,
  unlucky_note: CloudDrizzle, disarm: Scissors, gift: Gift, exchange: ArrowLeftRight,
  equal_coins: Scale, cleanse: Feather, exorcism: WandSparkles, reflect: Undo2,
  summon_god: LogIn, dismiss_god: LogOut,
  substitute: UserRound, priority: Flag, swap_seat: MoveHorizontal, swap_others: Shuffle,
  seal: Ban, lucky_bag: PackageOpen, recycle: Recycle, reverse: CornerUpLeft,
  shuffle: Orbit, rotate: MoveRight, leader_last: ListOrdered, five_dice: Pentagon,
  seven_dice: Star, eight_dice: Octagon, six_dice: Hexagon, red_table: Sun,
  black_table: Eclipse, small_table: Sprout, harvest: Wheat,
  gather_luck: Sprout, secure_loot: Shield, forecast_three: ListOrdered, forecast_one: Crown,
  bitter_sweet: Flame, never_too_late: HeartPulse, old_master: GraduationCap, double_steal: Swords,
  thief_god: Hand, geomancer: Orbit, luck_blessing: Sparkles, lucky_seat: Cherry, four_twos: Dice2,
};

/** 每张牌使用独立 SVG 图案；图形是装饰，名称由相邻文本提供。 */
export default function CardIcon({ id, size = 48, className = '' }) {
  const Icon = icons[id] || Sparkles;
  return <span className={`card-symbol ${className}`} aria-hidden="true" style={{ '--symbol-size': `${size}px` }}>
    <svg className="card-symbol-frame" viewBox="0 0 120 120" fill="none"><path d="M60 5 115 60 60 115 5 60Z"/><circle cx="60" cy="60" r="45"/><path d="M17 28h13M23.5 21.5v13M90 92h13M96.5 85.5v13"/><path d="M42 10q18 9 36 0M42 110q18-9 36 0"/></svg>
    <Icon size={size} strokeWidth={1.45}/>
  </span>;
}
