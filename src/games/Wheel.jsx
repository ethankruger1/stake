import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { RotateCw } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import BetInput from '../components/UI/BetInput'

const RISK_SEGS = {
  low: [
    { label: '1.5×', mult: 1.5, color: '#22c55e', count: 30 },
    { label: '1.2×', mult: 1.2, color: '#4ade80', count: 40 },
    { label: '0×',   mult: 0,   color: '#ef4444', count: 20 },
    { label: '3×',   mult: 3,   color: '#f59e0b', count: 8 },
    { label: '5×',   mult: 5,   color: '#a855f7', count: 2 },
  ],
  medium: [
    { label: '2×',  mult: 2,  color: '#22c55e', count: 30 },
    { label: '0×',  mult: 0,  color: '#ef4444', count: 35 },
    { label: '3×',  mult: 3,  color: '#f59e0b', count: 15 },
    { label: '5×',  mult: 5,  color: '#a855f7', count: 10 },
    { label: '10×', mult: 10, color: '#ec4899', count: 7 },
    { label: '20×', mult: 20, color: '#06b6d4', count: 3 },
  ],
  high: [
    { label: '0×',  mult: 0,  color: '#ef4444', count: 50 },
    { label: '3×',  mult: 3,  color: '#f59e0b', count: 25 },
    { label: '10×', mult: 10, color: '#a855f7', count: 15 },
    { label: '20×', mult: 20, color: '#ec4899', count: 8 },
    { label: '50×', mult: 50, color: '#06b6d4', count: 2 },
  ],
}

function buildSlots(risk) {
  const segs = RISK_SEGS[risk] || RISK_SEGS.medium
  const queues = segs.map(s => Array(s.count).fill(s))
  const result = []
  const maxCount = Math.max(...segs.map(s => s.count))
  for (let r = 0; r < maxCount; r++) {
    for (const q of queues) {
      if (q.length > 0) result.push(q.shift())
    }
  }
  return result
}

