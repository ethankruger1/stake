import { useState, useCallback, useRef } from 'react'
import { CircleDashed } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import BetInput from '../components/UI/BetInput'

const ROWS = 16
const PAYOUTS = {
  low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
  medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
  high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
}

function PlinkoBoard({ balls, rows = 12 }) {
  const bucketCount = rows + 1
  const buckets = PAYOUTS.medium

  return (
    <div className="flex flex-col items-center gap-0">
      {/* Pegs */}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex justify-center" style={{ gap: `${28 - row * 1.2}px`, marginBottom: 2 }}>
          {Array.from({ length: row + 2 }).map((_, col) => (
            <div key={col} className="w-2 h-2 rounded-full bg-vault-border" />
          ))}
        </div>
      ))}
      {/* Balls overlay */}
      {balls.map(ball => (
        <div
          key={ball.id}
          className="absolute w-3 h-3 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50 transition-all"
          style={{ left: `${ball.x}%`, top: `${ball.y}%`, transform: 'translate(-50%, -50%)' }}
        />
      ))}
      {/* Buckets */}
      <div className="flex mt-3 gap-0.5">
        {buckets.map((mult, i) => (
          <div
            key={i}
            className={`flex-1 py-1 rounded text-center text-[10px] font-black transition-colors ${
              mult >= 10 ? 'bg-red-600 text-white' :
              mult >= 3 ? 'bg-orange-500 text-white' :
              mult >= 1.5 ? 'bg-yellow-500 text-black' :
              mult >= 1 ? 'bg-vault-green/80 text-black' :
              'bg-vault-panel text-gray-400'
            }`}
          >
            {mult}×
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Plinko() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [bet, setBet] = useState(1)
  const [risk, setRisk] = useState('medium')
  const [balls, setBalls] = useState([])
  const [dropping, setDropping] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [history, setHistory] = useState([])
  const ballIdRef = useRef(0)

  const dropBall = useCallback(async () => {
    if (bet <= 0 || bet > balance || dropping) return
    if (!placeBet(bet)) return
    setDropping(true)

    const ballId = ++ballIdRef.current
    let pos = 0

    for (let i = 0; i < ROWS; i++) {
      pos += Math.random() < 0.5 ? 1 : 0
    }

    const payouts = PAYOUTS[risk]
    const buckets = payouts.length
    const bucketIndex = Math.min(pos, buckets - 1)
    const mult = payouts[bucketIndex]
    const won = mult >= 1

    const payout = +(bet * mult).toFixed(2)

    // Animate ball dropping
    const ballX = 20 + (pos / ROWS) * 60
    const newBall = { id: ballId, x: 50, y: 5 }
    setBalls(prev => [...prev, newBall])

    const steps = 20
    for (let s = 0; s <= steps; s++) {
      await new Promise(r => setTimeout(r, 30))
      setBalls(prev => prev.map(b => b.id === ballId
        ? { ...b, x: 50 + (ballX - 50) * (s / steps), y: 5 + 85 * (s / steps) }
        : b
      ))
    }

    await new Promise(r => setTimeout(r, 200))
    setBalls(prev => prev.filter(b => b.id !== ballId))

    if (payout > 0) addWin(payout)
    addBetHistory({ id: Date.now(), game: 'Plinko', bet: bet.toFixed(2), mult: mult.toFixed(2), payout: payout.toFixed(2), won, time: Date.now() })
    if (won && payout > bet) {
      addNotification(`🎱 ${mult}× — Won $${payout.toFixed(2)}!`, 'win')
    } else {
      addNotification(`🎱 ${mult}× — $${payout.toFixed(2)} back`, 'loss')
    }
    setLastResult({ mult, payout, won: payout > bet, bucketIndex })
    setHistory(h => [{ mult, won: payout > bet }, ...h.slice(0, 19)])
    setDropping(false)
  }, [bet, balance, dropping, risk, placeBet, addWin, addBetHistory, addNotification])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <CircleDashed size={20} className="text-purple-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Plinko</h1>
          <p className="text-xs text-gray-500">VaultBet Original</p>
        </div>
        <div className="ml-auto flex gap-1 flex-wrap justify-end">
          {history.slice(0, 8).map((h, i) => (
            <span key={i} className={`badge font-bold text-xs ${h.won ? 'bg-vault-green/20 text-vault-green' : 'bg-red-900/30 text-red-400'}`}>
              {h.mult}×
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
        <div className="panel space-y-4">
          <BetInput value={bet} onChange={setBet} disabled={dropping} />

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Risk Level</label>
            <div className="grid grid-cols-3 gap-2">
              {['low', 'medium', 'high'].map(r => (
                <button
                  key={r}
                  onClick={() => !dropping && setRisk(r)}
                  className={`py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                    risk === r ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' : 'bg-vault-bg border border-vault-border text-gray-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="panel bg-vault-bg space-y-1">
            <div className="text-xs text-gray-500">Payout Range</div>
            <div className="text-sm font-bold">
              <span className="text-red-400">{PAYOUTS[risk][0]}×</span>
              <span className="text-gray-600 mx-2">→</span>
              <span className="text-gray-400">{Math.min(...PAYOUTS[risk])}×</span>
              <span className="text-gray-600 mx-2">→</span>
              <span className="text-red-400">{PAYOUTS[risk][PAYOUTS[risk].length - 1]}×</span>
            </div>
          </div>

          {lastResult && (
            <div className={`panel text-center ${lastResult.won ? 'bg-green-900/20 border-vault-green/30' : 'bg-red-900/20 border-red-500/30'}`}>
              <div className={`text-2xl font-black ${lastResult.won ? 'text-vault-green' : 'text-red-400'}`}>
                {lastResult.mult}×
              </div>
              <div className="text-sm text-gray-400">
                {lastResult.won ? `+$${(lastResult.payout - bet).toFixed(2)}` : `-$${(bet - lastResult.payout).toFixed(2)}`}
              </div>
            </div>
          )}

          <button onClick={dropBall} disabled={dropping || bet <= 0 || bet > balance} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {dropping ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Dropping...</> : <>Drop Ball</>}
          </button>
        </div>

        <div className="panel relative overflow-hidden min-h-80">
          <PlinkoBoard balls={balls} rows={12} />
        </div>
      </div>
    </div>
  )
}
