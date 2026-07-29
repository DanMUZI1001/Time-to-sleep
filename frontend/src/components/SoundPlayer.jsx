import { useState, useRef, useEffect } from 'react'

const SOUNDS = [
  { id: 'white', name: '백색소음', color: '#e8eaff', desc: '고르게 퍼지는 정적' },
  { id: 'brown', name: '브라운노이즈', color: '#a98c5a', desc: '낮고 깊은 포근한 소리' },
  { id: 'rain', name: '빗소리', color: '#5aa9e8', desc: '부드러운 빗방울' },
  { id: 'squishy', name: '말랑이소리', color: '#ff9ad5', desc: '말랑말랑 스퀴시' },
  { id: 'fan', name: '선풍기 바람소리', color: '#9fd3ff', desc: '팬이 도는 일정한 바람' },
  { id: 'bubbles', name: '보글보글 소리', color: '#78f0d4', desc: '작게 올라오는 물방울' }
]

function createNoiseBuffer(ctx, type) {
  const len = ctx.sampleRate * 2
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  if (type === 'white') {
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  } else if (type === 'brown') {
    let last = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      last = (last + 0.02 * w) / 1.02
      data[i] = last * 3.5
    }
  } else if (type === 'rain') {
    let b0 = 0, b1 = 0, b2 = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99 * b0 + 0.0555179 * w
      b1 = 0.96 * b1 + 0.085 * w
      b2 = 0.57 * b2 + 0.25 * w
      data[i] = (b0 + b1 + b2) * 0.4
    }
  }
  return buf
}

function startNoise(ctx, dest, type) {
  const src = ctx.createBufferSource()
  src.buffer = createNoiseBuffer(ctx, type)
  src.loop = true
  src.connect(dest)
  src.start()
  return () => { try { src.stop() } catch {} }
}

function startRain(ctx, dest) {
  const src = ctx.createBufferSource()
  src.buffer = createNoiseBuffer(ctx, 'rain')
  src.loop = true
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'; hp.frequency.value = 500
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'; lp.frequency.value = 2200
  src.connect(hp); hp.connect(lp); lp.connect(dest)
  src.start()
  return () => { try { src.stop() } catch {} }
}

function startSquishy(ctx, dest) {
  let stopped = false
  const squelch = () => {
    if (stopped) return
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(380, t)
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.18)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 7
    const eg = ctx.createGain()
    eg.gain.setValueAtTime(0, t)
    eg.gain.linearRampToValueAtTime(0.5, t + 0.02)
    eg.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
    osc.connect(lp); lp.connect(eg); eg.connect(dest)
    osc.start(t); osc.stop(t + 0.25)
    setTimeout(squelch, 500 + Math.random() * 700)
  }
  squelch()
  return () => { stopped = true }
}

function startFan(ctx, dest) {
  const noise = ctx.createBufferSource()
  noise.buffer = createNoiseBuffer(ctx, 'brown')
  noise.loop = true

  const air = ctx.createBiquadFilter()
  air.type = 'bandpass'
  air.frequency.value = 420
  air.Q.value = 0.7

  const hum = ctx.createOscillator()
  hum.type = 'sine'
  hum.frequency.value = 92

  const humGain = ctx.createGain()
  humGain.gain.value = 0.08

  const wobble = ctx.createOscillator()
  wobble.type = 'sine'
  wobble.frequency.value = 0.35

  const wobbleGain = ctx.createGain()
  wobbleGain.gain.value = 0.05

  const windGain = ctx.createGain()
  windGain.gain.value = 0.35

  wobble.connect(wobbleGain)
  wobbleGain.connect(windGain.gain)
  noise.connect(air)
  air.connect(windGain)
  windGain.connect(dest)
  hum.connect(humGain)
  humGain.connect(dest)

  noise.start()
  hum.start()
  wobble.start()

  return () => {
    try { noise.stop() } catch {}
    try { hum.stop() } catch {}
    try { wobble.stop() } catch {}
  }
}

