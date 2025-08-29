document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profileForm');
  const result = document.getElementById('result');
  const submitBtn = form.querySelector('button[type="submit"]');

  // 今は API が :3000 で動いているのでフルURLを使う
  // （将来、Nginxで同一オリジン化したら '' にして fetch('/api/profile') でOK）
  const API_BASE = `${location.protocol}//test.okimi-public.xyz:3000`;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const payload = {
      name: (data.get('name') || '').trim(),
      age: data.get('age'),
      gender: data.get('gender'),
    };

    submitBtn.disabled = true;
    result.style.display = 'none';

    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || '保存に失敗しました');
      }

      result.innerHTML = `
        <p>以下の内容で受け付け、DBに保存しました（ID: ${json.id}）。</p>
        <p><strong>名前：</strong>${payload.name}</p>
        <p><strong>年齢：</strong>${payload.age}</p>
        <p><strong>性別：</strong>${payload.gender}</p>
      `;
      result.style.display = 'block';
      form.reset();
    } catch (err) {
      result.innerHTML = `<p style="color:#b91c1c;">エラー: ${err.message}</p>`;
      result.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
    }
  });
});
