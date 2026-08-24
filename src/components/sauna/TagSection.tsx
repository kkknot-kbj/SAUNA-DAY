import { Icon } from '@/components/ui/Icon';
import { CATEGORY_LABELS, iconOf, labelOf } from '@/lib/taxonomy/terms';
import { UNKNOWN } from '@/lib/utils/format';

import type { TagRef, TaxonomyCategory } from '@/lib/types';

/** 指定カテゴリのタグを並べる。該当がなければ「不明」 */
export function TagSection({
  category,
  tags,
  title,
}: {
  category: TaxonomyCategory;
  tags: TagRef[];
  title?: string;
}) {
  const matched = tags.filter((ref) => ref.category === category);

  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="text-[14px] text-ink">{title ?? CATEGORY_LABELS[category]}</h3>
      {matched.length === 0 ? (
        <p className="text-[14px] text-ink-faint">{UNKNOWN}</p>
      ) : (
        <ul className="flex flex-wrap gap-x-5 gap-y-2.5">
          {matched.map((ref) => (
            <li key={`${ref.category}:${ref.key}`} className="flex items-center gap-1.5">
              <Icon name={iconOf(ref)} size={16} className="text-ink-muted" />
              <span className="text-[14px] text-ink">{labelOf(ref)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
