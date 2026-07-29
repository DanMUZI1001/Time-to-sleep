import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import SleepTimer from './SleepTimer.jsx'

vi.mock('../api.js', () => ({
  api: {
    saveSleep: vi.fn(),
    getSettings: vi.fn(),
    saveSettings: vi.fn(),
    deleteSleep: vi.fn(),
    getWeeks: vi.fn(),
    getWeek: vi.fn()
  }
}))

import { api } from '../api.js'

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('SleepTimer', () => {
  test('초기 상태: 수면 시작 버튼 표시', () => {
    render(<SleepTimer />)
    expect(screen.getByText('수면 시작')).toBeInTheDocument()
    expect(screen.getByText('00:00:00')).toBeInTheDocument()
  })

  test('수면 시작 후 타이머 동작', async () => {
    render(<SleepTimer />)
    const btn = screen.getByText('수면 시작')
    await act(async () => {
      fireEvent.click(btn)
    })
    expect(screen.getByText(/잠자는 중/)).toBeInTheDocument()
    expect(screen.getByText(/일어나기/)).toBeInTheDocument()
    expect(localStorage.getItem('sleep_tracker_active')).not.toBeNull()
  })

  test('수면 종료 시 API 호출', async () => {
    api.saveSleep.mockResolvedValue({ id: 1, duration_min: 480, week_start: '2026-07-27' })
    const onSaved = vi.fn()
    render(<SleepTimer onSaved={onSaved} />)

    await act(async () => {
      fireEvent.click(screen.getByText('수면 시작'))
    })
    await act(async () => {
      fireEvent.click(screen.getByText(/일어나기/))
    })

    await waitFor(() => {
      expect(api.saveSleep).toHaveBeenCalledTimes(1)
    })
    expect(api.saveSleep).toHaveBeenCalledWith(
      expect.objectContaining({
        start_time: expect.any(String),
        end_time: expect.any(String),
        wake_time: '07:00'
      })
    )
    expect(onSaved).toHaveBeenCalled()
    expect(localStorage.getItem('sleep_tracker_active')).toBeNull()
  })

  test('저장 실패 시 에러 메시지 표시', async () => {
    api.saveSleep.mockRejectedValue(new Error('서버 오류'))
    render(<SleepTimer />)

    await act(async () => {
      fireEvent.click(screen.getByText('수면 시작'))
    })
    await act(async () => {
      fireEvent.click(screen.getByText(/일어나기/))
    })

    await waitFor(() => {
      expect(screen.getByText('서버 오류')).toBeInTheDocument()
    })
  })

  test('기상 시간 변경', async () => {
    render(<SleepTimer />)
    const wakeInput = screen.getByDisplayValue('07:00')
    await act(async () => {
      fireEvent.change(wakeInput, { target: { value: '06:30' } })
    })
    expect(wakeInput.value).toBe('06:30')
  })

  test('localStorage에서 활성 세션 복원', () => {
    const active = { start_time: '2026-07-29T23:00:00.000Z', wake_time: '07:00' }
    localStorage.setItem('sleep_tracker_active', JSON.stringify(active))

    render(<SleepTimer />)
    expect(screen.getByText(/잠자는 중/)).toBeInTheDocument()
    expect(screen.getByText(/일어나기/)).toBeInTheDocument()
  })
})
