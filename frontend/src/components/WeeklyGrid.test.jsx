import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import WeeklyGrid from './WeeklyGrid.jsx'

describe('WeeklyGrid', () => {
  const week_start = '2026-07-27'

  test('빈 기록 렌더링', () => {
    render(<WeeklyGrid week_start={week_start} records={[]} target_min={480} />)
    const emptyMessages = screen.getAllByText('수면 기록 없음')
    expect(emptyMessages.length).toBe(7)
  })

  test('7일 렌더링', () => {
    render(<WeeklyGrid week_start={week_start} records={[]} target_min={480} />)
    expect(screen.getByText('월')).toBeInTheDocument()
    expect(screen.getByText('화')).toBeInTheDocument()
    expect(screen.getByText('수')).toBeInTheDocument()
    expect(screen.getByText('목')).toBeInTheDocument()
    expect(screen.getByText('금')).toBeInTheDocument()
    expect(screen.getByText('토')).toBeInTheDocument()
    expect(screen.getByText('일')).toBeInTheDocument()
  })

  test('수면 기록 블록 표시', () => {
    const records = [
      {
        id: 1,
        start_time: '2026-07-27T23:00:00',
        end_time: '2026-07-28T07:00:00',
        duration_min: 480,
        week_start: '2026-07-27'
      }
    ]
    const { container } = render(
      <WeeklyGrid week_start={week_start} records={records} target_min={480} />
    )
    const blocks = container.querySelectorAll('.block')
    expect(blocks.length).toBeGreaterThan(0)
  })

  test('자정 넘김 수면 두 날에 표시', () => {
    const records = [
      {
        id: 1,
        start_time: '2026-07-27T23:00:00',
        end_time: '2026-07-28T07:00:00',
        duration_min: 480,
        week_start: '2026-07-27'
      }
    ]
    const { container } = render(
      <WeeklyGrid week_start={week_start} records={records} target_min={480} />
    )
    const blocks = container.querySelectorAll('.block')
    expect(blocks.length).toBe(2)
  })

  test('시간 축 표시', () => {
    render(<WeeklyGrid week_start={week_start} records={[]} target_min={480} />)
    const hours = [0, 3, 6, 9, 12, 15, 18, 21, 24]
    hours.forEach(h => {
      expect(screen.getByText(String(h))).toBeInTheDocument()
    })
  })

  test('수면 상태 배지 표시', () => {
    const records = [
      {
        id: 1,
        start_time: '2026-07-27T00:00:00',
        end_time: '2026-07-27T08:00:00',
        duration_min: 480,
        week_start: '2026-07-27'
      }
    ]
    render(<WeeklyGrid week_start={week_start} records={records} target_min={480} />)
    expect(screen.getByText('좋음')).toBeInTheDocument()
  })
})
