/**
 * 日付の補助。
 *
 * IMPORTANT: 「今週末」の算出はサーバー側で行い、props で渡すこと。
 * クライアントで `new Date()` を使うとサーバーとの差でハイドレーションが崩れる。
 */

/** Date を YYYY-MM-DD にする（ローカル時刻基準） */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 直近の土曜日。
 * 今日が土曜なら今日、日曜なら前日ではなく翌週ではなく「今日」を含む週末として日曜を返す。
 */
function upcomingSaturday(from: Date): Date {
  const date = new Date(from);
  const day = date.getDay(); // 0=日, 6=土
  // 日曜なら「今週末」はもう今日しかない
  if (day === 0) return date;
  date.setDate(date.getDate() + ((6 - day + 7) % 7));
  return date;
}

export type DatePreset = { key: string; label: string; date: string };

/**
 * 日付のプリセット。
 * カレンダーを開かせずに大半のケースを1タップで済ませるため。
 */
export function weekendPresets(today: Date = new Date()): DatePreset[] {
  const thisWeekend = upcomingSaturday(today);

  const nextWeekend = new Date(thisWeekend);
  nextWeekend.setDate(nextWeekend.getDate() + 7);

  return [
    { key: 'this_weekend', label: '今週末', date: toIsoDate(thisWeekend) },
    { key: 'next_weekend', label: '来週末', date: toIsoDate(nextWeekend) },
  ];
}
