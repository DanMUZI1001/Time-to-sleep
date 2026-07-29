import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SoundPlayer from './SoundPlayer.jsx'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SoundPlayer', () => {
  test('6개 사운드 카드 렌더링', () => {
    render(<SoundPlayer />)
    expect(screen.getByText('백색소음')).toBeInTheDocument()
    expect(screen.getByText('브라운노이즈')).toBeInTheDocument()
    expect(screen.getByText('빗소리')).toBeInTheDocument()
    expect(screen.getByText('말랑이소리')).toBeInTheDocument()
    expect(screen.getByText('선풍기 바람소리')).toBeInTheDocument()
    expect(screen.getByText('보글보글 소리')).toBeInTheDocument()
  })

  test('초기 상태: 재생 중인 소리 없음', () => {
    render(<SoundPlayer />)
    expect(screen.getByText('재생 중인 소리 없음')).toBeInTheDocument()
  })

  test('볼륨 슬라이더 표시', () => {
    render(<SoundPlayer />)
    const slider = screen.getByRole('slider')
    expect(slider).toBeInTheDocument()
  })

  test('사운드 카드 설명 표시', () => {
    render(<SoundPlayer />)
    expect(screen.getByText('고르게 퍼지는 정적')).toBeInTheDocument()
    expect(screen.getByText('낮고 깊은 포근한 소리')).toBeInTheDocument()
    expect(screen.getByText('팬이 도는 일정한 바람')).toBeInTheDocument()
    expect(screen.getByText('작게 올라오는 물방울')).toBeInTheDocument()
  })

  test('탭하여 재생 메시지 표시', () => {
    render(<SoundPlayer />)
    const tapMessages = screen.getAllByText('탭하여 재생')
    expect(tapMessages.length).toBe(6)
  })
})
