import Link from 'next/link';

import { Icon } from '@/components/ui/Icon';

type AppHeaderProps = {
  title?: string;
  /** 戻る先。指定すると戻るリンクを出す */
  backHref?: string;
};

/**
 * 画面上部のヘッダー。
 * 情報を詰め込まず、現在地と戻る手段だけを置く。
 */
export function AppHeader({ title, backHref }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex min-h-[52px] max-w-screen-sm items-center gap-2 px-4">
        {backHref !== undefined ? (
          <Link
            href={backHref}
            aria-label="戻る"
            className="-ml-2 flex size-11 items-center justify-center rounded-full text-ink-muted hover:text-ink"
          >
            <Icon name="ChevronLeft" size={20} />
          </Link>
        ) : null}

        {title !== undefined ? (
          <h1 className="text-[15px] text-ink">{title}</h1>
        ) : (
          <span className="font-serif text-[15px] tracking-wide text-ink">SAUNA DAY</span>
        )}
      </div>
    </header>
  );
}
