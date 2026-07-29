import { useMemo } from 'react'
import { statusOf, blocksForDay, fmtHM, fmtDurShort, signDiff } from '../utils.js'

const DAYS = ['월', '화', '수', '목', '금', '토', '일']

export default function WeeklyGrid({ week_start, records, target_min }) {
  const dayData = useMemo(() => {
    const ws = new Date(week_start)
    ws.setHours(0, 0, 0, 0)
    return DAYS.map((d, i) => {
      const dayStart = new Date(ws)
      dayStart.setDate(dayStart.getDate() + i)
      const blocks = []
      let total = 0
      for (const r of records) {
        const b = blocksForDay(r, dayStart)
        if (b) { blocks.push(b); total += b.durMin }
      }
      const diff = total - target_min
      const status = total > 0 ? statusOf(diff) : null
      const dateLabel = `${dayStart.getMonth() + 1}/${dayStart.getDate()}`
      return { name: d, dateLabel, dayStart, blocks, total, diff, status }
    })
  }, [week_start, records, target_min])

  return (
    <div className="grid">
      <div className="day-row">
        <div className="day-label"></div>
        <div className="hour-marks-row">
          <div className="marks" style={{ position: 'relative', height: 14 }}>
            {[0, 3, 6, 9, 12, 15, 18, 21, 24].map(h => (
              <span key={h} style={{ left: `${(h / 24) * 100}%` }}>{h}</span>
            ))}
          </div>
        </div>
      </div>

      {dayData.map((dd, idx) => (
        <div key={idx}>
          <div className="day-row">
            <div className="day-label">
              {dd.name}<br /><span style={{ fontSize: 10, opacity: .7 }}>{dd.dateLabel}</span>
            </div>
            <div className="timeline">
              {dd.blocks.map((b, i) => (
                <div key={i} className="block"
                  style={{
                    left: `${(b.startMin / 1440) * 100}%`,
                    width: `${((b.endMin - b.startMin) / 1440) * 100}%`
                  }}
                  title={`${fmtHM(b.durMin)}`}
                />
              ))}
            </div>
          </div>
          <div className="day-detail">
            {dd.total > 0 ? (
              <>
                <span className="dur">{fmtDurShort(dd.total)}</span>
                {' '}· {signDiff(dd.diff)}
                {dd.status && (
                  <span className={`badge ${dd.status.cls}`} style={{ marginLeft: 8, padding: '2px 8px', fontSize: 11 }}>
                    {dd.status.text}
                  </span>
                )}
              </>
            ) : (
              <span style={{ opacity: .5 }}>수면 기록 없음</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
