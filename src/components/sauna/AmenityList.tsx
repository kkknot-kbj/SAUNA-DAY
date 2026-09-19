import { Icon } from '@/components/ui/Icon';

import type { Amenity } from '@/lib/types';

/**
 * 宿の設備一覧。
 * lucide アイコン + ラベルのグリッド。絵文字は使わない。
 */
export function AmenityList({ amenities }: { amenities: Amenity[] }) {
  if (amenities.length === 0) {
    return <p className="text-[13px] text-ink-faint">設備の情報はありません</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
      {amenities.map((a) => (
        <li key={a.key} className="flex items-center gap-2.5">
          <Icon name={a.icon} size={20} className="shrink-0 text-ink-muted" />
          <span className="text-[14px] text-ink">{a.label}</span>
        </li>
      ))}
    </ul>
  );
}
