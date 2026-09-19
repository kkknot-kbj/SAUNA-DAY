import { TempGauge } from '@/components/sauna/TempGauge';
import { Icon } from '@/components/ui/Icon';
import { findTerm, iconOf, labelOf } from '@/lib/taxonomy/terms';

import type { Cooldown, TagRef } from '@/lib/types';

type SaunaSpecProps = {
  /** サウナ室温度 */
  tempMin: number | null;
  tempMax: number | null;
  /** features からタイプ・熱源を拾う */
  features: TagRef[];
  cooldowns: Cooldown[];
};

/** features から指定カテゴリのタグを1件返す */
function pickFeature(features: TagRef[], category: string): TagRef | null {
  return features.find((f) => f.category === category) ?? null;
}

/** 最も冷たいクールダウンを返す（水温 min が最小のもの） */
function coldestCooldown(cooldowns: Cooldown[]): Cooldown | null {
  const withTemp = cooldowns.filter((c) => c.waterTempMin !== null);
  if (withTemp.length === 0) return cooldowns[0] ?? null;
  return withTemp.reduce((a, b) =>
    (a.waterTempMin ?? Infinity) <= (b.waterTempMin ?? Infinity) ? a : b,
  );
}

/**
 * サウナの主要スペックを一目でわかる形にまとめる。
 *
 * タグの羅列で埋もれていた「熱源・タイプ・温度」を先頭に大きく置き、
 * 温度はゲージで熱さ・冷たさの度合いを視覚化する。
 */
export function SaunaSpec({ tempMin, tempMax, features, cooldowns }: SaunaSpecProps) {
  const type = pickFeature(features, 'sauna_type');
  const heat = pickFeature(features, 'heat_source');
  const cold = coldestCooldown(cooldowns);

  return (
    <div className="flex flex-col gap-6 rounded-md border border-line bg-base p-4">
      {/* タイプ・熱源を大きなバッジで */}
      <div className="flex flex-wrap gap-3">
        {type !== null ? (
          <SpecBadge icon={iconOf(type)} caption="タイプ" value={labelOf(type)} />
        ) : null}
        {heat !== null ? (
          <SpecBadge icon={iconOf(heat)} caption="熱源" value={labelOf(heat)} />
        ) : null}
      </div>

      {/* 温度ゲージ */}
      <div className="flex flex-col gap-5">
        <TempGauge
          label="サウナ室"
          icon="Flame"
          min={tempMin}
          max={tempMax}
          scaleMin={60}
          scaleMax={120}
          tone="hot"
        />
        <TempGauge
          label={cold !== null ? cooldownLabel(cold) : '水風呂'}
          icon="Droplet"
          min={cold?.waterTempMin ?? null}
          max={cold?.waterTempMax ?? null}
          scaleMin={0}
          scaleMax={30}
          tone="cold"
        />
      </div>
    </div>
  );
}

/** クールダウンの種類ラベル（cooldown カテゴリの語彙から） */
function cooldownLabel(cold: Cooldown): string {
  const term = findTerm({ category: 'cooldown', key: cold.key });
  return term?.labelJa ?? '水風呂';
}

/** タイプ・熱源のバッジ */
function SpecBadge({ icon, caption, value }: { icon: string; caption: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-md bg-surface px-3 py-2">
      <Icon name={icon} size={20} className="text-accent" />
      <div className="flex flex-col">
        <span className="text-[11px] text-ink-faint">{caption}</span>
        <span className="text-[14px] text-ink">{value}</span>
      </div>
    </div>
  );
}
