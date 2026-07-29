import { describe, test, expect, beforeEach, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
})

async function loadApi() {
  vi.stubEnv('VITE_STORAGE_MODE', 'local')
  const mod = await import('./api.js')
  return mod.api
}

describe('local api user storage', () => {
  test('사용자별 수면 기록을 분리 저장', async () => {
    const api = await loadApi()

    localStorage.setItem('sleep_tracker_user', 'muzi')
    await api.saveSleep({
      start_time: '2026-07-29T23:00:00+09:00',
      end_time: '2026-07-30T07:00:00+09:00'
    })

    localStorage.setItem('sleep_tracker_user', 'test')
    expect(await api.getWeeks()).toEqual([])

    localStorage.setItem('sleep_tracker_user', 'muzi')
    expect(await api.getWeeks()).toEqual(['2026-07-27'])
  })

  test('사용자별 목표 수면 시간을 분리 저장', async () => {
    const api = await loadApi()

    localStorage.setItem('sleep_tracker_user', 'muzi')
    await api.saveSettings(420)

    localStorage.setItem('sleep_tracker_user', 'test')
    expect(await api.getSettings()).toEqual({ target_sleep_min: 480 })

    localStorage.setItem('sleep_tracker_user', 'muzi')
    expect(await api.getSettings()).toEqual({ target_sleep_min: 420 })
  })
})
