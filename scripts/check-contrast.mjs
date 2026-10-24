#!/usr/bin/env node
/**
 * 对比度校验入口:读取 tokens.css 与 contrast-pairs.json,
 * 任一配对不达标则以退出码 1 结束并列出这些配对。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { checkPairs, parseColorTokens } from './contrast-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(resolve(root, 'src/styles/tokens.css'), 'utf8');
const pairs = JSON.parse(readFileSync(resolve(root, 'scripts/contrast-pairs.json'), 'utf8'));

const { results, failures } = checkPairs(pairs, parseColorTokens(css));

for (const r of results) {
  const ratio = r.ratio === null ? '  n/a' : r.ratio.toFixed(2).padStart(5);
  console.log(`${r.ok ? 'PASS' : 'FAIL'} ${ratio} (需要 ${r.min})  ${r.fg} on ${r.bg}  ${r.note ?? ''}${r.reason ? ' - ' + r.reason : ''}`);
}

if (failures.length > 0) {
  console.error(`\n${failures.length} 个配对未达标`);
  process.exit(1);
}
console.log(`\n全部 ${results.length} 个配对达标`);
