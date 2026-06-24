import { useState, useCallback } from 'react'
import { Circle } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import BetInput from '../components/UI/BetInput'

const SEGMENTS = {
  low: [
    { label: '1.5×', mult: 1.5, color: '#3bc117', count: 30 },
    { label: '1.2×', mult: 1.2, color: '#22c55e', count: 40 },
    { label: '0×', mult: 0, color: '#ef4444', count: 20 },
    { label: '3×', mult: 3, color: '#f59e0b', count: 8 },
    { label: '5×', mult: 5, color: '#a855f7', count: 2 },
  ],
  medium: [
    { label: '2×', mult: 2, color: '#3bc117', count: 25 },
    { label: '0×', mult: 0, color: '#ef4444', count: 35 },
    { label: '3×', mult: 3, color: '#f59e0b', count: 15 },
    { label: '5×', mult: 5, color: '#a855f7', count: 10 },
    { label: '10×', mult: 10, color: '#ec4899', count: 5 },
  ],
  high: [
    { label: '0×', mult: 0, color: '#ef4444', count: 50 },
    { label: '3×', mult: 3, color: '#f59e0b', count: 25 },
    { label: '10×', mult: 10, color: '#a855f7', count: 15 },
    { label: '20×', mult: 20, color: '#ec4899', count: 8 },
    { label: '50×', mult: 50, color: '#06b6d4', count: 2 },
  ],
}

function buildWheel(risk) {
  const segs = SEGMENTS[risk]
  const items = []
  for (const seg of segs) {
    for (let i = 0; i < seg.count; i++) items.push(seg)
  }
  return items
}

export default function Wheel() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [bet, setBet] = useState(1)
  const [risk, setRisk] = useState('medium')
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])

  const segments = SEGMENTS[risk]

  const spin = useCallback(async () => {
    if (bet <= 0 || bet > balance || spinning) return
    if (!placeBet(bet)) return
    setSpinning(true)
    setResult(null)

    const wheel = buildWheel(risk)
    const picked = wheel[Math.floor(Math.random() * wheel.length)]

    const extraSpins = 5 + Math.floor(Math.random() * 4)
    const targetDeg = extraSpins * 360 + Math.random() * 360
    setRotation(prev => prev + targetDeg)

    await new Promise(r => setTimeout(r, 3500))

    const payout = +(bet * picked.mult).toFixed(2)
    if (payout > 0) addWin(payout)

    addBetHistory({ id: Date.now(), game: 'Wheel', bet: bet.toFixed(2), mult: picked.mult.toFixed(2), payout: payout.toFixed(2), won: payout > 0, time: Date.now() })
    if (picked.mult >= 1) addNotification(`🎡 ${picked.label}! Won $${payout.toFixed(2)}!`, 'win')
    else addNotification(`🎡 ${picked.label}! Lost $${bet.toFixed(2)}`, 'loss')

    setResult({ ...picked, payout })
    setHistory(h => [picked, ...h.slice(0, 19)])
    setSpinning(false)
  }, [bet, balance, spinning, risk, placeBet, addWin, addBetHistory, addNotification])

  const totalSlots = segments.reduce((a, s) => a + s.count, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
          <Circle size={20} className="text-orange-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Wheel</h1>
          <p className="text-xs text-gray-500">VaultBet Original</p>
        </div>
        <div className="ml-auto flex gap-1">
          {history.slice(0, 8).map((h, i) => (
            <span key={i} className="badge font-bold text-xs border border-vault-border" style={{ color: h.color, backgroundColor: h.color + '22' }}>
              {h.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
        <div className="panel space-y-4">
          <BetInput value={bet} onChange={setBet} disabled={spinning} />

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Risk Level</label>
            <div className="grid grid-cols-3 gap-2">
              {['low', 'medium', 'high'].map(r => (
                <button key={r} onClick={() => !spinning && setRisk(r)}
                  className={`py-2 rounded-lg text-sm font-bold capitalize transition-all ${risk === r ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-vault-bg border border-vault-border text-gray-400 hover:text-white'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Segments</label>
            <div className="space-y-1.5">
              {segments.map(seg => (
                <div key={seg.label} className="flex items-center justify-between text-sm panel bg-vault-bg py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span className="font-bold" style={{ color: seg.color }}>{seg.label}</span>
                  </div>
                  <span className="text-gray-500 text-xs">{((seg.count / totalSlots) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {result && (
            <div className={`panel text-center ${result.payout > 0 ? 'border-vault-green/50 bg-green-900/20' : 'border-red-500/30 bg-red-900/10'}`}>
              <div className="text-3xl font-black" style={{ color: result.color }}>{result.label}</div>
              {result.payout > 0 ? <div className="text-vault-green font-bold mt-1">+${result.payout.toFixed(2)}</div> : <div className="text-red-400 mt-1">No win</div>}
            </div>
          )}

          <button onClick={spin} disabled={spinning || bet <= 0 || bet > balance} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {spinning ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Spinning...</> : '🎡 Spin'}
          </button>
        </div>

        {/* Wheel visual */}
        <div className="panel flex items-center justify-center min-h-80">
          <div className="relative w-72 h-72">
            <svg viewBox="0 0 200 200" className="w-72 h-72" style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 3.5s cubic-bezier(0.2, 0, 0.1, 1)' : 'none' }}>
              {segments.map((seg, i) => {
                const total = segments.reduce((a, s) => a + s.count, 0)
                const startAngle = segments.slice(0, i).reduce((a, s) => a + (s.count / total) * 360, 0)
                const angle = (seg.count / total) * 360
                const startRad = (startAngle - 90) * (Math.PI / 180)
                const endRad = (startAngle + angle - 90) * (Math.PI / 180)
                const x1 = 100 + 90 * Math.cos(startRad)
                const y1 = 100 + 90 * Math.sin(startRad)
                const x2 = 100 + 90 * Math.cos(endRad)
                const y2 = 100 + 90 * Math.sin(endRad)
                const largeArc = angle > 180 ? 1 : 0
                const midAngle = (startAngle + angle / 2 - 90) * (Math.PI / 180)
                const tx = 100 + 60 * Math.cos(midAngle)
                const ty = 100 + 60 * Math.sin(midAngle)
                return (
                  <g key={i}>
                    <path d={`M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={seg.color} stroke="#0b0e14" strokeWidth="1" />
                    <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="9" fontWeight="bold">
                      {seg.label}
                    </text>
                  </g>
                )
              })}
              <circle cx="100" cy="100" r="15" fill="#0b0e14" />
            </svg>
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[20px] border-l-transparent border-r-transparent border-b-white z-10" />
          </div>
        </div>
      </div>
    </div>
  )
}
