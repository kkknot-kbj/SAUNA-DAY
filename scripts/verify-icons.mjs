/**
 * 使用している lucide アイコン名が実在するか検証する。
 *
 * 検証対象：
 *   1. src/lib/taxonomy/terms.ts の語彙定義（t(...) の第4引数）
 *   2. src/ 配下の <Icon name="..." /> と icon="..." / icon: '...'
 *
 * 存在しない名前は Icon コンポーネントが Tag にフォールバックするため
 * 実行時に気づきにくい。ここで落とす。
 *
 * 使い方: node scripts/verify-icons.mjs
 */
import * as lucide from 'lucide-react';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../src', import.meta.url));

/** 語彙定義でアイコン名が入る位置を狙う */
const TAXONOMY_PATTERN = /t\(\s*'[^']+',\s*'[^']+',\s*'[^']+',\s*'([A-Za-z0-9]+)'/g;

/** JSX と オブジェクトリテラルでのアイコン指定 */
const USAGE_PATTERNS = [
  /<Icon\s+[^>]*name=(?:"([A-Za-z0-9]+)"|\{'([A-Za-z0-9]+)'\})/g,
  /\bicon=(?:"([A-Za-z0-9]+)"|\{'([A-Za-z0-9]+)'\})/g,
  /\bicon:\s*'([A-Za-z0-9]+)'/g,
];

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      files.push(...walk(path));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(path);
    }
  }
  return files;
}

/** name={variable} のような動的指定は静的検証できない。件数だけ数える */
const DYNAMIC_PATTERN = /<Icon\s+[^>]*name=\{(?!')/g;

const found = new Map(); // name -> Set<file>
let dynamicCount = 0;

function record(name, file) {
  const entry = found.get(name) ?? new Set();
  entry.add(file.replace(`${SRC}\\`, '').replace(`${SRC}/`, ''));
  found.set(name, entry);
}

for (const file of walk(SRC)) {
  const source = readFileSync(file, 'utf8');

  if (file.endsWith('terms.ts')) {
    for (const match of source.matchAll(TAXONOMY_PATTERN)) {
      record(match[1], file);
    }
  }

  for (const pattern of USAGE_PATTERNS) {
    for (const match of source.matchAll(pattern)) {
      const name = match[1] ?? match[2];
      if (name !== undefined) record(name, file);
    }
  }

  dynamicCount += [...source.matchAll(DYNAMIC_PATTERN)].length;
}

const names = [...found.keys()].sort();
const missing = names.filter((name) => !(name in lucide));

console.log(`icon names referenced: ${names.length}`);
console.log(`dynamic (name={expr}) usages, not statically checked: ${dynamicCount}`);

if (missing.length > 0) {
  console.log(`\nMISSING (${missing.length}):`);
  for (const name of missing) {
    console.log(`  ${name}  <- ${[...(found.get(name) ?? [])].join(', ')}`);
  }
  process.exit(1);
}

console.log('all referenced icon names exist in lucide-react');
