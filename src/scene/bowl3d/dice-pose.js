const FACE_ROTATIONS = {
  1: [0, 0], 6: [Math.PI, 0],
  2: [-Math.PI / 2, 0], 5: [Math.PI / 2, 0],
  3: [0, Math.PI / 2], 4: [0, -Math.PI / 2],
};

/**
 * 将规则给出的点数变成碗内姿态，不产生游戏随机数。
 * rotation 使用 Three.js 的 YXZ 顺序；支持现有场地的 4–8 骰。
 */
export function dicePose({ value, index, count, rolling = false, time = 0, reducedMotion = false }) {
  const columns = count <= 4 ? 2 : count <= 6 ? 3 : 4;
  const row = Math.floor(index / columns);
  const rowCount = Math.min(columns, count - row * columns);
  const x = (index % columns - (rowCount - 1) / 2) * (count > 6 ? .6 : .64);
  const z = (row - .5) * .72 + Math.sin(index * 2.1) * .045;
  const [rx, rz] = FACE_ROTATIONS[value];
  const yaw = [.18, -.22, .36, -.14, .27, -.32, .12, -.18][index];
  const position = [x, .635, z];
  const rotation = [rx, yaw, rz];
  if (rolling && !reducedMotion) {
    const phase = time * 12 + index * 1.7;
    position[0] += Math.sin(phase) * .085;
    position[1] += Math.abs(Math.sin(phase * .8)) * .48;
    position[2] += Math.cos(phase) * .075;
    rotation[0] += time * 11 + index;
    rotation[1] += time * 8;
    rotation[2] += time * 9;
  }
  return { position, rotation };
}
