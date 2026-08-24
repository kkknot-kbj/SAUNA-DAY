import type { ReactNode } from 'react';

type PageShellProps = {
  children: ReactNode;
  /** 写真をヘッダーまで広げたい画面では左右の余白を外す */
  bleed?: boolean;
};

/**
 * 画面の共通枠。
 * モバイル幅を基準に、左右と下に十分な余白を確保する。
 */
export function PageShell({ children, bleed = false }: PageShellProps) {
  return (
    <main
      className={[
        'mx-auto w-full max-w-screen-sm flex-1',
        bleed ? 'pb-16' : 'px-5 pb-16 pt-6',
      ].join(' ')}
    >
      {children}
    </main>
  );
}
