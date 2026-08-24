import Link from 'next/link';

import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'quiet';

/** 角丸は 4px、pill 型にしない。タップ領域は 44px 以上 */
const BASE =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md px-5 text-[15px] transition-colors disabled:cursor-not-allowed disabled:opacity-40';

const VARIANTS: Record<Variant, string> = {
  // アクセントは主要CTAと選択状態にだけ使う
  primary: 'bg-accent text-base hover:bg-accent-hover',
  secondary: 'border border-line bg-base text-ink hover:bg-surface',
  quiet: 'text-ink-muted hover:text-ink',
};

type CommonProps = {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  /** 横幅いっぱいに広げる */
  block?: boolean;
};

type ButtonProps = CommonProps & {
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
};

function classesOf(variant: Variant, block: boolean, className: string | undefined): string {
  return [BASE, VARIANTS[variant], block ? 'w-full' : '', className ?? '']
    .filter((part) => part !== '')
    .join(' ');
}

/** 操作ボタン */
export function Button({
  variant = 'primary',
  children,
  className,
  block = false,
  type = 'button',
  disabled = false,
  onClick,
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={classesOf(variant, block, className)}
    >
      {children}
    </button>
  );
}

type LinkButtonProps = CommonProps & {
  href: string;
  /** 外部サイトへ遷移する場合。新規タブで開き、遷移先が外部であることを伝える */
  external?: boolean;
};

/** 遷移用のボタン。見た目は Button と同じ */
export function LinkButton({
  href,
  variant = 'secondary',
  children,
  className,
  block = false,
  external = false,
}: LinkButtonProps) {
  const classes = classesOf(variant, block, className);

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