function polarXY(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

function arcPath(cx, cy, r1, r2, startDeg, endDeg) {
  const [ox1, oy1] = polarXY(cx, cy, r1, startDeg)
  const [ox2, oy2] = polarXY(cx, cy, r1, endDeg)
  const [ix2, iy2] = polarXY(cx, cy, r2, endDeg)
  const [ix1, iy1] = polarXY(cx, cy, r2, startDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${ox1} ${oy1} A ${r1} ${r1} 0 ${large} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${r2} ${r2} 0 ${large} 0 ${ix1} ${iy1} Z`
}

export default function Wheel() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [bet, setBet] = useState(1)
  const [risk, setRisk] = useState('medium')
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [winIdx, setWinIdx] = useState(null)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const rotRef = useRef(0)

  const slots = useMemo(() => buildSlots(risk), [risk])
  const totalSlots = slots.length
  const degPerSlot = 360 / totalSlots
  const segs = RISK_SEGS[risk]
  const totalCount = segs.reduce((a, s) => a + s.count, 0)

  useEffect(() => {
    rotRef.current = 0
    setRotation(0)
    setWinIdx(null)
    setResult(null)
  }, [risk])

  const spin = useCallback(async () => {
    if (bet <= 0 || bet > balance || spinning) return
    if (!placeBet(bet)) return
    setSpinning(true)
    setResult(null)
    setWinIdx(null)

    const pickedIdx = Math.floor(Math.random() * totalSlots)
    const picked = slots[pickedIdx]

    const targetAngle = (pickedIdx + 0.5) * degPerSlot
    const currentRemainder = rotRef.current % 360
    let delta = (targetAngle - currentRemainder + 360) % 360
    if (delta < 60) delta += 360
    const spins = 7 + Math.floor(Math.random() * 4)
    const newRot = spins * 360 + delta

    rotRef.current += newRot
    setRotation(rotRef.current)

    await new Promise(r => setTimeout(r, 5200))

    setWinIdx(pickedIdx)
    const payout = +(bet * picked.mult).toFixed(2)
    if (payout > 0) addWin(payout)
    addBetHistory({ id: Date.now(), game: 'Wheel', bet: bet.toFixed(2), mult: picked.mult.toFixed(2), payout: payout.toFixed(2), won: payout > 0, time: Date.now() })
    if (picked.mult >= 1) addNotification(`🎡 ${picked.label}! Won $${payout.toFixed(2)}!`, 'win')
    else addNotification(`🎡 ${picked.label}! Lost $${bet.toFixed(2)}`, 'loss')
    setResult({ ...picked, payout })
    setHistory(h => [picked, ...h.slice(0, 19)])
    setSpinning(false)
  }, [bet, balance, spinning, slots, totalSlots, degPerSlot, placeBet, addWin, addBetHistory, addNotification])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
          <RotateCw size={20} className="text-orange-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Wheel</h1>
          <p className="text-xs text-gray-500">VaultBet Original · Provably Fair</p>
        </div>
        <div className="ml-auto flex gap-1.5 flex-wrap max-w-xs justify-end">
          {history.slice(0, 8).map((h, i) => (
            <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
              style={{ color: h.color, backgroundColor: h.color + '22', borderColor: h.color + '55' }}>
              {h.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
        <div className="panel space-y-4">
          <BetInput value={bet} onChange={setBet} disabled={spinning} />

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Risk Level</label>
            <div className="grid grid-cols-3 gap-2">
              {['low', 'medium', 'high'].map(r => (
                <button key={r} onClick={() => !spinning && setRisk(r)}
                  className={`py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
                    risk === r
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                      : 'bg-vault-bg border border-vault-border text-gray-400 hover:text-white'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Segments</label>
            <div className="space-y-1">
              {segs.map((seg, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                  style={{ backgroundColor: seg.color + '12' }}>
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="font-bold text-sm flex-1" style={{ color: seg.color }}>{seg.label}</span>
                  <div className="w-14 h-1.5 rounded-full bg-vault-border overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${(seg.count / totalCount) * 100}%`, backgroundColor: seg.color }} />
                  </div>
                  <span className="text-xs text-gray-500 w-7 text-right">
                    {((seg.count / totalCount) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {result && (
            <div className="rounded-xl p-3 text-center border transition-all"
              style={{ backgroundColor: result.color + '15', borderColor: result.color + '44' }}>
              <div className="text-2xl font-black" style={{ color: result.color }}>{result.label}</div>
              {result.payout > 0
                ? <div className="font-bold mt-0.5 text-white">Won <span style={{ color: result.color }}>${result.payout.toFixed(2)}</span></div>
                : <div className="text-red-400 text-sm mt-0.5">Lost ${bet.toFixed(2)}</div>
              }
            </div>
          )}

          <button onClick={spin} disabled={spinning || bet <= 0 || bet > balance}
            className="btn-primary w-full py-3 font-black text-lg flex items-center justify-center gap-2">
            {spinning
              ? <><span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Spinning...</>
              : <><RotateCw size={18} /> Spin Wheel</>
            }
          </button>
        </div>

        <div className="panel flex flex-col items-center justify-center gap-6 min-h-80 relative overflow-hidden">
          {result && !spinning && (
            <div className="absolute inset-0 opacity-5 pointer-events-none transition-all"
              style={{ backgroundColor: result.color }} />
          )}

          <div className="relative">
            {/* Pointer */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
              <div className="w-0 h-0 border-l-[11px] border-r-[11px] border-t-[24px] border-l-transparent border-r-transparent border-t-white"
                style={{ filter: 'drop-shadow(0 2px 8px rgba(255,255,255,0.5))' }} />
            </div>

            <svg viewBox="0 0 300 300" className="w-64 h-64 md:w-72 md:h-72"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 5s cubic-bezier(0.1, 0.01, 0.04, 1)' : 'none',
                filter: 'drop-shadow(0 0 24px rgba(0,0,0,0.9))',
              }}>
              <defs>
                <radialGradient id="wheelHub" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#252d42" />
                  <stop offset="100%" stopColor="#0b0e14" />
                </radialGradient>
                <filter id="winGlow">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <circle cx="150" cy="150" r="148" fill="#111827" />

              {slots.map((slot, i) => (
                <path
                  key={i}
                  d={arcPath(150, 150, 140, 52, i * degPerSlot, (i + 1) * degPerSlot)}
                  fill={slot.color}
                  stroke="#0b0e14"
                  strokeWidth="0.7"
                  opacity={winIdx !== null && winIdx !== i ? 0.35 : 1}
                  filter={winIdx === i ? 'url(#winGlow)' : undefined}
                />
              ))}

              <circle cx="150" cy="150" r="141" fill="none" stroke="#1e2438" strokeWidth="3" />
              <circle cx="150" cy="150" r="52" fill="url(#wheelHub)" stroke="#2a3045" strokeWidth="3" />
              <circle cx="150" cy="150" r="36" fill="#0b0e14" stroke="#1a1f2e" strokeWidth="1.5" />
              <text x="150" y="147" textAnchor="middle" dominantBaseline="middle"
                fill="#3bc117" fontSize="9" fontWeight="bold" letterSpacing="1.5">VAULT</text>
              <text x="150" y="160" textAnchor="middle" dominantBaseline="middle"
                fill="#374151" fontSize="7" letterSpacing="3">BET</text>
              <circle cx="150" cy="150" r="5" fill="#1e2438" />
            </svg>
          </div>

          {!result && !spinning && <p className="text-gray-600 text-sm">Choose risk level and spin the wheel!</p>}
          {spinning && <div className="text-orange-400/80 text-sm font-semibold animate-pulse">Good luck...</div>}
        </div>
      </div>
    </div>
  )
}
