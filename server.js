const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); 
// public/index.html → http://test.okimi-public.xyz:3000/index.html
// public/js/app.js → http://test.okimi-public.xyz:3000/js/app.js
// public/css/style.css → http://test.okimi-public.xyz:3000/css/style.css


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


// ===== ヘルスチェック =====
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

      
