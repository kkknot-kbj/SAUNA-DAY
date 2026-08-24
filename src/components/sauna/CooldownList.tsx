import { Icon } from '@/components/ui/Icon';
import { iconOf, labelOf } from '@/lib/taxonomy/terms';
import { UNKNOWN, formatBoolean, formatDepth, formatTempRange } from '@/lib/utils/format';

import type { Cooldown } from '@/lib/types';

/**
 * クールダウン体験（要件10-3）。
 *
 * IMPORTANT: canDive などの boolean は null（不明）と false（不可）を区別する。
 * 「不明」を「不可」として表示してはいけない。
 */
export function CooldownList({ cooldowns }: { cooldowns: Cooldown[] }) {
  if (cooldowns.length === 0) {
    return <p className="text-[14px] text-ink-faint">{UNKNOWN}</p>;
  }

  return (
    <ul className="flex flex-col gap-5">
      {cooldowns.map((cooldown) => {
        const ref = { category: 'cooldown' as const, key: cooldown.key };
        const temp =
          cooldown.waterTempMin === null && cooldown.waterTempMax === null
            ? null
            : formatTempRange(cooldown.waterTempMin, cooldown.waterTempMax);

        return (
          <li key={cooldown.key} className="flex flex-col gap-2 border-b border-line pb-4">
            <div className="flex items-center gap-1.5">
              <Icon name={iconOf(ref)} size={20} className="text-ink-muted" />
              <span className="text-[15px] text-ink">{labelOf(ref)}</span>
            </div>

            <dl className="flex flex-wrap gap-x-6 gap-y-1.5 text-[13px]">
              <div className="flex gap-2">
                <dt className="text-ink-muted">水温</dt>
                <dd className={temp === null ? 'text-ink-faint' : 'nums text-ink'}>
                  {temp ?? UNKNOWN}
                </dd>
              </div>

              <div className="flex gap-2">
                <dt className="text-ink-muted">水深</dt>
                <dd className={cooldown.depthCm === null ? 'text-ink-faint' : 'nums text-ink'}>
                  {formatDepth(cooldown.depthCm)}
                </dd>
              </div>

              <div className="flex gap-2">
                <dt className="text-ink-muted">飛び込み</dt>
                <dd className={cooldown.canDive === null ? 'text-ink-faint' : 'text-ink'}>
                  {formatBoolean(cooldown.canDive, { yes: '可', no: '不可' })}
                </dd>
              </div>

              <div className="flex gap-2">
                <dt className="text-ink-muted">天然水</dt>
                <dd className={cooldown.isNatural === null ? 'text-ink-faint' : 'text-ink'}>
                  {formatBoolean(cooldown.isNatural, { yes: 'はい', no: 'いいえ' })}
                </dd>
              </div>

              <div className="flex gap-2">
                <dt className="text-ink-muted">流れ</dt>
                <dd className={cooldown.hasFlow === null ? 'text-ink-faint' : 'text-ink'}>
                  {formatBoolean(cooldown.hasFlow, { yes: 'あり', no: 'なし' })}
                </dd>
              </div>
            </dl>

            {cooldown.note !== null ? (
              <p className="text-[13px] text-ink-muted">{cooldown.note}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
