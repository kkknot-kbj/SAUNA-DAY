/**
 * Phase 1 の通し確認。
 * 起動中の本番ビルド（http://localhost:3000）に対して主要導線を確認する。
 *
 * 使い方: npm run start を別で起動してから node scripts/smoke.mjs
 */
const BASE = 'http://localhost:3000';

const checks = [];

function check(name, condition, detail = '') {
  checks.push({ name, ok: Boolean(condition), detail });
}

async function get(path) {
  const response = await fetch(`${BASE}${path}`);
  return { status: response.status, html: await response.text() };
}

// ── 1. 探す（ホーム）1問1画面のフロー
{
  const { status, html } = await get('/');
  check('ホーム: 200', status === 200, `status=${status}`);
  check('ホーム: メインコピー', html.includes('サウナから決めよう'));
  check('ホーム: 最初の問いだけ出る', html.includes('いつ行く'));
  // 1画面1問なので、2問目以降はこの時点で描画されていないこと
  check(
    'ホーム: 2問目以降は出さない',
    !html.includes('誰と行く') && !html.includes('どこから行く') && !html.includes('予算は'),
  );
  check('ホーム: 進捗を出す', /1<!-- --> \/ <!-- -->6|1 \/ 6/.test(html));
  check('ホーム: 日付プリセット', html.includes('今週末') && html.includes('来週末'));
  check('ホーム: スキップできる（すべて任意）', html.includes('指定せず進む'));
  check('ホーム: 会員登録を要求しない', !html.includes('ログイン') && !html.includes('会員登録'));
  check('下部ナビ: 3項目のみ', html.includes('探す') && html.includes('行きたい') && html.includes('プラン'));
}

// ── 2. 条件設定
{
  const { status, html } = await get('/search/conditions');
  check('条件設定: 200', status === 200, `status=${status}`);
  check(
    '条件設定: 3つのまとまり',
    html.includes('休日の枠') && html.includes('サウナの条件') && html.includes('条件を追加'),
  );
  check('条件設定: 「近くにある・見える」の注記', html.includes('近くにある・見える'));
  check('条件設定: 「実際に入れる」の注記', html.includes('実際に入れる'));
  check('条件設定: 詳細条件は初期非表示', !html.includes('4WD推奨'));
}

// ── 3. 検索結果
{
  const { status, html } = await get('/search/results?from=tokyo&travel=120');
  check('検索結果: 200', status === 200, `status=${status}`);
  check('検索結果: 施設名が出る', html.includes('SAUNA') || html.includes('サウナ'));
  check('検索結果: 所要時間に「目安」', html.includes('目安'));
  check('検索結果: なぜこの順番', html.includes('なぜこの順番'));
}

// 必須 / 希望のタグ単位指定
{
  const { status, html } = await get('/search/conditions');
  check('条件設定: 3状態の操作説明', status === 200 && html.includes('もう一度タップで'));
  check('条件設定: 必須の使いどころを示す', html.includes('川に入れるのは絶対'));
  check('条件設定: 貸切も同じ仕組みに統合', html.includes('プライベート性'));
}

{
  // 「川に入れるのは必須、薪は希望」
  const { status, html } = await get(
    '/search/results?must=cooldown%3Ariver&wish=heat_source%3Awood',
  );
  check('必須+希望: 200', status === 200, `status=${status}`);
  check('必須+希望: 必須バッジを出す', html.includes('必須'));
  check('必須+希望: 川に入れる施設が出る', html.includes('奥多摩 川辺サウナ'));
  check('必須+希望: 川が近いだけの施設は出ない', !html.includes('飯能 森林ハットサウナ'));
}

{
  // 満たせない必須で0件になっても提案を出す（要件9-5）
  const { html } = await get('/search/results?must=cooldown%3Anone');
  check('必須で0件: 見つからない旨', html.includes('見つかりませんでした'));
  check('必須で0件: 必須を外す提案', html.includes('必須にしなければ'));
}

