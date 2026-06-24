import { useState, useCallback, useRef, useEffect } from 'react'
import { CircleDashed, Plus, Minus } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import BetInput from '../components/UI/BetInput'

const W = 480
const H = 540

const PAYOUTS = {
  8:  { low: [5.6,2.1,1.1,1,0.5,1,1.1,2.1,5.6],    medium: [13,3,1.3,0.7,0.4,0.7,1.3,3,13],      high: [29,4,1.5,0.3,0.2,0.3,1.5,4,29] },
  12: { low: [8.9,3,1.4,1.1,1,0.5,1,1.1,1.4,3,8.9], medium: [24,5,2,1.4,0.6,0.4,0.6,1.4,2,5,24],  high: [88,8,3,1.2,0.5,0.3,0.5,1.2,3,8,88] },
  16: { low: [16,9,2,1.4,1.4,1.2,1.1,1,0.5,1,1.1,1.2,1.4,1.4,2,9,16], medium: [110,41,10,5,3,1.5,1,0.5,0.3,0.5,1,1.5,3,5,10,41,110], high: [1000,130,26,9,4,2,0.2,0.2,0.2,0.2,0.2,2,4,9,26,130,1000] },
}

function getPegPositions(rows) {
  const pegs = []
  const spacingY = (H - 120) / (rows + 1)
  const maxPegsInRow = rows + 1
  const spacingX = W / (maxPegsInRow + 1)

  for (let row = 0; row < rows; row++) {
    const count = row + 2
    const totalW = (count - 1) * spacingX
    const startX = (W - totalW) / 2
    const y = 80 + (row + 1) * spacingY
    for (let col = 0; col < count; col++) {
      pegs.push({ x: startX + col * spacingX, y, row, col })
    }
  }
  return pegs
}

function getBucketPositions(rows, payouts) {
  const count = rows + 1
  const bw = W / count
  return payouts.map((mult, i) => ({
    x: i * bw,
    w: bw,
    cx: i * bw + bw / 2,
    mult,
  }))
}

function bucketColor(mult) {
  if (mult >= 50)  return { fill: '#7c3aed', stroke: '#a855f7', text: '#e9d5ff' }
  if (mult >= 10)  return { fill: '#991b1b', stroke: '#ef4444', text: '#fca5a5' }
  if (mult >= 5)   return { fill: '#92400e', stroke: '#f59e0b', text: '#fde68a' }
  if (mult >= 2)   return { fill: '#14532d', stroke: '#22c55e', text: '#86efac' }
  if (mult >= 1)   return { fill: '#1e3a5f', stroke: '#3b82f6', text: '#93c5fd' }
  return             { fill: '#1c1917', stroke: '#44403c', text: '#78716c' }
}

function simulatePath(rows) {
  const pegs = getPegPositions(rows)
  const spacingY = (H - 120) / (rows + 1)
  const maxPegsInRow = rows + 1
  const spacingX = W / (maxPegsInRow + 1)

  let col = 0
  const waypoints = [{ x: W / 2, y: 30, pegIdx: -1 }]

  for (let row = 0; row < rows; row++) {
    const dir = Math.random() < 0.5 ? 0 : 1
    col += dir
    const count = row + 2
    const totalW = (count - 1) * spacingX
    const startX = (W - totalW) / 2
    const px = startX + col * spacingX
    const py = 80 + (row + 1) * spacingY
    const pegIndex = pegs.findIndex(p => p.row === row && p.col === col)
    waypoints.push({ x: px, y: py, pegIdx: pegIndex })
  }

  const bCount = rows + 1
  const bw = W / bCount
  const finalX = (W - (rows) * spacingX) / 2 + col * spacingX
  waypoints.push({ x: finalX, y: H - 35, pegIdx: -1, bucket: col })

  return { waypoints, finalBucket: col }
}

// ── SVG Plinko Board ─────────────────────────────────────────────────────────

