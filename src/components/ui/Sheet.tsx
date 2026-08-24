'use client';

import { useEffect } from 'react';

import { Icon } from './Icon';

import type { ReactNode } from 'react';

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/**
 * 下から出るシート。
 * 詳細情報（スコアの内訳など）を隠しておくために使う。
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  // Esc で閉じる
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="閉じる"
        onClick={onClose}
        className="absolute inset-0 bg-ink/30"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[80vh] w-full max-w-screen-sm overflow-y-auto rounded-t-md border-t border-line bg-base"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-[15px] text-ink">{title}</h2>
          <button
            type="button"
            aria-label="閉じる"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-full text-ink-muted hover:text-ink"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
