/**
 * 对比度计算与令牌解析(纯函数,便于测试)。
 * 公式来自 WCAG 2.x 的相对亮度与对比度定义。
 */

/** 解析 #rgb 或 #rrggbb,返回 [r,g,b](0-255);格式不对返回 null。 */
export function parseHex(hex) {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

/** WCAG 相对亮度。 */
export function luminance([r, g, b]) {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** 两个 RGB 颜色的对比度,范围 1 到 21。 */
export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** 从 CSS 文本提取 `--color-*: #hex` 令牌,返回 { 名称(不含 --): hex }。 */
export function parseColorTokens(css) {
  const out = {};
  const re = /--(color-[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\s*;/g;
  for (const m of css.matchAll(re)) out[m[1]] = m[2];
  return out;
}

/** 从 CSS 文本提取 `--font-size-*: Npx` 令牌,返回 { 名称: 数值 }。 */
export function parseFontSizeTokens(css) {
  const out = {};
  const re = /--(font-size-[a-z0-9-]+)\s*:\s*([\d.]+)px\s*;/g;
  for (const m of css.matchAll(re)) out[m[1]] = Number(m[2]);
  return out;
}

/**
 * 校验配对。pairs: [{ fg, bg, min, note? }],tokens: parseColorTokens 的结果。
 * 返回 { results, failures };令牌缺失或格式错误也算失败。
 */
export function checkPairs(pairs, tokens) {
  const results = pairs.map((p) => {
    const fg = tokens[p.fg] && parseHex(tokens[p.fg]);
    const bg = tokens[p.bg] && parseHex(tokens[p.bg]);
    if (!fg || !bg) {
      return { ...p, ratio: null, ok: false, reason: '令牌缺失或不是合法的十六进制颜色' };
    }
    const ratio = contrastRatio(fg, bg);
    return { ...p, ratio, ok: ratio >= p.min };
  });
  return { results, failures: results.filter((r) => !r.ok) };
}