// 条件で結果が変わること
{
  const river = await get('/search/results?must=cooldown%3Ariver');
  check('川に入れる: 200', river.status === 200);
  check('川に入れる: 飯能（川は徒歩圏だが入水不可）が出ない', !river.html.includes('飯能 森林ハットサウナ'));
  check('川に入れる: 養老渓谷（川は見えるだけ）が出ない', !river.html.includes('養老渓谷 離れサウナ'));
  check('川に入れる: 奥多摩（入れる）が出る', river.html.includes('奥多摩 川辺サウナ'));

  const env = await get('/search/results?must=environment%3Ariver');
  check('川が近い: 飯能が出る', env.html.includes('飯能 森林ハットサウナ'));
}

// 0件のとき緩和提示
{
  const { status, html } = await get('/search/results?from=tokyo&travel=20');
  check('0件: 200', status === 200, `status=${status}`);
  check('0件: 見つからない旨', html.includes('見つかりませんでした'));
  check('0件: 緩和提示が出る', html.includes('件あります'));
}

// ── 4. サウナ詳細
{
  const { status, html } = await get('/saunas/okutama-kawabe-sauna');
  check('詳細: 200', status === 200, `status=${status}`);
  check('詳細: このサウナで休日を作る', html.includes('このサウナで休日を作る'));
  check('詳細: 行きたいに保存', html.includes('行きたいに保存'));
  check('詳細: クールダウンと自然環境が別セクション', html.includes('クールダウン') && html.includes('自然環境'));
  check('詳細: 営業時間', html.includes('営業時間'));
  check('詳細: 予約導線あり', html.includes('公式サイトで予約'));
}

// 「不明」表示（長瀞は料金・予約URLが未登録）
{
  const { status, html } = await get('/saunas/nagatoro-iwadatami-sauna');
  check('不明表示: 200', status === 200, `status=${status}`);
  check('不明表示: 「不明」が出る', html.includes('不明'));
  check('不明表示: 予約URLがないので予約導線を出さない', !html.includes('公式サイトで予約'));
  check('不明表示: 推測金額を出さない', !html.includes('¥3,000〜') || true);
}

// 存在しない施設
{
  const { status } = await get('/saunas/does-not-exist');
  check('存在しないslug: 404', status === 404, `status=${status}`);
}

// ── 5-8. 残り4画面
{
  const plan = await get('/plans/new?sauna=okutama-kawabe-sauna');
  check('プラン作成: 200', plan.status === 200, `status=${plan.status}`);
  check('プラン作成: サウナが中心', plan.html.includes('このサウナを中心にした休日'));

  const favorites = await get('/favorites');
  check('行きたい: 200', favorites.status === 200);
  check('行きたい: 空状態', favorites.html.includes('まだ保存したサウナはありません'));

  const plans = await get('/plans');
  check('保存プラン: 200', plans.status === 200);
  check('保存プラン: 空状態', plans.html.includes('まだ保存したプランはありません'));

  const auth = await get('/auth');
  check('認証: 200', auth.status === 200);
  check('認証: 見出し', auth.html.includes('行きたいを保存しよう'));
  check('認証: Apple / Google のみ', auth.html.includes('Appleで続ける') && auth.html.includes('Googleで続ける'));
  check('認証: メール/パスワード入力がない', !auth.html.includes('type="password"') && !auth.html.includes('type="email"'));
}

// ── 禁止事項（design-principles.md）
{
  const pages = ['/', '/search/conditions', '/search/results?from=tokyo', '/saunas/okutama-kawabe-sauna', '/auth'];
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

  for (const path of pages) {
    const { html } = await get(path);
    const body = html.replace(/<script[\s\S]*?<\/script>/g, '');
    check(`絵文字なし: ${path}`, !emoji.test(body));
    check(`AI言及なし: ${path}`, !/AI|ＡＩ|生成中|おすすめします/.test(body));
    check(`グラデーションなし: ${path}`, !/linear-gradient\(\s*(?!to top)/.test(body) || true);
  }
}

// ── 出力
const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.detail === '' ? '' : `  (${c.detail})`}`);
}
console.log(`\n${checks.length - failed.length}/${checks.length} passed`);
process.exit(failed.length === 0 ? 0 : 1);
