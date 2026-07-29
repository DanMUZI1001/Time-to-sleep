import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TargetSetting from './TargetSetting.jsx'

vi.mock('../api.js', () => ({
  api: {
    getSettings: vi.fn(),
    saveSettings: vi.fn(),
    saveSleep: vi.fn(),
    deleteSleep: vi.fn(),
    getWeeks: vi.fn(),
    getWeek: vi.fn()
  }
}))

import { api } from '../api.js'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TargetSetting', () => {
  test('설정 로드 후 표시', async () => {
    api.getSettings.mockResolvedValue({ target_sleep_min: 480 })
    render(<TargetSetting />)

    await waitFor(() => {
      expect(screen.getByText(/현재: 8시간 0분/)).toBeInTheDocument()
    })
    expect(screen.getByDisplayValue('8')).toBeInTheDocument()
    expect(screen.getByDisplayValue('0')).toBeInTheDocument()
  })

  test('저장 버튼 클릭 시 API 호출', async () => {
    api.getSettings.mockResolvedValue({ target_sleep_min: 480 })
    api.saveSettings.mockResolvedValue({ target_sleep_min: 450 })

    render(<TargetSetting />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('8')).toBeInTheDocument()
    })

    const hourInput = screen.getByDisplayValue('8')
    fireEvent.change(hourInput, { target: { value: '7' } })

    const saveBtn = screen.getByText('저장')
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(api.saveSettings).toHaveBeenCalledWith(420)
    })
  })

  test('API 로드 실패 시 폴백', async () => {
    api.getSettings.mockRejectedValue(new Error('fail'))
    render(<TargetSetting />)

    await waitFor(() => {
      expect(screen.getByText('저장')).not.toBeDisabled()
    })
  })

  test('시간 입력 범위 제한 (0~14)', async () => {
    api.getSettings.mockResolvedValue({ target_sleep_min: 480 })
    render(<TargetSetting />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('8')).toBeInTheDocument()
    })

    const hourInput = screen.getByDisplayValue('8')
    fireEvent.change(hourInput, { target: { value: '99' } })
    expect(hourInput.value).toBe('14')

    fireEvent.change(hourInput, { target: { value: '-5' } })
    expect(hourInput.value).toBe('0')
  })
})