function PlinkoBoard({ rows, risk, balls, hitPegs, litBucket }) {
  const pegs = getPegPositions(rows)
  const payouts = PAYOUTS[rows]?.[risk] || PAYOUTS[12].medium
  const buckets = getBucketPositions(rows, payouts)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-lg mx-auto" style={{ maxHeight: 500 }}>
      {/* Background */}
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#1e2438" />
          <stop offset="100%" stopColor="#0d1117" />
        </radialGradient>
        {balls.map(b => (
          <radialGradient key={`bg-${b.id}`} id={`ballGrad-${b.id}`} cx="35%" cy="35%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#ca8a04" />
          </radialGradient>
        ))}
      </defs>
      <rect width={W} height={H} fill="url(#bgGrad)" rx="16" />

      {/* Buckets */}
      {buckets.map((b, i) => {
        const c = bucketColor(b.mult)
        const isLit = litBucket === i
        return (
          <g key={i}>
            <rect x={b.x + 1} y={H - 60} width={b.w - 2} height={60} rx={4}
              fill={isLit ? c.stroke : c.fill}
              stroke={c.stroke} strokeWidth={isLit ? 2 : 1}
              style={{ transition: 'fill 0.2s', filter: isLit ? `drop-shadow(0 0 8px ${c.stroke})` : 'none' }}
            />
            <text x={b.cx} y={H - 38} textAnchor="middle" fill={c.text}
              fontSize={b.mult >= 100 ? 8 : b.mult >= 10 ? 9 : 10} fontWeight="bold">
              {b.mult}×
            </text>
          </g>
        )
      })}

      {/* Pegs */}
      {pegs.map((peg, i) => {
        const isHit = hitPegs.has(i)
        return (
          <circle key={i} cx={peg.x} cy={peg.y} r={5}
            fill={isHit ? '#3bc117' : '#2a3348'}
            stroke={isHit ? '#6ee7b7' : '#3a4560'}
            strokeWidth={isHit ? 2 : 1}
            style={{ transition: 'fill 0.15s, stroke 0.15s', filter: isHit ? 'drop-shadow(0 0 4px #3bc117)' : 'none' }}
          />
        )
      })}

      {/* Balls */}
      {balls.map(b => (
        <g key={b.id}>
          <circle cx={b.x} cy={b.y} r={9} fill={`url(#ballGrad-${b.id})`}
            filter="drop-shadow(0 2px 6px rgba(234,179,8,0.5))"
          />
          <circle cx={b.x - 3} cy={b.y - 3} r={3} fill="rgba(255,255,255,0.4)" />
        </g>
      ))}

      {/* Drop line */}
      <line x1={W / 2} y1={0} x2={W / 2} y2={50} stroke="#3bc11720" strokeWidth={1} strokeDasharray="4,4" />
      <circle cx={W / 2} cy={22} r={6} fill="#3bc11730" stroke="#3bc117" strokeWidth={1} />
      <text x={W / 2} y={26} textAnchor="middle" fill="#3bc117" fontSize={8} fontWeight="bold">▼</text>
    </svg>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

let ballIdCounter = 0

export default function Plinko() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [bet, setBet] = useState(1)
  const [rows, setRows] = useState(12)
  const [risk, setRisk] = useState('medium')
  const [balls, setBalls] = useState([])
  const [hitPegs, setHitPegs] = useState(new Set())
  const [litBucket, setLitBucket] = useState(null)
  const [history, setHistory] = useState([])
  const [lastResult, setLastResult] = useState(null)
  const [dropping, setDropping] = useState(false)
  const [autoDrop, setAutoDrop] = useState(false)
  const autoRef = useRef(false)
  const activeDrops = useRef(0)

  const dropBall = useCallback(async () => {
    if (bet <= 0 || bet > balance) return
    if (!placeBet(bet)) return

    activeDrops.current++
    setDropping(true)

    const { waypoints, finalBucket } = simulatePath(rows)
    const payoutsRow = PAYOUTS[rows]?.[risk] || PAYOUTS[12].medium
    const mult = payoutsRow[finalBucket] ?? 0
    const payout = +(bet * mult).toFixed(2)

    const id = ++ballIdCounter
    setBalls(prev => [...prev, { id, x: W / 2, y: 30 }])

    // Animate through waypoints
    for (let wi = 0; wi < waypoints.length; wi++) {
      const wp = waypoints[wi]
      await new Promise(r => setTimeout(r, wi === 0 ? 0 : 140))

      setBalls(prev => prev.map(b => b.id === id ? { ...b, x: wp.x, y: wp.y } : b))

      if (wp.pegIdx >= 0) {
        setHitPegs(prev => new Set([...prev, wp.pegIdx]))
        setTimeout(() => {
          setHitPegs(prev => { const n = new Set(prev); n.delete(wp.pegIdx); return n })
        }, 250)
      }
    }

    // Land in bucket
    setLitBucket(finalBucket)
    setTimeout(() => setLitBucket(null), 800)
    await new Promise(r => setTimeout(r, 400))
    setBalls(prev => prev.filter(b => b.id !== id))

    // Resolve
    if (payout > 0) addWin(payout)
    addBetHistory({ id: Date.now(), game: 'Plinko', bet: bet.toFixed(2), mult: mult.toFixed(2), payout: payout.toFixed(2), won: payout > bet, time: Date.now() })

    if (payout > bet * 3) addNotification(`🎱 ${mult}× — Big Win! $${payout.toFixed(2)}!`, 'win')
    else if (payout >= bet) addNotification(`🎱 ${mult}× — $${payout.toFixed(2)}`, 'win')
    else addNotification(`🎱 ${mult}× — $${payout.toFixed(2)} back`, 'loss')

    setLastResult({ mult, payout, bucket: finalBucket })
    setHistory(h => [{ mult, won: payout >= bet }, ...h.slice(0, 24)])

    activeDrops.current--
    if (activeDrops.current === 0) setDropping(false)

    if (autoRef.current) {
      setTimeout(() => { if (autoRef.current) dropBall() }, 200)
    }
  }, [bet, balance, rows, risk, placeBet, addWin, addBetHistory, addNotification])

  const toggleAuto = () => {
    autoRef.current = !autoDrop
    setAutoDrop(!autoDrop)
    if (!autoDrop) dropBall()
  }

  const payoutsRow = PAYOUTS[rows]?.[risk] || PAYOUTS[12].medium

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <CircleDashed size={20} className="text-purple-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Plinko</h1>
          <p className="text-xs text-gray-500">VaultBet Original</p>
        </div>
        <div className="ml-auto flex gap-1 flex-wrap justify-end max-w-xs">
          {history.slice(0, 12).map((h, i) => (
            <span key={i} className={`badge font-bold text-xs ${
              h.mult >= 10 ? 'bg-purple-500/30 text-purple-300' :
              h.won ? 'bg-vault-green/20 text-vault-green' :
              'bg-red-900/30 text-red-400'
            }`}>
              {h.mult}×
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="panel space-y-4">
            <BetInput value={bet} onChange={setBet} disabled={autoDrop} />

            {/* Rows */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rows</label>
                <div className="flex items-center gap-2 bg-vault-bg border border-vault-border rounded-lg px-2 py-1">
                  <button onClick={() => { const opts=[8,12,16]; const i=opts.indexOf(rows); setRows(opts[Math.max(0,i-1)]) }} className="text-gray-400 hover:text-white"><Minus size={14}/></button>
                  <span className="font-bold text-white w-4 text-center">{rows}</span>
                  <button onClick={() => { const opts=[8,12,16]; const i=opts.indexOf(rows); setRows(opts[Math.min(opts.length-1,i+1)]) }} className="text-gray-400 hover:text-white"><Plus size={14}/></button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[8, 12, 16].map(r => (
                  <button key={r} onClick={() => setRows(r)}
                    className={`py-1.5 rounded-lg text-sm font-bold transition-all ${rows === r ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' : 'bg-vault-bg border border-vault-border text-gray-400 hover:text-white'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Risk</label>
              <div className="grid grid-cols-3 gap-1.5">
                {['low', 'medium', 'high'].map(r => (
                  <button key={r} onClick={() => setRisk(r)}
                    className={`py-1.5 rounded-lg text-sm font-bold capitalize transition-all ${risk === r ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' : 'bg-vault-bg border border-vault-border text-gray-400 hover:text-white'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Payout preview */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Payouts</label>
              <div className="flex gap-0.5">
                {payoutsRow.map((m, i) => {
                  const c = bucketColor(m)
                  return (
                    <div key={i} className="flex-1 rounded text-center py-1" style={{ backgroundColor: c.fill, border: `1px solid ${c.stroke}` }}>
                      <div style={{ color: c.text }} className="text-[8px] font-black leading-tight">{m}×</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Last result */}
            {lastResult && (
              <div className={`panel text-center transition-all ${lastResult.payout >= bet ? 'border-vault-green/40 bg-vault-green/5' : 'border-red-500/20 bg-red-900/10'}`}>
                <div className={`text-3xl font-black ${lastResult.mult >= 10 ? 'text-purple-400' : lastResult.payout >= bet ? 'text-vault-green' : 'text-red-400'}`}>
                  {lastResult.mult}×
                </div>
                <div className="text-sm text-gray-400">
                  {lastResult.payout > 0 ? `$${lastResult.payout.toFixed(2)}` : 'No return'}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => dropBall()}
                disabled={autoDrop || bet <= 0 || bet > balance}
                className="btn-primary py-3 font-black flex items-center justify-center gap-1"
              >
                {dropping && !autoDrop ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : '🎱'} Drop
              </button>
              <button
                onClick={toggleAuto}
                className={`py-3 rounded-xl font-bold text-sm transition-all ${autoDrop ? 'btn-red' : 'btn-secondary'}`}
              >
                {autoDrop ? 'Stop' : 'Auto'}
              </button>
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="panel p-2 overflow-hidden">
          <PlinkoBoard
            rows={rows}
            risk={risk}
            balls={balls}
            hitPegs={hitPegs}
            litBucket={litBucket}
          />
        </div>
      </div>
    </div>
  )
}
