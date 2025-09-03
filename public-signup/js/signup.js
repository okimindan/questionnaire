const qs = (s, el=document) => el.querySelector(s);

async function safeJson(res){
  try { return await res.json(); } catch { return {}; }
}

const form = qs('#signup-form');
const msg  = qs('#msg');
const btn  = qs('#signupBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = '';

  const email = qs('#email').value.trim();
  const password = qs('#password').value;
  const password2 = qs('#password2').value;

  if (!email || !password) {
    msg.textContent = 'メールアドレスとパスワードを入力してください。';
    return;
  }
  if (password !== password2) {
    msg.textContent = 'パスワードが一致しません。';
    return;
  }
  if (password.length < 8) {
    msg.textContent = 'パスワードは8文字以上にしてください。';
    return;
  }

  btn.disabled = true;
  const original = btn.textContent;
  btn.textContent = '作成中…';

  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const body = await safeJson(res);
    if (!res.ok) {
      throw new Error(body.message || `新規登録に失敗しました（${res.status}）`);
    }

    alert('アカウントを作成しました。ログイン画面に戻ります。');
    location.assign(body.redirect || 'http://localhost:3000/?registered=1');
  } catch (err) {
    msg.textContent = err.message || '不明なエラーが発生しました。';
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
});
