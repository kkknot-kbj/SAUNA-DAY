import { AuthSync } from '@/components/layout/AuthSync';
import { BottomNav } from '@/components/layout/BottomNav';
import { createClient } from '@/lib/supabase/server';

import './globals.css';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'SAUNA DAY',
  description: '次の休日、サウナから決めよう。',
};

export const viewport: Viewport = {
  themeColor: '#f7f6f3',
};

/**
 * フォントの読み込み方針。
 *
 * IMPORTANT: `next/font/google` は使わない。
 * 日本語フォントは unicode-range で 200 以上のファイルに分割されており、
 * next/font はそれを「ビルド時に全部ダウンロード」しようとする。
 * 1つでも取得に失敗するとビルド／dev が 500 で落ちるため脆い。
 *
 * stylesheet を参照すればブラウザが必要な字の塊だけ取得する。
 * 第三者へのリクエストを避けたくなった段階で、
 * サブセット化した woff2 を自前に置き `next/font/local` へ移す。
 */
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@400;600&display=swap';

export default async function RootLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = user !== null;

  return (
    <html lang="ja" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONT_HREF} />
      </head>
      <body className="flex min-h-full flex-col bg-surface text-ink">
        <AuthSync isAuthenticated={isAuthenticated} />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
