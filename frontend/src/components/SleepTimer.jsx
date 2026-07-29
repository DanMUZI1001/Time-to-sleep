import { useState, useEffect, useRef } from 'react'
import { api } from '../api.js'

const LS_KEY = 'sleep_tracker_active'

function loadActive() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const obj = JSON.parse(raw)
    return obj.start_time ? obj : null
  } catch { return null }
}

function fmt(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function SleepTimer({ onSaved }) {
  const [active, setActive] = useState(loadActive())
  const [elapsed, setElapsed] = useState(0)
  const [wakeTime, setWakeTime] = useState('07:00')
  const [saving, setSaving] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [error, setError] = useState('')
  const tickRef = useRef(null)

  useEffect(() => {
    if (active) {
      const tick = () => setElapsed(Date.now() - new Date(active.start_time).getTime())
      tick()
      tickRef.current = setInterval(tick, 1000)
      return () => clearInterval(tickRef.current)
    }
  }, [active])

  const start = () => {
    const start_time = new Date().toISOString()
    const obj = { start_time, wake_time: wakeTime }
    localStorage.setItem(LS_KEY, JSON.stringify(obj))
    setActive(obj)
    setLastResult(null)
    setError('')
  }

  const stop = async () => {
    if (!active) return
    setSaving(true)
    setError('')
    try {
      const end_time = new Date().toISOString()
      const res = await api.saveSleep({
        start_time: active.start_time,
        end_time,
        wake_time: active.wake_time
      })
      localStorage.removeItem(LS_KEY)
      setActive(null)
      setElapsed(0)
      setLastResult({ ...res, end_time })
      onSaved && onSaved()
    } catch (e) {
      setError(e.message || '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const updateWake = (v) => {
    setWakeTime(v)
    if (active) {
      const obj = { ...active, wake_time: v }
      localStorage.setItem(LS_KEY, JSON.stringify(obj))
      setActive(obj)
    }
  }

  const startHm = active ? new Date(active.start_time).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : ''

  return (
    <div className="card">
      <h2>수면 타이머</h2>
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="col" style={{ flex: '0 0 140px' }}>
          <label>기상 예정 시간</label>
          <input type="time" value={wakeTime} onChange={e => updateWake(e.target.value)} disabled={saving} />
        </div>
      </div>

      <div className="timer-wrap">
        {active ? (
          <>
            <div className="timer-label">잠자는 중… 시작: {startHm}</div>
            <div className="timer">{fmt(elapsed)}</div>
            <button className="btn danger big" onClick={stop} disabled={saving}>
              {saving ? '저장 중…' : '일어나기 (정지 & 저장)'}
            </button>
          </>
        ) : (
          <>
            <div className="timer-label">자기 전에 눌러서 수면을 시작하세요</div>
            <div className="timer">00:00:00</div>
            <button className="btn big" onClick={start}>수면 시작</button>
          </>
        )}
      </div>

      {error && <p style={{ color: 'var(--bad)', marginTop: 10, fontSize: 13 }}>{error}</p>}

      {lastResult && (
        <div className="card" style={{ marginTop: 16, background: 'var(--bg-2)' }}>
          <div className="row" style={{ justifyContent: 'center', gap: 20 }}>
            <span>저장 완료 ✓</span>
            <span>수면 시간: <b style={{ color: 'var(--accent)' }}>
              {Math.floor(lastResult.duration_min / 60)}시간 {lastResult.duration_min % 60}분
            </b></span>
          </div>
        </div>
      )}
    </div>
  )
}
