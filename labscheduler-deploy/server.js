import express from 'express';
import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'labscheduler.db');
const app = express();
app.use(cors());
app.use(express.json());

// --- Database Setup ---
const SQL = await initSqlJs();
const db = existsSync(DB_PATH) ? new SQL.Database(readFileSync(DB_PATH)) : new SQL.Database();

const save = () => writeFileSync(DB_PATH, Buffer.from(db.export()));

db.run(`CREATE TABLE IF NOT EXISTS labs (id TEXT PRIMARY KEY, name TEXT, capacity INTEGER, equipment TEXT DEFAULT '[]', description TEXT DEFAULT '')`);
db.run(`CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, labId TEXT, userId TEXT, userName TEXT, date TEXT, startTime INTEGER, endTime INTEGER, purpose TEXT DEFAULT '', status TEXT DEFAULT 'confirmed')`);

// Seed labs if empty
const [{ values: [[count]] }] = db.exec('SELECT COUNT(*) FROM labs');
if (count === 0) {
  const stmt = db.prepare('INSERT INTO labs VALUES (?,?,?,?,?)');
  [
    ['l1','综合实验室 101',40,'["Projector"]','基础物理实验'],
    ['l2','化学实验室 102',30,'["Fume Hood"]','有机化学实验'],
    ['l3','计算机机房 201',60,'["PCs"]','编程与仿真'],
    ['l4','生物实验室 202',35,'["Microscopes"]','微生物研究'],
    ['l5','多媒体教室 301',100,'["Large Screen"]','学术讲座'],
    ['l6','人工智能实验室 401',25,'["GPU Clusters"]','深度学习训练'],
    ['l7','电子工程中心 402',45,'["Oscilloscope"]','电路设计'],
    ['l8','机器人工作站 501',20,'["3D Printers"]','自动化控制'],
  ].forEach(r => stmt.run(r));
  stmt.free();
  save();
}

const query = (sql, params = []) => {
  const res = db.exec(sql, params);
  if (!res.length) return [];
  const { columns, values } = res[0];
  return values.map(row => Object.fromEntries(columns.map((c, i) => [c, row[i]])));
};

const parseLab = r => ({ ...r, equipment: JSON.parse(r.equipment) });

// --- Labs API ---
app.get('/api/labs', (req, res) => res.json(query('SELECT * FROM labs').map(parseLab)));

app.post('/api/labs', (req, res) => {
  const { id, name, capacity, equipment, description } = req.body;
  db.run('INSERT OR REPLACE INTO labs VALUES (?,?,?,?,?)', [id, name, capacity, JSON.stringify(equipment), description]);
  save();
  res.json({ ok: true });
});

app.delete('/api/labs/:id', (req, res) => {
  db.run('DELETE FROM labs WHERE id=?', [req.params.id]);
  save();
  res.json({ ok: true });
});

// --- Bookings API ---
app.get('/api/bookings', (req, res) => res.json(query("SELECT * FROM bookings WHERE status='confirmed'")));

app.post('/api/bookings', (req, res) => {
  const { id, labId, userId, userName, date, startTime, endTime, purpose, status } = req.body;
  db.run('INSERT OR REPLACE INTO bookings VALUES (?,?,?,?,?,?,?,?,?)', [id, labId, userId, userName, date, startTime, endTime, purpose, status || 'confirmed']);
  save();
  res.json({ ok: true });
});

app.delete('/api/bookings/:id', (req, res) => {
  db.run('DELETE FROM bookings WHERE id=?', [req.params.id]);
  save();
  res.json({ ok: true });
});

// --- Static files ---
app.use(express.static(join(__dirname, 'dist')));
app.get('/{*splat}', (req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
