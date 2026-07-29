const REMOTE_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? '/api' : '')
const SETTINGS_KEY = 'sleep_tracker_settings'
const RECORDS_KEY = 'sleep_tracker_records'

async function jget(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error((await r.json().catch(() => ({})).error) || 'request failed')
  return r.json()
}

async function jpost(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!r.ok) throw new Error((await r.json().catch(() => ({})).error) || 'request failed')
  return r.json()
}

async function jdel(url) {
  const r = await fetch(url, { method: 'DELETE' })
  if (!r.ok) throw new Error('request failed')
  return r.json()
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

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

function targetSleepMin() {
  return readJson(SETTINGS_KEY, { target_sleep_min: 480 }).target_sleep_min
}

function sleepRecords() {
  return readJson(RECORDS_KEY, [])
}

function weeklyStatus(total, target) {
  const avgDiff = Math.abs(total - target * 7) / 7
  if (avgDiff <= 60) return '좋음'
  if (avgDiff <= 120) return '보통'
  return '나쁨'
}

const localApi = {
  async getSettings() {
    return { target_sleep_min: targetSleepMin() }
  },

  async saveSettings(target_sleep_min) {
    if (typeof target_sleep_min !== 'number' || target_sleep_min < 0) {
      throw new Error('invalid target_sleep_min')
    }
    writeJson(SETTINGS_KEY, { target_sleep_min })
    return { target_sleep_min }
  },

  async saveSleep(payload) {
    const start = new Date(payload.start_time)
    const end = new Date(payload.end_time)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      throw new Error('invalid time range')
    }

    const records = sleepRecords()
    const duration_min = diffMin(start, end)
    const week_start = isoDate(startOfWeek(start))
    const id = records.reduce((max, record) => Math.max(max, Number(record.id) || 0), 0) + 1
    const record = {
      id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      wake_time: payload.wake_time || null,
      duration_min,
      week_start,
      created_at: new Date().toISOString()
    }

    writeJson(RECORDS_KEY, [...records, record])
    return { id, duration_min, week_start }
  },

  async deleteSleep(id) {
    const deleteId = Number(id)
    writeJson(RECORDS_KEY, sleepRecords().filter(record => Number(record.id) !== deleteId))
    return { ok: true }
  },

  async getWeeks() {
    const weeks = [...new Set(sleepRecords().map(record => record.week_start))]
    return weeks.sort().reverse()
  },

  async getWeek(week_start) {
    const records = sleepRecords()
      .filter(record => record.week_start === week_start)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    const target = targetSleepMin()
    const total = records.reduce((sum, record) => sum + record.duration_min, 0)
    const weekly_target = target * 7

    return {
      week_start,
      records,
      total_min: total,
      target_min: target,
      weekly_target_min: weekly_target,
      diff_min: total - weekly_target,
      status: weeklyStatus(total, target)
    }
  }
}

const remoteApi = {
  getSettings: () => jget(`${REMOTE_BASE}/settings`),
  saveSettings: (target_sleep_min) => jpost(`${REMOTE_BASE}/settings`, { target_sleep_min }),
  saveSleep: (payload) => jpost(`${REMOTE_BASE}/sleep`, payload),
  deleteSleep: (id) => jdel(`${REMOTE_BASE}/sleep/${id}`),
  getWeeks: () => jget(`${REMOTE_BASE}/weeks`),
  getWeek: (week_start) => jget(`${REMOTE_BASE}/week/${week_start}`)
}

export const api = REMOTE_BASE ? remoteApi : localApi
