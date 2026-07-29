import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App.jsx'

vi.mock('./api.js', () => ({
  api: {
    getSettings: vi.fn(),
    saveSettings: vi.fn(),
    saveSleep: vi.fn(),
    deleteSleep: vi.fn(),
    getWeeks: vi.fn(),
    getWeek: vi.fn()
  }
}))

import { api } from './api.js'

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  api.getSettings.mockResolvedValue({ target_sleep_min: 480 })
  api.saveSettings.mockResolvedValue({ target_sleep_min: 480 })
  api.getWeeks.mockResolvedValue(['2026-07-27'])
  api.getWeek.mockResolvedValue({
    week_start: '2026-07-27',
    records: [],
    total_min: 0,
    target_min: 480,
    weekly_target_min: 3360,
    diff_min: -3360,
    status: '나쁨'
  })
})

async function login(name = 'muzi') {
  render(<App />)
  fireEvent.change(screen.getByLabelText('닉네임'), { target: { value: name } })
  fireEvent.click(screen.getByText('시작하기'))
  await waitFor(() => {
    expect(screen.getByText(`${name} 님`)).toBeInTheDocument()
  })
}

describe('App', () => {
  test('로그인 화면 표시', () => {
    render(<App />)
    expect(screen.getByText('로그인')).toBeInTheDocument()
    expect(screen.getByLabelText('닉네임')).toBeInTheDocument()
  })

  test('헤더 렌더링', async () => {
    await login()
    expect(screen.getByText('수면 추적기')).toBeInTheDocument()
    expect(screen.getByText('목표 수면시간 관리 · 주간 기록 · 수면 사운드')).toBeInTheDocument()
  })

  test('탭 전환 (수면 기록 <-> 수면 사운드)', async () => {
    await login()

    await waitFor(() => {
      expect(screen.getByText('목표 수면 시간')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('수면 사운드'))
    expect(screen.getByText('백색소음')).toBeInTheDocument()

    fireEvent.click(screen.getByText('수면 기록'))
    await waitFor(() => {
      expect(screen.getByText('목표 수면 시간')).toBeInTheDocument()
    })
  })

  test('주간 데이터 로드', async () => {
    await login()
    await waitFor(() => {
      expect(api.getWeek).toHaveBeenCalled()
      expect(api.getWeeks).toHaveBeenCalled()
    })
  })

  test('주간 상태 표시', async () => {
    await login()
    await waitFor(() => {
      expect(screen.getByText('이번 주 총 수면')).toBeInTheDocument()
      expect(screen.getByText('하루 목표 수면시간')).toBeInTheDocument()
      expect(screen.getByText('수면 상태')).toBeInTheDocument()
    })
  })

  test('로그아웃하면 로그인 화면으로 돌아감', async () => {
    await login()
    fireEvent.click(screen.getByText('로그아웃'))
    expect(screen.getByText('로그인')).toBeInTheDocument()
  })
})
