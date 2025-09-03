require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const app = express();
const PORT = Number(process.env.SIGNUP_PORT || 4000);
const SALT_ROUNDS = 10;

// CORS: 同一サーバ内で完結するので必須ではないが、将来拡張用に許可
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静的配信（/signup でHTML返す）
app.use(express.static(path.join(__dirname, 'public-signup'), { index: false }));

// DB接続プール
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
});

// サインアップ画面
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public-signup', 'signup.html'));
});

// ヘルスチェック
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




// サインアップAPI
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok:false, message:'email と password は必須です' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ ok:false, message:'パスワードは8文字以上にしてください' });
    }

    const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length) {
      return res.status(409).json({ ok:false, message:'このメールアドレスは既に登録されています' });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const [r] = await pool.execute(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, hash]
    );

    // 成功したら元アプリへ戻すリンクも返しておく
    return res.status(201).json({
      ok:true,
      userId:r.insertId,
      redirect:'http://localhost:3000/?registered=1'
    });
  } catch (e) {
    console.error('[SIGNUP_ERROR]', e);
    return res.status(500).json({ ok:false, message:'server_error' });
  }
});

app.listen(PORT, () => {
  console.log(`Signup service running: http://localhost:${PORT}`);
});
