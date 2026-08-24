'use client';

import { Chip } from '@/components/ui/Chip';
import { CATEGORY_HINTS, CATEGORY_LABELS, termsOf } from '@/lib/taxonomy/terms';

import type { TagLevel, TagRef, TaxonomyCategory } from '@/lib/types';

/**
 * どの項目を出すか。
 * - basic: 初期表示する項目（isAdvanced = false）
 * - advanced: 「条件を追加」で初めて出す項目（isAdvanced = true）
 * - all: すべて
 *
 * basic と advanced を組み合わせても重複しないようにするための区別。
 */
type ChipGroupMode = 'basic' | 'advanced' | 'all';

type ChipGroupProps = {
  category: TaxonomyCategory;
  levelOf: (tag: TagRef) => TagLevel;
  onCycle: (tag: TagRef) => void;
  mode?: ChipGroupMode;
};

/**
 * カテゴリ単位の選択肢。
 *
 * 語彙定義（@/lib/taxonomy/terms.ts）から生成する。
 * IMPORTANT: 画面に日本語ラベルをハードコードしない。
 */
export function ChipGroup({ category, levelOf, onCycle, mode = 'basic' }: ChipGroupProps) {
  const terms = termsOf(category).filter((term) => {
    if (mode === 'all') return true;
    return mode === 'advanced' ? term.isAdvanced : !term.isAdvanced;
  });

  // 該当項目がなければ見出しも出さない
  if (terms.length === 0) return null;

  const hint = CATEGORY_HINTS[category];

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline gap-2">
        <h3 className="text-[14px] text-ink">{CATEGORY_LABELS[category]}</h3>
        {/* 「近くにある」と「入れる」の違いをここで伝える */}
        {hint !== undefined ? (
          <span className="text-[12px] text-ink-faint">{hint}</span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {terms.map((term) => {
          const tag: TagRef = { category: term.category, key: term.key };
          return (
            <Chip
              key={term.key}
              label={term.labelJa}
              icon={term.icon}
              level={levelOf(tag)}
              onCycle={() => onCycle(tag)}
            />
          );
        })}
      </div>
    </div>
  );
}
