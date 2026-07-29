import { useState, useEffect } from 'react'
import { api } from '../api.js'

export default function TargetSetting() {
  const [hours, setHours] = useState(8)
  const [minutes, setMinutes] = useState(0)
  const [saved, setSaved] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSettings().then(s => {
      setHours(Math.floor(s.target_sleep_min / 60))
      setMinutes(s.target_sleep_min % 60)
      setSaved(s.target_sleep_min)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const save = () => {
    const min = Math.max(0, hours * 60 + minutes)
    api.saveSettings(min).then(s => {
      setSaved(s.target_sleep_min)
      setHours(Math.floor(s.target_sleep_min / 60))
      setMinutes(s.target_sleep_min % 60)
    })
  }

  const savedText = saved != null
    ? `${Math.floor(saved / 60)}시간 ${saved % 60}분`
    : '미설정'

  return (
    <div className="card">
      <h2>목표 수면 시간 {loading ? '' : <span className="pill">현재: {savedText}</span>}</h2>
      <div className="row">
        <div className="col" style={{ flex: '0 0 90px' }}>
          <label>시간</label>
          <input type="number" min="0" max="14" value={hours}
            onChange={e => setHours(Math.max(0, Math.min(14, Number(e.target.value) || 0)))} />
        </div>
        <div className="col" style={{ flex: '0 0 90px' }}>
          <label>분</label>
          <input type="number" min="0" max="59" step="5" value={minutes}
            onChange={e => setMinutes(Math.max(0, Math.min(59, Number(e.target.value) || 0)))} />
        </div>
        <div className="col" style={{ flex: '1 1 auto' }}>
          <label>&nbsp;</label>
          <button className="btn" onClick={save} disabled={loading}>저장</button>
        </div>
      </div>
      <p className="hint">
        목표 수면 시간과 실제 수면 시간의 차이로 수면 상태가 결정됩니다.<br />
        (차이 1시간 이하: 좋음 / 1시간 초과~2시간 이하: 보통 / 2시간 초과: 나쁨)
      </p>
    </div>
  )
}
