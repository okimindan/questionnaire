require('dotenv').config();

console.log('[ENV]', {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER
});

const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');
const session = require('express-session');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// セッション設定（セッションを使う場合）
app.use(session({
  secret: 'your-secret-key',     // 適当な長いランダム文字列に置き換える
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }      // HTTPSならtrueにする
}));



// 静的配信（index.htmlは自動配信しない）
app.use(express.static(path.join(__dirname, 'public'), { index: false }));


// ===== DB接続プール =====
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  // ssl: { ca: require('fs').readFileSync('/path/to/ca.pem') } // TLSが必要なら
});

// ===== 初回ログイン画面 =====

app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'login.html');
  console.log('GET / ->', filePath);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('sendFile error:', err); // ← ENOENT/EACCES など出ます
      res.status(err.status || 500).end();
    }
  });
});


// ===== アンケート画面 =====
app.get('/questionnaire', (req, res) => {
  const fp = path.join(__dirname, 'public', 'questionnaire.html');
  console.log('GET /questionnaire ->', fp);
  res.sendFile(fp, (err) => {
    if (err) { console.error('sendFile error:', err); res.status(500).end(); }
  });
});



// ===== ヘルスチェック =====
app.get('/api/health', async (req, res) => {
  try {
    const [ping] = await pool.query('SELECT 1 AS ok');
    const [db]   = await pool.query('SELECT DATABASE() AS db');
    res.json({ ok: true, ping: ping[0].ok, database: db[0].db });
  } catch (e) {
    console.error('[DB_CONNECT_ERROR]', e.code, e.errno, e.sqlState, e.sqlMessage);
    res.status(500).json({ ok:false, error:'db_connect_failed' });
  }
});

// ===== ログイン認証 =====
app.post('/api/login', async (req, res) => {
  const { email, password, remember } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'メールアドレスとパスワードを入力してください' });
  }

  try {
    // ユーザー検索
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'ユーザーが見つかりません' });
    }

    const user = rows[0];

    // パスワード検証
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'パスワードが間違っています' });
    }

    // セッションにユーザーID保存
    req.session.userId = user.id;

    // "remember me" の場合、セッションの有効期限を長くする
    if (remember) {
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30; // 30日
    }

    // 成功レスポンス
    res.json({ message: 'ログイン成功', redirect: '/questionnaire.html' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'サーバーエラー' });
  }
});

// ===== アンケート結果送信 =====
app.post('/api/profile', async (req, res) => {
  try {
    const { name, age, gender } = req.body || {};
    if (!name || !gender || typeof age === 'undefined') {
      return res.status(400).json({ ok:false, error:'invalid_input' });
    }
    const ageNum = Number(age);
    if (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 120) {
      return res.status(400).json({ ok:false, error:'invalid_age' });
    }

    const [r] = await pool.execute(
      'INSERT INTO profiles (name, age, gender) VALUES (?, ?, ?)',
      [String(name).trim(), ageNum, String(gender)]
    );

    // 直後に読み出して返す（確認用）
    const [rows] = await pool.query('SELECT * FROM profiles WHERE id = ?', [r.insertId]);
    res.json({ ok:true, id:r.insertId, row: rows[0] });
  } catch (e) {
    console.error('[ERROR]', e);
    res.status(500).json({ ok:false, error:'server_error' });
  }
});

// ===== 起動 =====
const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => {
  console.log(`API server running on http://0.0.0.0:${port}`);
});
