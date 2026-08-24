import Link from 'next/link';

import { Icon } from '@/components/ui/Icon';
import { isSameTag } from '@/lib/types';
import { pathWithConditions } from '@/lib/state/conditions-url';

import type { RelaxSuggestion, SearchConditions } from '@/lib/types';

/** 提案を適用した条件を組み立てる */
function applySuggestion(
  conditions: SearchConditions,
  suggestion: RelaxSuggestion,
): SearchConditions {
  switch (suggestion.kind) {
    case 'travel_time':
      return {
        ...conditions,
        required: {
          ...conditions.required,
          maxTravelMinutes:
            conditions.required.maxTravelMinutes === null || suggestion.delta === null
              ? conditions.required.maxTravelMinutes
              : conditions.required.maxTravelMinutes + suggestion.delta,
        },
      };

    case 'budget':
      return {
        ...conditions,
        required: {
          ...conditions.required,
          budgetMax:
            conditions.required.budgetMax === null || suggestion.delta === null
              ? conditions.required.budgetMax
              : conditions.required.budgetMax + suggestion.delta,
        },
      };

    case 'drop_all_must_tags':
      // すべて希望に落とす。除外はやめるが一致率には残す
      return {
        required: { ...conditions.required, absoluteTags: [] },
        wish: { tags: [...conditions.wish.tags, ...conditions.required.absoluteTags] },
      };

    case 'drop_must_tag': {
      const dropped = suggestion.droppedTag;
      if (dropped === null) return conditions;
      // 必須から外し、希望として残す（一致率には引き続き反映する）
      return {
        required: {
          ...conditions.required,
          absoluteTags: conditions.required.absoluteTags.filter(
            (ref) => !isSameTag(ref, dropped),
          ),
        },
        wish: {
          tags: conditions.wish.tags.some((ref) => isSameTag(ref, dropped))
            ? conditions.wish.tags
            : [...conditions.wish.tags, dropped],
        },
      };
    }

    case 'drop_wish_tag': {
      const dropped = suggestion.droppedTag;
      if (dropped === null) return conditions;
      return {
        ...conditions,
        wish: { tags: conditions.wish.tags.filter((ref) => !isSameTag(ref, dropped)) },
      };
    }
  }
}

type RelaxSuggestionsProps = {
  suggestions: RelaxSuggestion[];
  conditions: SearchConditions;
};

/**
 * 条件緩和の提示（要件9）。
 *
 * 「あと30分移動できれば、条件一致10/10が3件あります」の形で具体的に伝える。
 * 押すと緩和後の結果へ移動する。
 */
export function RelaxSuggestions({ suggestions, conditions }: RelaxSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2">
      {suggestions.map((suggestion) => {
        const href = pathWithConditions('/search/results', applySuggestion(conditions, suggestion));
        const ratio = suggestion.bestMatchRatio;
        const showRatio = !ratio.startsWith('0/0');

        return (
          <li key={`${suggestion.kind}-${suggestion.label}`}>
            <Link
              href={href}
              className="flex min-h-[56px] items-center justify-between gap-3 rounded-md border border-line bg-base px-4 py-3 hover:border-accent"
            >
              <span className="text-[14px] text-ink">
                {suggestion.label}、
                {showRatio ? (
                  <>
                    条件一致 <span className="nums">{ratio}</span> が{' '}
                  </>
                ) : null}
                <span className="nums">{suggestion.additionalCount}</span> 件あります
              </span>
              <Icon name="ChevronRight" size={20} className="shrink-0 text-ink-faint" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
