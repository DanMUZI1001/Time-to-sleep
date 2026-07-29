import express from 'express'
import cors from 'cors'
import { DatabaseSync } from 'node:sqlite'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new DatabaseSync(process.env.DB_PATH || path.join(__dirname, 'sleep.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sleep_records (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time    TEXT NOT NULL,
    end_time      TEXT NOT NULL,
    wake_time     TEXT,
    duration_min  INTEGER NOT NULL,
    week_start    TEXT NOT NULL,
    created_at    TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_week ON sleep_records(week_start);
`)

const app = express()
app.use(cors())
app.use(express.json())

function startOfWeek(d) {
  const date = new Date(d)
  const day = (date.getDay() + 6) % 7
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - day)
  return date
}
function isoDate(d) {
  const x = new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function diffMin(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 60000)
}

app.get('/api/settings', (req, res) => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('target_sleep_min')
  res.json({ target_sleep_min: row ? Number(row.value) : 480 })
})

app.post('/api/settings', (req, res) => {
  const { target_sleep_min } = req.body
  if (typeof target_sleep_min !== 'number' || target_sleep_min < 0) {
    return res.status(400).json({ error: 'invalid target_sleep_min' })
  }
  db.prepare(
    'INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run('target_sleep_min', String(target_sleep_min))
  res.json({ target_sleep_min })
})

app.post('/api/sleep', (req, res) => {
  const { start_time, end_time, wake_time } = req.body
  const start = new Date(start_time)
  const end = new Date(end_time)
  if (isNaN(start) || isNaN(end) || end <= start) {
    return res.status(400).json({ error: 'invalid time range' })
  }
  const duration_min = diffMin(start, end)
  const week_start = isoDate(startOfWeek(start))
  const created_at = new Date().toISOString()
  const info = db.prepare(
    `INSERT INTO sleep_records(start_time, end_time, wake_time, duration_min, week_start, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(start.toISOString(), end.toISOString(), wake_time || null, duration_min, week_start, created_at)
  res.json({ id: info.lastInsertRowid, duration_min, week_start })
})

app.get('/api/sleep', (req, res) => {
  const week = req.query.week_start
  let rows
  if (week) {
    rows = db.prepare('SELECT * FROM sleep_records WHERE week_start = ? ORDER BY start_time').all(week)
  } else {
    rows = db.prepare('SELECT * FROM sleep_records ORDER BY start_time DESC').all()
  }
  res.json(rows)
})

app.get('/api/weeks', (req, res) => {
  const rows = db.prepare(
    'SELECT DISTINCT week_start FROM sleep_records ORDER BY week_start DESC'
  ).all()
  res.json(rows.map(r => r.week_start))
})

app.get('/api/week/:week_start', (req, res) => {
  const ws = req.params.week_start
  const records = db.prepare('SELECT * FROM sleep_records WHERE week_start = ? ORDER BY start_time').all(ws)
  const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('target_sleep_min')
  const target = setting ? Number(setting.value) : 480

  const total = records.reduce((s, r) => s + r.duration_min, 0)
  const weekly_target = target * 7
  const diff = total - weekly_target
  const avgDiff = Math.abs(diff) / 7
  let status
  if (avgDiff <= 60) status = '좋음'
  else if (avgDiff <= 120) status = '보통'
  else status = '나쁨'

  res.json({
    week_start: ws, records, total_min: total,
    target_min: target, weekly_target_min: weekly_target,
    diff_min: diff, status
  })
})

app.delete('/api/sleep/:id', (req, res) => {
  db.prepare('DELETE FROM sleep_records WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

const PORT = process.env.PORT || 4000
const isMain = import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  app.listen(PORT, () => console.log(`sleep-tracker server on http://localhost:${PORT}`))
}

export { app, db, startOfWeek, isoDate, diffMin }
