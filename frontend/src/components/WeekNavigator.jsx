import { fmtRange, addDays } from '../utils.js'

export default function WeekNavigator({ weeks, selected, onSelect, currentWeek }) {
  const isCurrent = selected === currentWeek
  const canNext = addDays(selected, 7) <= currentWeek

  return (
    <div className="week-nav">
      <div className="title">
        {fmtRange(selected)}
        {isCurrent && <span className="current-tag">이번 주</span>}
      </div>
      <div className="row">
        <button className="btn secondary" style={{ padding: '8px 14px' }}
          onClick={() => onSelect(addDays(selected, -7))}>‹ 이전 주</button>
        <select className="week-select" value={selected}
          onChange={e => onSelect(e.target.value)}>
          {!weeks.includes(currentWeek) && (
            <option value={currentWeek}>이번 주 ({fmtRange(currentWeek)})</option>
          )}
          {weeks.map(w => (
            <option key={w} value={w}>
              {w === currentWeek ? '이번 주' : `${fmtRange(w)}`} {w === currentWeek ? '' : ''}
            </option>
          ))}
        </select>
        <button className="btn secondary" style={{ padding: '8px 14px' }}
          disabled={!canNext}
          onClick={() => onSelect(addDays(selected, 7))}>다음 주 ›</button>
      </div>
    </div>
  )
}
