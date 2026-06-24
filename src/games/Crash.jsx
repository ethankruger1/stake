import { useState, useEffect, useRef, useCallback } from 'react'
import { TrendingUp, TrendingDown, Users } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import BetInput from '../components/UI/BetInput'

function generateCrashPoint() {
  const r = Math.random()
  if (r < 0.01) return 1.00
  return Math.max(1.00, +(Math.floor(100 / (1 - r * 0.99)) / 100).toFixed(2))
}

const FAKE_USERS = ['Dragon88','CryptoKing','MoonBet','LuckyAce','WhaleBet','GoldFish','NightOwl','SunRider','RocketBoy','DiamondH','CrashBro','AceHigh']

function historyColor(v) {
  if (v >= 10) return 'text-purple-400 bg-purple-500/20 border-purple-500/30'
  if (v >= 2)  return 'text-vault-green bg-vault-green/20 border-vault-green/30'
  return 'text-red-400 bg-red-500/20 border-red-500/30'
}

// Live chart SVG
function CrashChart({ phase, multiplier, crashed, chartPoints }) {
  const W = 500, H = 280
  const padding = { left: 40, bottom: 30, right: 10, top: 10 }
  const iW = W - padding.left - padding.right
  const iH = H - padding.top - padding.bottom

  const maxX = Math.max(chartPoints.length, 10)
  const maxY = Math.max(multiplier * 1.1, 2)

  const toSvg = (xi, yi) => ({
    x: padding.left + (xi / maxX) * iW,
    y: H - padding.bottom - ((yi - 1) / (maxY - 1)) * iH,
  })

  const pts = chartPoints.map((y, i) => toSvg(i, y))
  const pathD = pts.length > 1
    ? `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : ''

  const fillD = pts.length > 1
    ? `M ${padding.left} ${H - padding.bottom} L ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ` L ${pts[pts.length-1].x} ${H - padding.bottom} Z`
    : ''

  const lineColor = crashed ? '#ef4444' : '#3bc117'
  const last = pts[pts.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {[1, 1.5, 2, 3, 5, 10].filter(v => v <= maxY).map(v => {
        const { y } = toSvg(0, v)
        return (
          <g key={v}>
            <line x1={padding.left} y1={y} x2={W - padding.right} y2={y}
              stroke="#ffffff08" strokeWidth={1} />
            <text x={padding.left - 4} y={y + 4} textAnchor="end" fill="#4a5568"
              fontSize={9} fontFamily="monospace">{v}×</text>
          </g>
        )
      })}

      {/* Fill area */}
      {fillD && <path d={fillD} fill="url(#chartFill)" />}

      {/* Main line */}
      {pathD && (
        <path d={pathD} stroke={lineColor} strokeWidth={2.5} fill="none"
          strokeLinecap="round" strokeLinejoin="round"
          filter={crashed ? 'none' : 'url(#glow)'}
        />
      )}

      {/* Current point dot */}
      {last && !crashed && (
        <g>
          <circle cx={last.x} cy={last.y} r={6} fill={lineColor} opacity={0.3} />
          <circle cx={last.x} cy={last.y} r={4} fill={lineColor} />
        </g>
      )}

      {/* X axis */}
      <line x1={padding.left} y1={H - padding.bottom} x2={W - padding.right} y2={H - padding.bottom}
        stroke="#1f2937" strokeWidth={1} />
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={H - padding.bottom}
        stroke="#1f2937" strokeWidth={1} />
    </svg>
  )
}

