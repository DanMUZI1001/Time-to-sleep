import { useState, useEffect, useCallback } from 'react'
import { api } from './api.js'
import { startOfWeek, isoDate, fmtMin } from './utils.js'
import TargetSetting from './components/TargetSetting.jsx'
import SleepTimer from './components/SleepTimer.jsx'
import WeeklyGrid from './components/WeeklyGrid.jsx'
import WeekNavigator from './components/WeekNavigator.jsx'
import SoundPlayer from './components/SoundPlayer.jsx'

function statusBadge(status) {
  const cls = status === '좋음' ? 'good' : status === '보통' ? 'normal' : 'bad'
  return <span className={`badge ${cls}`}>{status}</span>
}

export default function App() {
  const [tab, setTab] = useState('sleep')
  const currentWeek = isoDate(startOfWeek(new Date()))
  const [selectedWeek, setSelectedWeek] = useState(currentWeek)
  const [weeks, setWeeks] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadWeek = useCallback(async (w) => {
    setLoading(true)
    try {
      const d = await api.getWeek(w)
      setData(d)
    } catch { setData(null) }
    setLoading(false)
  }, [])

  const loadWeeks = useCallback(async () => {
    try { setWeeks(await api.getWeeks()) } catch {}
  }, [])

  useEffect(() => { loadWeek(selectedWeek) }, [selectedWeek, loadWeek])
  useEffect(() => { loadWeeks() }, [loadWeeks])

  const onSaved = () => {
    loadWeeks()
    setSelectedWeek(currentWeek)
    loadWeek(currentWeek)
  }

  const total = data?.total_min || 0
  const target = data?.target_min || 480
  const weeklyTarget = data?.weekly_target_min || target * 7
  const diff = data?.diff_min != null ? data.diff_min : (total - weeklyTarget)
  const status = data?.status

  return (
    <div className="app">
      <header>
        <div>
          <h1>수면 추적기</h1>
          <div className="sub">목표 수면시간 관리 · 주간 기록 · 수면 사운드</div>
        </div>
      </header>

      <div className="tabs">
        <button className={`tab ${tab === 'sleep' ? 'active' : ''}`} onClick={() => setTab('sleep')}>
          수면 기록
        </button>
        <button className={`tab ${tab === 'sound' ? 'active' : ''}`} onClick={() => setTab('sound')}>
          수면 사운드
        </button>
      </div>

      {tab === 'sleep' ? (
        <>
          <TargetSetting />
          <SleepTimer onSaved={onSaved} />

          <div className="card">
            <WeekNavigator
              weeks={weeks}
              selected={selectedWeek}
              onSelect={setSelectedWeek}
              currentWeek={currentWeek}
            />

            {status && (
              <div className="status-row">
                <div className="stat">
                  <div className="k">이번 주 총 수면</div>
                  <div className="v">{fmtMin(total)}</div>
                </div>
                <div className="stat">
                  <div className="k">주간 목표 ({fmtMin(weeklyTarget)})</div>
                  <div className="v" style={{ color: diff >= 0 ? 'var(--good)' : 'var(--bad)' }}>
                    {diff > 0 ? '+' : ''}{fmtMin(diff)}
                  </div>
                </div>
                <div className="stat">
                  <div className="k">수면 상태 (일일평균 차이)</div>
                  <div className="v">{statusBadge(status)}</div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="empty">불러오는 중…</div>
            ) : (
              <WeeklyGrid
                week_start={selectedWeek}
                records={data?.records || []}
                target_min={target}
              />
            )}
            <p className="hint">
              각 줄은 0시~24시 타임라인이며, 색칠된 영역이 잠든 시간입니다.
              자정을 넘긴 수면은 다음 날 줄에 이어서 표시됩니다.
            </p>
          </div>
        </>
      ) : (
        <SoundPlayer />
      )}
    </div>
  )
}
