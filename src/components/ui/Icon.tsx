import * as lucide from 'lucide-react';

import type { LucideProps } from 'lucide-react';

/** 使用を許可するサイズ。これ以外は使わない */
export type IconSize = 16 | 20 | 24;

type IconProps = {
  /** lucide-react のアイコン名。語彙は @/lib/taxonomy/terms.ts が持つ */
  name: string;
  size?: IconSize;
  className?: string;
};

const REGISTRY = lucide as unknown as Record<string, React.ComponentType<LucideProps>>;

/**
 * 線画アイコン。
 *
 * IMPORTANT: 絵文字をアイコンとして使わない。必ずこのコンポーネントを通す。
 * ストロークは 1.5px に固定する。
 *
 * 装飾目的なので `aria-hidden` を付ける。意味を持たせたい場合は
 * 隣接するテキストで伝えること。
 */
export function Icon({ name, size = 20, className }: IconProps) {
  const Component = REGISTRY[name];

  // 未登録のアイコン名でも画面を壊さない
  if (Component == null) {
    return <lucide.Tag size={size} strokeWidth={1.5} className={className} aria-hidden />;
  }

  return <Component size={size} strokeWidth={1.5} className={className} aria-hidden />;
}