export default function Crash() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [bet, setBet] = useState(1)
  const [autoCashout, setAutoCashout] = useState(2.0)
  const [useAutoCashout, setUseAutoCashout] = useState(false)
  const [phase, setPhase] = useState('waiting')
  const [multiplier, setMultiplier] = useState(1.00)
  const [crashPoint, setCrashPoint] = useState(null)
  const [cashedOut, setCashedOut] = useState(false)
  const [betPlaced, setBetPlaced] = useState(false)
  const [history, setHistory] = useState([5.23,1.05,2.41,8.77,1.12,14.3,1.01,3.56,1.88,22.1])
  const [countdown, setCountdown] = useState(5)
  const [chartPoints, setChartPoints] = useState([1])
  const [players, setPlayers] = useState([])
  const intervalRef = useRef(null)
  const crashRef = useRef(null)
  const startTimeRef = useRef(null)
  const betRef = useRef(bet)
  const betPlacedRef = useRef(false)
  const cashedOutRef = useRef(false)

  useEffect(() => { betRef.current = bet }, [bet])

  const genPlayers = () => Array.from({ length: Math.floor(Math.random() * 10 + 6) }, (_, i) => ({
    name: FAKE_USERS[i % FAKE_USERS.length],
    bet: (Math.random() * 800 + 10).toFixed(2),
    cashedAt: null,
  }))

  const startCrash = useCallback(() => {
    setPhase('running')
    setChartPoints([1])
    startTimeRef.current = Date.now()

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const m = Math.pow(Math.E, elapsed * 0.65)
      const rounded = +Math.max(1, m).toFixed(2)
      setMultiplier(rounded)
      setChartPoints(prev => [...prev, rounded])

      setPlayers(prev => prev.map(p => {
        if (!p.cashedAt && Math.random() < 0.008 * (rounded / 2)) {
          return { ...p, cashedAt: rounded }
        }
        return p
      }))

      if (rounded >= crashRef.current) {
        clearInterval(intervalRef.current)
        setMultiplier(crashRef.current)
        setChartPoints(prev => [...prev, crashRef.current])
        setPhase('crashed')
        setHistory(h => [crashRef.current, ...h.slice(0, 19)])
        if (betPlacedRef.current && !cashedOutRef.current) {
          addBetHistory({ id: Date.now(), game: 'Crash', bet: betRef.current.toFixed(2), mult: '0.00', payout: '0.00', won: false, time: Date.now() })
          addNotification(`💥 Crashed at ${crashRef.current}×! Lost $${betRef.current.toFixed(2)}`, 'loss')
        }
        setTimeout(runCountdown, 3500)
      }
    }, 80)
  }, [addBetHistory, addNotification])

  const runCountdown = useCallback(() => {
    setPhase('waiting')
    setCountdown(5)
    setMultiplier(1.00)
    setCashedOut(false)
    cashedOutRef.current = false
    setBetPlaced(false)
    betPlacedRef.current = false
    setChartPoints([1])
    const cp = generateCrashPoint()
    setCrashPoint(cp)
    crashRef.current = cp
    setPlayers(genPlayers())

    let c = 5
    const cd = setInterval(() => {
      c--
      setCountdown(c)
      if (c <= 0) { clearInterval(cd); startCrash() }
    }, 1000)
  }, [startCrash])

  useEffect(() => {
    runCountdown()
    return () => clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    if (phase === 'running' && betPlaced && !cashedOut && useAutoCashout && multiplier >= autoCashout) {
      cashout()
    }
  }, [multiplier])

  const placeBetHandler = () => {
    if (phase !== 'waiting' || betPlaced || bet <= 0 || bet > balance) return
    if (!placeBet(bet)) return
    setBetPlaced(true)
    betPlacedRef.current = true
  }

  const cashout = useCallback(() => {
    if (!betPlacedRef.current || cashedOutRef.current || phase !== 'running') return
    const currentMult = multiplier
    const payout = +(betRef.current * currentMult).toFixed(2)
    addWin(payout)
    setCashedOut(true)
    cashedOutRef.current = true
    addBetHistory({ id: Date.now(), game: 'Crash', bet: betRef.current.toFixed(2), mult: currentMult.toFixed(2), payout: payout.toFixed(2), won: true, time: Date.now() })
    addNotification(`🚀 Cashed out ${currentMult.toFixed(2)}×! Won $${payout.toFixed(2)}`, 'win')
  }, [phase, multiplier, addWin, addBetHistory, addNotification])

  const multColor = phase === 'crashed' ? 'text-red-400' : multiplier >= 3 ? 'text-purple-400' : multiplier >= 2 ? 'text-vault-green' : 'text-white'

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header + history */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
          <TrendingUp size={20} className="text-green-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Crash</h1>
          <p className="text-xs text-gray-500">VaultBet Original</p>
        </div>
        <div className="ml-auto flex gap-1.5 flex-wrap">
          {history.slice(0, 10).map((v, i) => (
            <span key={i} className={`badge font-black text-xs border ${historyColor(v)}`}>{v.toFixed(2)}×</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-5">
        {/* Left panel */}
        <div className="space-y-4">
          <div className="panel space-y-4">
            <BetInput value={bet} onChange={setBet} disabled={phase !== 'waiting' || betPlaced} />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Auto Cashout</label>
                <button onClick={() => setUseAutoCashout(v => !v)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${useAutoCashout ? 'bg-vault-green' : 'bg-vault-border'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow ${useAutoCashout ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="relative">
                <input type="number" min="1.01" step="0.1" value={autoCashout}
                  onChange={e => setAutoCashout(parseFloat(e.target.value) || 2)}
                  disabled={!useAutoCashout}
                  className="input-field pr-8 disabled:opacity-40" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">×</span>
              </div>
            </div>

            {/* Action button */}
            {phase === 'waiting' ? (
              <button onClick={placeBetHandler} disabled={betPlaced || bet <= 0 || bet > balance}
                className={`w-full py-3 rounded-xl font-bold transition-all ${betPlaced ? 'bg-vault-green/10 border border-vault-green/30 text-vault-green cursor-default' : 'btn-primary'}`}>
                {betPlaced ? `✓ Queued — $${bet.toFixed(2)}` : `Bet $${bet.toFixed(2)}`}
              </button>
            ) : phase === 'running' ? (
              <button onClick={cashout} disabled={!betPlaced || cashedOut}
                className={`w-full py-3 rounded-xl font-bold transition-all text-lg ${
                  !betPlaced ? 'bg-vault-panel border border-vault-border text-gray-600 cursor-default' :
                  cashedOut ? 'bg-vault-green/10 border border-vault-green/30 text-vault-green cursor-default' :
                  'bg-yellow-500 hover:bg-yellow-400 text-black animate-pulse shadow-lg shadow-yellow-500/30'
                }`}>
                {!betPlaced ? 'Waiting for next round' :
                 cashedOut ? `✓ $${(bet * multiplier).toFixed(2)} secured` :
                 `Cash Out  $${(bet * multiplier).toFixed(2)}`}
              </button>
            ) : (
              <button onClick={placeBetHandler} disabled={betPlaced}
                className={`w-full py-3 rounded-xl font-bold ${betPlaced ? 'bg-vault-green/10 border border-vault-green/30 text-vault-green' : 'btn-primary'}`}>
                {betPlaced ? '✓ Queued for next round' : 'Bet for Next Round'}
              </button>
            )}
          </div>

          {/* Players list */}
          <div className="panel">
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-gray-500" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Players ({players.length})</span>
            </div>
            <div className="space-y-0.5 max-h-52 overflow-y-auto">
              {players.map((p, i) => (
                <div key={i} className="grid grid-cols-3 items-center text-xs py-1 px-1 rounded hover:bg-vault-hover/30">
                  <span className="text-gray-400 truncate">{p.name}</span>
                  <span className="text-gray-500 text-center">${p.bet}</span>
                  {p.cashedAt ? (
                    <span className="text-vault-green font-bold text-right">{p.cashedAt.toFixed(2)}×</span>
                  ) : phase === 'crashed' ? (
                    <span className="text-red-400 text-right">💥</span>
                  ) : (
                    <span className="text-gray-700 text-right">—</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className={`panel overflow-hidden relative transition-colors duration-500 ${phase === 'crashed' ? 'border-red-500/30 bg-red-900/5' : ''}`}>
          {/* Multiplier overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
            {phase === 'waiting' ? (
              <div className="text-center">
                <div className="text-6xl font-black text-gray-700">{countdown}</div>
                <div className="text-gray-600 mt-1 text-sm">Starting in...</div>
                <div className="flex gap-1 justify-center mt-3">
                  {[...Array(5)].map((_,i) => (
                    <div key={i} className={`h-1 w-8 rounded-full transition-all duration-1000 ${i < 5-countdown ? 'bg-vault-green' : 'bg-vault-border'}`} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className={`font-black transition-all duration-100 drop-shadow-2xl ${
                  phase === 'crashed' ? 'text-6xl text-red-400' : `text-7xl ${multColor}`
                }`} style={{ textShadow: phase !== 'crashed' ? `0 0 30px currentColor` : 'none' }}>
                  {multiplier.toFixed(2)}×
                </div>
                {phase === 'crashed' && (
                  <div className="mt-2 flex items-center gap-2 justify-center">
                    <TrendingDown size={20} className="text-red-400" />
                    <span className="text-red-400 font-bold">CRASHED</span>
                  </div>
                )}
                {phase === 'running' && cashedOut && (
                  <div className="mt-1 text-vault-green text-sm font-bold">✓ Cashed out!</div>
                )}
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="h-72 opacity-80">
            <CrashChart phase={phase} multiplier={multiplier} crashed={phase === 'crashed'} chartPoints={chartPoints} />
          </div>

          {/* Rocket */}
          {phase === 'running' && (
            <div className="absolute bottom-4 right-4 text-4xl" style={{ animation: 'float 1.5s ease-in-out infinite alternate' }}>
              🚀
              <style>{`@keyframes float { from { transform: translateY(0) rotate(-45deg); } to { transform: translateY(-12px) rotate(-45deg); } }`}</style>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
