import Image from 'next/image';

import { Icon } from './Icon';

type PhotoProps = {
  /** null なら実写真が未登録。プレースホルダを出す */
  url: string | null;
  /** 空文字にしない（a11y） */
  alt: string;
  /** 3:2 は検索結果カード、4:5 は詳細ヒーロー */
  ratio?: '3/2' | '4/5';
  /** 上に文字を載せる場合、下方向のオーバーレイを敷く */
  scrim?: boolean;
  priority?: boolean;
};

const RATIOS: Record<NonNullable<PhotoProps['ratio']>, string> = {
  '3/2': 'aspect-[3/2]',
  '4/5': 'aspect-[4/5]',
};

/**
 * 写真。写真を主役として扱うため、余白を削らず大きく置く。
 *
 * Phase 1 は実写真が未登録なので無地のプレースホルダを表示する。
 * 実写真が入り次第 url を埋めれば切り替わる。
 */
export function Photo({ url, alt, ratio = '3/2', scrim = false, priority = false }: PhotoProps) {
  return (
    <div className={`relative w-full overflow-hidden rounded-md bg-line ${RATIOS[ratio]}`}>
      {url === null ? (
        // 実写真がないことを示す。推測画像で埋めない
        <div className="flex size-full items-center justify-center" role="img" aria-label={alt}>
          <Icon name="Image" size={24} className="text-ink-faint" />
        </div>
      ) : (
        <Image src={url} alt={alt} fill sizes="(max-width: 640px) 100vw, 640px" priority={priority} className="object-cover" />
      )}

      {scrim ? <div className="photo-scrim pointer-events-none absolute inset-0" /> : null}
    </div>
  );
}
