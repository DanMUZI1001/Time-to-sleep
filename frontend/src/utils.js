export function startOfWeek(d) {
  const date = new Date(d)
  const day = (date.getDay() + 6) % 7
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - day)
  return date
}

export function isoDate(d) {
  const x = new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(iso, n) {
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + n)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fmtMin(min) {
  const m = Math.round(min)
  return `${Math.floor(m / 60)}시간 ${m % 60}분`
}

export function fmtHM(min) {
  const m = Math.round(min)
  return `${Math.floor(m / 60)}시간 ${m % 60}분`
}

export function fmtDurShort(min) {
  const m = Math.round(min)
  const h = Math.floor(m / 60)
  const mm = m % 60
  return mm ? `${h}h ${mm}m` : `${h}h`
}

export function signDiff(min) {
  const m = Math.round(min)
  if (m === 0) return '목표 일치'
  return m > 0 ? `+${fmtHM(m)} 더 잠` : `-${fmtHM(-m)} 덜 잠`
}

export function fmtRange(weekStart) {
  const ws = new Date(weekStart)
  ws.setHours(0, 0, 0, 0)
  const we = new Date(ws)
  we.setDate(we.getDate() + 6)
  const f = (d) => `${d.getMonth() + 1}/${d.getDate()}`
  return `${f(ws)} ~ ${f(we)}`
}

export function statusOf(diffMin) {
  const a = Math.abs(diffMin)
  if (a <= 60) return { text: '좋음', cls: 'good' }
  if (a <= 120) return { text: '보통', cls: 'normal' }
  return { text: '나쁨', cls: 'bad' }
}

export function statusOfWeekly(avgDiff) {
  if (avgDiff <= 60) return '좋음'
  if (avgDiff <= 120) return '보통'
  return '나쁨'
}

export function blocksForDay(record, dayStart) {
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)
  const rStart = new Date(record.start_time)
  const rEnd = new Date(record.end_time)
  if (rEnd <= dayStart || rStart >= dayEnd) return null
  const bStart = new Date(Math.max(rStart, dayStart))
  const bEnd = new Date(Math.min(rEnd, dayEnd))
  const startMin = (bStart - dayStart) / 60000
  const endMin = (bEnd - dayStart) / 60000
  return { startMin, endMin, durMin: endMin - startMin }
}
