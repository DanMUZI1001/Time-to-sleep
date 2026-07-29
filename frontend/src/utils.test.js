import { describe, test, expect } from 'vitest'
import {
  startOfWeek, isoDate, addDays, fmtMin, fmtHM,
  fmtDurShort, signDiff, fmtRange, statusOf, blocksForDay
} from './utils.js'

describe('startOfWeek', () => {
  test('수요일 -> 해당 주 월요일', () => {
    const wed = new Date(2026, 6, 29)
    const mon = startOfWeek(wed)
    expect(mon.getDay()).toBe(1)
    expect(mon.getDate()).toBe(27)
  })

  test('월요일 -> 자기 자신', () => {
    const mon = new Date(2026, 6, 27)
    const result = startOfWeek(mon)
    expect(result.getDate()).toBe(27)
  })

  test('일요일 -> 이전 주 월요일', () => {
    const sun = new Date(2026, 7, 2)
    const mon = startOfWeek(sun)
    expect(mon.getDay()).toBe(1)
    expect(mon.getDate()).toBe(27)
  })

  test('토요일 -> 해당 주 월요일', () => {
    const sat = new Date(2026, 6, 25)
    const mon = startOfWeek(sat)
    expect(mon.getDay()).toBe(1)
    expect(mon.getDate()).toBe(20)
  })
})

describe('isoDate', () => {
  test('YYYY-MM-DD 형식 반환', () => {
    expect(isoDate(new Date(2026, 6, 9))).toBe('2026-07-09')
    expect(isoDate(new Date(2026, 0, 1))).toBe('2026-01-01')
    expect(isoDate(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  test('월/일 zero-pad', () => {
    expect(isoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('addDays', () => {
  test('7일 후', () => {
    expect(addDays('2026-07-27', 7)).toBe('2026-08-03')
  })

  test('7일 전', () => {
    expect(addDays('2026-07-27', -7)).toBe('2026-07-20')
  })

  test('0일 (변경 없음)', () => {
    expect(addDays('2026-07-27', 0)).toBe('2026-07-27')
  })

  test('월 경계', () => {
    expect(addDays('2026-01-30', 5)).toBe('2026-02-04')
  })
})

describe('fmtMin / fmtHM', () => {
  test('0분', () => {
    expect(fmtMin(0)).toBe('0시간 0분')
  })

  test('60분 = 1시간 0분', () => {
    expect(fmtMin(60)).toBe('1시간 0분')
  })

  test('480분 = 8시간 0분', () => {
    expect(fmtMin(480)).toBe('8시간 0분')
  })

  test('450분 = 7시간 30분', () => {
    expect(fmtMin(450)).toBe('7시간 30분')
  })

  test('소수점 반올림', () => {
    expect(fmtMin(90.4)).toBe('1시간 30분')
    expect(fmtMin(90.6)).toBe('1시간 31분')
  })
})

describe('fmtDurShort', () => {
  test('정수 시간', () => {
    expect(fmtDurShort(480)).toBe('8h')
  })

  test('시간+분', () => {
    expect(fmtDurShort(450)).toBe('7h 30m')
  })

  test('0분', () => {
    expect(fmtDurShort(0)).toBe('0h')
  })
})

describe('signDiff', () => {
  test('0 = 목표 일치', () => {
    expect(signDiff(0)).toBe('목표 일치')
  })

  test('양수 = 더 잠', () => {
    expect(signDiff(60)).toBe('+1시간 0분 더 잠')
  })

  test('음수 = 덜 잠', () => {
    expect(signDiff(-90)).toBe('-1시간 30분 덜 잠')
  })
})

describe('fmtRange', () => {
  test('월~일 범위', () => {
    expect(fmtRange('2026-07-27')).toBe('7/27 ~ 8/2')
  })

  test('월 경계 범위', () => {
    expect(fmtRange('2026-01-26')).toBe('1/26 ~ 2/1')
  })
})

describe('statusOf', () => {
  test('차이 60분 이하 = 좋음', () => {
    expect(statusOf(0).text).toBe('좋음')
    expect(statusOf(60).text).toBe('좋음')
    expect(statusOf(-60).text).toBe('좋음')
  })

  test('차이 61~120분 = 보통', () => {
    expect(statusOf(61).text).toBe('보통')
    expect(statusOf(120).text).toBe('보통')
    expect(statusOf(-120).text).toBe('보통')
  })

  test('차이 121분 이상 = 나쁨', () => {
    expect(statusOf(121).text).toBe('나쁨')
    expect(statusOf(-200).text).toBe('나쁨')
  })

  test('cls 반환', () => {
    expect(statusOf(0).cls).toBe('good')
    expect(statusOf(90).cls).toBe('normal')
    expect(statusOf(200).cls).toBe('bad')
  })
})

describe('blocksForDay', () => {
  const dayStart = new Date(2026, 6, 29, 0, 0, 0)

  test('당일 수면 (22:00~23:00)', () => {
    const record = {
      start_time: '2026-07-29T22:00:00',
      end_time: '2026-07-29T23:00:00'
    }
    const block = blocksForDay(record, dayStart)
    expect(block).not.toBeNull()
    expect(block.startMin).toBe(22 * 60)
    expect(block.endMin).toBe(23 * 60)
    expect(block.durMin).toBe(60)
  })

  test('자정 넘김 수면 (23:00~익일 07:00)', () => {
    const record = {
      start_time: '2026-07-29T23:00:00',
      end_time: '2026-07-30T07:00:00'
    }
    const block = blocksForDay(record, dayStart)
    expect(block).not.toBeNull()
    expect(block.startMin).toBe(23 * 60)
    expect(block.endMin).toBe(24 * 60)
    expect(block.durMin).toBe(60)
  })

  test('다른 날 수면은 null', () => {
    const record = {
      start_time: '2026-07-28T22:00:00',
      end_time: '2026-07-28T23:00:00'
    }
    const block = blocksForDay(record, dayStart)
    expect(block).toBeNull()
  })

  test('경계 정확히 끝나는 수면', () => {
    const record = {
      start_time: '2026-07-29T00:00:00',
      end_time: '2026-07-30T00:00:00'
    }
    const block = blocksForDay(record, dayStart)
    expect(block).not.toBeNull()
    expect(block.startMin).toBe(0)
    expect(block.endMin).toBe(1440)
    expect(block.durMin).toBe(1440)
  })
})
