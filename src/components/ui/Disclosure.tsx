'use client';

import { useId, useState } from 'react';

import { Icon } from './Icon';

import type { ReactNode } from 'react';

type DisclosureProps = {
  /** 閉じているときのラベル（「条件を追加」など） */
  label: string;
  /** 開いているときのラベル。省略時は label を使う */
  openLabel?: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

/**
 * 折りたたみ。
 *
 * 説明文だらけの画面を避けるため、詳細情報はここに隠す。
 * 最初から大量の条件・情報を並べないこと（要件2-4）。
 */
export function Disclosure({ label, openLabel, children, defaultOpen = false }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-[44px] items-center gap-1.5 text-[14px] text-accent hover:text-accent-hover"
      >
        <Icon name={open ? 'Minus' : 'Plus'} size={16} />
        <span>{open ? (openLabel ?? label) : label}</span>
      </button>

      {open ? (
        <div id={panelId} className="pt-2">
          {children}
        </div>
      ) : null}
    </div>
  );
}
