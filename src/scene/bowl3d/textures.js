import { CanvasTexture, SRGBColorSpace } from 'three';

const PIPS = {
  1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'));
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** 生成红釉底色、金色缠枝花与回纹边；展开纹理环绕真实碗壁。 */
export function createBowlTexture(inner = false) {
  return canvasTexture(2048, 512, ctx => {
    const red = ctx.createLinearGradient(0, 0, 0, 512);
    red.addColorStop(0, inner ? '#67121b' : '#691019');
    red.addColorStop(.45, '#95151e');
    red.addColorStop(1, '#b62329');
    ctx.fillStyle = red;
    ctx.fillRect(0, 0, 2048, 512);
    ctx.strokeStyle = '#e9be63';
    ctx.fillStyle = '#e9be63';
    ctx.lineWidth = 3;
    const border = inner ? 455 : 70;
    [border, border + 13, 478, 489].forEach(y => {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(2048, y); ctx.stroke();
    });
    // 内壁留出整洁的碗底，花纹只围在口沿附近，避免干扰骰点。
    const centerY = inner ? 414 : 270;
    const size = inner ? 25 : 58;
    for (let index = 0; index < 16; index++) {
      const x = index * 128 + 64;
      ctx.save();
      ctx.translate(x, centerY);
      for (let petal = 0; petal < 8; petal++) {
        ctx.save(); ctx.rotate(petal * Math.PI / 4);
        ctx.beginPath(); ctx.ellipse(0, -size * .48, size * .18, size * .5, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath(); ctx.arc(0, 0, size * .16, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(size * .7, 8);
      ctx.bezierCurveTo(90, -size, 94, size, 128, 8);
      ctx.stroke();
      ctx.beginPath(); ctx.ellipse(90, -8, 13, 5, -.7, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    for (let x = 0; x < 2048; x += 32) {
      ctx.strokeRect(x + 5, border + 22, 22, 18);
      // 用釉色覆盖开口，避免纹理透明导致碗壁漏光。
      ctx.fillStyle = '#bd2a31'; ctx.fillRect(x + 13, border + 21, 7, 5); ctx.fillStyle = '#e9be63';
    }
  });
}

/** 象牙骰面上的凹点：一、四为朱红，其余为墨色；六面共用这组纹理。 */
export function createDieTextures() {
  return Array.from({ length: 6 }, (_, index) => canvasTexture(256, 256, ctx => {
    ctx.fillStyle = '#fff5dc'; ctx.fillRect(0, 0, 256, 256);
    for (const [x, y] of PIPS[index + 1]) {
      const cx = 128 + x * 64;
      const cy = 128 + y * 64;
      const shade = ctx.createRadialGradient(cx - 3, cy - 4, 1, cx, cy, 20);
      const red = index === 0 || index === 3;
      shade.addColorStop(0, red ? '#a72229' : '#28332e');
      shade.addColorStop(.78, red ? '#bd3032' : '#3d4940');
      shade.addColorStop(1, red ? '#db7c63' : '#8f9380');
      ctx.fillStyle = shade; ctx.beginPath(); ctx.arc(cx, cy, 19, 0, Math.PI * 2); ctx.fill();
    }
  }));
}

/** 接触阴影使用透明径向纹理，避免透明场景出现矩形地板。 */
export function createShadowTexture() {
  return canvasTexture(128, 128, ctx => {
    const gradient = ctx.createRadialGradient(64, 64, 12, 64, 64, 64);
    gradient.addColorStop(0, '#39201670'); gradient.addColorStop(.6, '#39201635'); gradient.addColorStop(1, '#39201600');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
  });
}
