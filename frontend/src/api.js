const BASE = '/api'

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

export const api = {
  getSettings: () => jget(`${BASE}/settings`),
  saveSettings: (target_sleep_min) => jpost(`${BASE}/settings`, { target_sleep_min }),
  saveSleep: (payload) => jpost(`${BASE}/sleep`, payload),
  deleteSleep: (id) => jdel(`${BASE}/sleep/${id}`),
  getWeeks: () => jget(`${BASE}/weeks`),
  getWeek: (week_start) => jget(`${BASE}/week/${week_start}`)
}