function startBubbles(ctx, dest) {
  let stopped = false
  const timers = new Set()

  const schedule = () => {
    if (stopped) return
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(260 + Math.random() * 220, t)
    osc.frequency.exponentialRampToValueAtTime(700 + Math.random() * 420, t + 0.12)

    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 620
    bp.Q.value = 4

    const eg = ctx.createGain()
    eg.gain.setValueAtTime(0, t)
    eg.gain.linearRampToValueAtTime(0.18 + Math.random() * 0.14, t + 0.015)
    eg.gain.exponentialRampToValueAtTime(0.001, t + 0.18)

    osc.connect(bp)
    bp.connect(eg)
    eg.connect(dest)
    osc.start(t)
    osc.stop(t + 0.22)

    const timer = setTimeout(schedule, 120 + Math.random() * 260)
    timers.add(timer)
  }

  schedule()
  return () => {
    stopped = true
    timers.forEach(timer => clearTimeout(timer))
  }
}

function startSound(ctx, master, id) {
  const g = ctx.createGain()
  g.gain.value = 0.8
  g.connect(master)
  if (id === 'white') return startNoise(ctx, g, 'white')
  if (id === 'brown') return startNoise(ctx, g, 'brown')
  if (id === 'rain') return startRain(ctx, g)
  if (id === 'squishy') return startSquishy(ctx, g)
  if (id === 'fan') return startFan(ctx, g)
  if (id === 'bubbles') return startBubbles(ctx, g)
  return () => {}
}

export default function SoundPlayer() {
  const ctxRef = useRef(null)
  const masterRef = useRef(null)
  const stopsRef = useRef({})
  const [active, setActive] = useState({})
  const [volume, setVolume] = useState(0.5)

  const ensureCtx = () => {
    if (!ctxRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const master = ctx.createGain()
      master.gain.value = volume
      master.connect(ctx.destination)
      ctxRef.current = ctx
      masterRef.current = master
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
    return ctxRef.current
  }

  const toggle = (id) => {
    const ctx = ensureCtx()
    if (active[id]) {
      stopsRef.current[id]?.()
      delete stopsRef.current[id]
      setActive(a => { const n = { ...a }; delete n[id]; return n })
    } else {
      stopsRef.current[id] = startSound(ctx, masterRef.current, id)
      setActive(a => ({ ...a, [id]: true }))
    }
  }

  const changeVol = (v) => {
    setVolume(Number(v))
    if (masterRef.current) masterRef.current.gain.value = Number(v)
  }

  const stopAll = () => {
    Object.values(stopsRef.current).forEach(fn => fn())
    stopsRef.current = {}
    setActive({})
  }

  useEffect(() => () => { Object.values(stopsRef.current).forEach(fn => fn()) }, [])

  const playingCount = Object.keys(active).length

  return (
    <div className="card">
      <h2>수면 사운드</h2>
      <div className="sounds">
        {SOUNDS.map(s => (
          <div key={s.id}
            className={`sound-card ${active[s.id] ? 'playing' : ''}`}
            onClick={() => toggle(s.id)}>
            <div className="icon">
              <span style={{
                display: 'inline-block',
                width: 34, height: 34, borderRadius: '50%',
                background: s.color, opacity: active[s.id] ? 1 : 0.6,
                boxShadow: active[s.id] ? `0 0 16px ${s.color}` : 'none'
              }} />
            </div>
            <div className="name">{s.name}</div>
            <div className="desc">{s.desc}</div>
            <div style={{ fontSize: 12, marginTop: 8, color: active[s.id] ? 'var(--accent)' : 'var(--muted)' }}>
              {active[s.id] ? '재생 중 · 탭하여 정지' : '탭하여 재생'}
            </div>
          </div>
        ))}
      </div>

      <div className="now-playing">
        <div className="np-name">
          {playingCount > 0 ? `${playingCount}개 소리 재생 중` : '재생 중인 소리 없음'}
        </div>
        <div className="vol">
          <label style={{ margin: 0 }}>볼륨</label>
          <input type="range" min="0" max="1" step="0.01" value={volume}
            onChange={e => changeVol(e.target.value)} />
          {playingCount > 0 && <button className="btn secondary" onClick={stopAll} style={{ padding: '8px 14px' }}>전체 정지</button>}
        </div>
      </div>
      <p className="hint">두 개 이상 동시에 들을 수 있습니다. 소리는 브라우저에서 실시간 생성됩니다.</p>
    </div>
  )
}
