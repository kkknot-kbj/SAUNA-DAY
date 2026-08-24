import { Icon } from '@/components/ui/Icon';
import { iconOf, labelOf } from '@/lib/taxonomy/terms';
import { UNKNOWN } from '@/lib/utils/format';

import type { Proximity, SaunaEnvironment } from '@/lib/types';

/** 近接度の表示。「入れる」かどうかとは別の情報であることが伝わる語にする */
const PROXIMITY_LABELS: Record<Proximity, string> = {
  on_site: '敷地内',
  nearby: '徒歩圏',
  view_only: '眺められる',
};

/**
 * 施設の周囲にある自然（要件4-3, 4-6）。
 *
 * IMPORTANT: ここは「近くにある・見える」だけを表す。
 * 実際に入れるかどうかは CooldownList が担う。
 */
export function EnvironmentList({ environments }: { environments: SaunaEnvironment[] }) {
  if (environments.length === 0) {
    return <p className="text-[14px] text-ink-faint">{UNKNOWN}</p>;
  }

  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2.5">
      {environments.map((environment) => {
        const ref = { category: 'environment' as const, key: environment.key };
        return (
          <li key={environment.key} className="flex items-center gap-1.5">
            <Icon name={iconOf(ref)} size={16} className="text-ink-muted" />
            <span className="text-[14px] text-ink">{labelOf(ref)}</span>
            <span className="text-[12px] text-ink-faint">
              {PROXIMITY_LABELS[environment.proximity]}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
