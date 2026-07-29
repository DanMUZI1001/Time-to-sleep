import { test, describe, before, after } from 'node:test'
import assert from 'node:assert'
import { pathToFileURL } from 'url'

const PORT = 3999
const BASE = `http://localhost:${PORT}/api`

async function req(method, path, body) {
  const opts = { method, headers: {} }
  if (body) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }
  const r = await fetch(`${BASE}${path}`, opts)
  const json = await r.json().catch(() => null)
  return { status: r.status, body: json }
}

let server

before(async () => {
  process.env.DB_PATH = ':memory:'
  const mod = await import('./index.js')
  server = mod.app.listen(PORT)
  await new Promise(r => setTimeout(r, 200))
})

after(() => {
  if (server) server.close()
})

describe('GET /api/settings', () => {
  test('기본값 480 반환', async () => {
    const { status, body } = await req('GET', '/settings')
    assert.strictEqual(status, 200)
    assert.strictEqual(body.target_sleep_min, 480)
  })
})

describe('POST /api/settings', () => {
  test('정상 저장', async () => {
    const { status, body } = await req('POST', '/settings', { target_sleep_min: 420 })
    assert.strictEqual(status, 200)
    assert.strictEqual(body.target_sleep_min, 420)

    const get = await req('GET', '/settings')
    assert.strictEqual(get.body.target_sleep_min, 420)
  })

  test('문자열 입력 시 400', async () => {
    const { status, body } = await req('POST', '/settings', { target_sleep_min: 'abc' })
    assert.strictEqual(status, 400)
    assert.ok(body.error)
  })

  test('음수 입력 시 400', async () => {
    const { status } = await req('POST', '/settings', { target_sleep_min: -1 })
    assert.strictEqual(status, 400)
  })

  test('0은 허용', async () => {
    const { status, body } = await req('POST', '/settings', { target_sleep_min: 0 })
    assert.strictEqual(status, 200)
    assert.strictEqual(body.target_sleep_min, 0)
  })
})

describe('POST /api/sleep', () => {
  test('정상 수면 기록 생성 (23:00~07:00 = 480분)', async () => {
    const { status, body } = await req('POST', '/sleep', {
      start_time: '2026-07-28T23:00:00+09:00',
      end_time: '2026-07-29T07:00:00+09:00',
      wake_time: '07:00'
    })
    assert.strictEqual(status, 200)
    assert.ok(body.id)
    assert.strictEqual(body.duration_min, 480)
    assert.strictEqual(body.week_start, '2026-07-27')
  })

  test('짧은 수면 (30분)', async () => {
    const { status, body } = await req('POST', '/sleep', {
      start_time: '2026-07-29T13:00:00Z',
      end_time: '2026-07-29T13:30:00Z'
    })
    assert.strictEqual(status, 200)
    assert.strictEqual(body.duration_min, 30)
  })

  test('end <= start 시 400', async () => {
    const { status } = await req('POST', '/sleep', {
      start_time: '2026-07-29T10:00:00Z',
      end_time: '2026-07-29T08:00:00Z'
    })
    assert.strictEqual(status, 400)
  })

  test('같은 시간 start=end 시 400', async () => {
    const { status } = await req('POST', '/sleep', {
      start_time: '2026-07-29T10:00:00Z',
      end_time: '2026-07-29T10:00:00Z'
    })
    assert.strictEqual(status, 400)
  })

  test('잘못된 날짜 형식 시 400', async () => {
    const { status } = await req('POST', '/sleep', {
      start_time: 'not-a-date',
      end_time: '2026-07-29T10:00:00Z'
    })
    assert.strictEqual(status, 400)
  })

  test('필드 누락 시 400', async () => {
    const { status } = await req('POST', '/sleep', {
      start_time: '2026-07-29T10:00:00Z'
    })
    assert.strictEqual(status, 400)
  })
})

describe('GET /api/sleep', () => {
  test('전체 조회', async () => {
    const { status, body } = await req('GET', '/sleep')
    assert.strictEqual(status, 200)
    assert.ok(Array.isArray(body))
    assert.ok(body.length >= 2)
  })

  test('week_start 필터링', async () => {
    const { status, body } = await req('GET', '/sleep?week_start=2026-07-27')
    assert.strictEqual(status, 200)
    assert.ok(body.every(r => r.week_start === '2026-07-27'))
  })
})

describe('GET /api/weeks', () => {
  test('주차 목록 반환', async () => {
    const { status, body } = await req('GET', '/weeks')
    assert.strictEqual(status, 200)
    assert.ok(Array.isArray(body))
    assert.ok(body.includes('2026-07-27'))
  })
})

describe('GET /api/week/:week_start', () => {
  test('주간 집계 데이터 반환', async () => {
    const { status, body } = await req('GET', '/week/2026-07-27')
    assert.strictEqual(status, 200)
    assert.strictEqual(body.week_start, '2026-07-27')
    assert.ok(body.records)
    assert.strictEqual(body.target_min, 0)
    assert.strictEqual(body.weekly_target_min, 0)
    assert.strictEqual(body.diff_min, body.total_min)
    assert.ok(['좋음', '보통', '나쁨'].includes(body.status))
  })

  test('빈 주차 조회', async () => {
    const { status, body } = await req('GET', '/week/2026-01-05')
    assert.strictEqual(status, 200)
    assert.strictEqual(body.records.length, 0)
    assert.strictEqual(body.total_min, 0)
  })
})

describe('DELETE /api/sleep/:id', () => {
  test('기록 삭제', async () => {
    const created = await req('POST', '/sleep', {
      start_time: '2026-07-30T01:00:00Z',
      end_time: '2026-07-30T08:00:00Z'
    })
    const id = created.body.id

    const del = await req('DELETE', `/sleep/${id}`)
    assert.strictEqual(del.status, 200)
    assert.strictEqual(del.body.ok, true)

    const list = await req('GET', '/sleep')
    assert.ok(!list.body.some(r => r.id === id))
  })

  test('존재하지 않는 id 삭제해도 200', async () => {
    const { status, body } = await req('DELETE', '/sleep/99999')
    assert.strictEqual(status, 200)
    assert.strictEqual(body.ok, true)
  })
})

describe('유틸리티 함수', () => {
  test('startOfWeek - 월요일 반환', async () => {
    const { startOfWeek } = await import('./index.js')
    const wed = new Date('2026-07-29T10:00:00')
    const mon = startOfWeek(wed)
    assert.strictEqual(mon.getDay(), 1)
    assert.strictEqual(mon.getDate(), 27)
  })

  test('startOfWeek - 일요일은 이전 주 월요일', async () => {
    const { startOfWeek } = await import('./index.js')
    const sun = new Date('2026-08-02T10:00:00')
    const mon = startOfWeek(sun)
    assert.strictEqual(mon.getDay(), 1)
    assert.strictEqual(mon.getDate(), 27)
  })

  test('isoDate - YYYY-MM-DD 형식', async () => {
    const { isoDate } = await import('./index.js')
    assert.strictEqual(isoDate(new Date(2026, 6, 9)), '2026-07-09')
    assert.strictEqual(isoDate(new Date(2026, 0, 1)), '2026-01-01')
  })

  test('diffMin - 분 단위 차이', async () => {
    const { diffMin } = await import('./index.js')
    const a = '2026-07-29T23:00:00Z'
    const b = '2026-07-30T07:00:00Z'
    assert.strictEqual(diffMin(a, b), 480)
  })
})
