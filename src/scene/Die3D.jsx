import '../styles/die.css';

/** 点数到旋转角度的映射,6 个面分别放在立方体的哪个表面。 */
const ROTATIONS = {
  1: 'rotateY(0deg) rotateX(0deg)', // 前
  2: 'rotateY(-90deg)', // 右
  3: 'rotateX(-90deg)', // 顶
  4: 'rotateX(90deg)', // 底
  5: 'rotateY(90deg)', // 左
  6: 'rotateY(180deg)', // 后
};

/** SVG 点数图案:3×3 格,圆心坐标。点数 1 与 4 的中央点是红色。 */
const DOT_GRID = [
  [8, 8],
  [24, 8],
  [40, 8],
  [8, 24],
  [24, 24],
  [40, 24],
  [8, 40],
  [24, 40],
  [40, 40],
];
const PATTERNS = {
  1: [4], // 中央一个红点
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8], // 四角,全红
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function DieDots({ value }) {
  const dots = PATTERNS[value] ?? [];
  const isRed = value === 1 || value === 4;
  return (
    <svg className="die__svg" viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" fill="var(--color-cream)" rx="6" />
      {dots.map((i) => {
        const [cx, cy] = DOT_GRID[i];
        const red = isRed && (value === 1 ? i === 4 : true);
        return <circle key={i} className={red ? 'die__dot--red' : 'die__dot'} cx={cx} cy={cy} r="5" />;
      })}
    </svg>
  );
}

/**
 * 3D 骰子:CSS 立方体,6 个 SVG 面。
 * @param {object} props
 * @param {number} props.value 点数 1 到 6
 * @param {boolean} [props.tumbling] 是否正在翻滚(抛出阶段)
 * @param {boolean} [props.settling] 正在落定(过渡到最终角度)
 * @param {number} [props.index] 骰子序号,用于翻滚动画差异
 * @param {boolean} [props.highlight] 4 点落定时的红光
 */
export default function Die3D({ value, tumbling, settling, index = 0, highlight }) {
  const rotation = ROTATIONS[value] ?? ROTATIONS[1];
  const cubeClass = [
    'die__cube',
    tumbling && 'is-tumbling',
    settling && 'is-settling',
  ].filter(Boolean).join(' ');
  const style = {
    transform: rotation,
    ...(tumbling && { animationName: `tumble-die-${index % 6}` }),
  };
  const dieClass = ['die', highlight && 'die--highlight'].filter(Boolean).join(' ');

  const faces = [
    ['front', 1],
    ['right', 2],
    ['top', 3],
    ['bottom', 4],
    ['left', 5],
    ['back', 6],
  ];

  return (
    <div className={dieClass} role="img" aria-label={`骰子 ${value} 点`}>
      <div className={cubeClass} style={style}>
        {faces.map(([pos, v]) => (
          <div key={pos} className={`die__face die__face--${pos}`}>
            <DieDots value={v} />
          </div>
        ))}
      </div>
    </div>
  );
}
