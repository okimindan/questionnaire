// ====== 設定（必要に応じて変更） ======
const API_ENDPOINT = "/api/login";              // 認証API（POST）
const REDIRECT_DEFAULT = "/next.html";          // next が無い場合の遷移先(現在未作成)

// ====== ユーティリティ ======
const qs = (s, el=document) => el.querySelector(s);
async function safeJson(res){ try { return await res.json(); } catch { return {}; } }

// パスワード表示切替
const pwd = qs('#password');
const toggle = qs('#togglePwd');
toggle.addEventListener('click', () => {
  const isText = pwd.type === 'text';
  pwd.type = isText ? 'password' : 'text';
  toggle.textContent = isText ? '表示' : '非表示';
  toggle.setAttribute('aria-pressed', String(!isText));
});

// フォーム送信
const form = qs('#login-form');
const msg = qs('#msg');
const btn = qs('#submitBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = '';

  const email = qs('#email').value.trim();
  const password = pwd.value;
  if (!email || !password) {
    msg.textContent = 'メールアドレスとパスワードを入力してください。';
    return;
  }

  const params = new URLSearchParams(location.search);
  const next = params.get('next') || REDIRECT_DEFAULT;

  btn.disabled = true;
  const original = btn.textContent;
  btn.textContent = 'サインイン中…';

  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // セッションCookieを使う場合
      body: JSON.stringify({ email, password, remember: qs('#remember').checked })
    });

    if (!res.ok) {
      const body = await safeJson(res);
      throw new Error(body.message || `ログインに失敗しました（${res.status}）`);
    }

    const body = await safeJson(res);
    const redirectTo = body.redirect || next;
    location.assign(redirectTo);
  } catch (err) {
    msg.textContent = err.message || '不明なエラーが発生しました。';
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
});
