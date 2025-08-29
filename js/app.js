// 送信時の簡易バリデーション＆結果表示（ページ遷移なし）
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profileForm');
  const result = document.getElementById('result');

  form.addEventListener('submit', (e) => {
    // ページリロードや自動送信を止める（POST中止）
    e.preventDefault();
    
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const name = (data.get('name') || '').trim();
    const age = data.get('age');
    const gender = data.get('gender');

    result.innerHTML = `
      <p>以下の内容で受け付けました。</p>
      <p><strong>名前：</strong>${name}</p>
      <p><strong>年齢：</strong>${age}</p>
      <p><strong>性別：</strong>${gender}</p>
    `;
    result.style.display = 'block';
  });
});
