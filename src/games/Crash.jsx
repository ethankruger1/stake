import { useState, useEffect, useRef, useCallback } from 'react'
import { TrendingUp, TrendingDown, Zap } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import BetInput from '../components/UI/BetInput'

function generateCrashPoint() {
  const r = Math.random()
  if (r < 0.01) return 1.00
  return Math.max(1.00, +(Math.floor(100 / (1 - r * 0.99)) / 100).toFixed(2))
}

const HISTORY_COLORS = (v) => v >= 10 ? 'text-purple-400' : v >= 2 ? 'text-vault-green' : 'text-red-400'

export default function Crash() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [bet, setBet] = useState(1)
  const [autoCashout, setAutoCashout] = useState(2.0)
  const [useAutoCashout, setUseAutoCashout] = useState(false)
  const [phase, setPhase] = useState('waiting') // waiting | running | crashed
  const [multiplier, setMultiplier] = useState(1.00)
  const [crashPoint, setCrashPoint] = useState(null)
  const [cashedOut, setCashedOut] = useState(false)
  const [betPlaced, setBetPlaced] = useState(false)
  const [history, setHistory] = useState([5.23, 1.05, 2.41, 8.77, 1.12, 14.3, 1.01, 3.56, 1.88, 22.1])
  const [countdown, setCountdown] = useState(5)
  const [players, setPlayers] = useState(() =>
    Array.from({ length: 8 }, (_, i) => ({
      name: ['CryptoKing', 'Dragon88', 'MoonBet', 'LuckyAce', 'WhaleBet', 'GoldFish', 'NightOwl', 'SunRider'][i],
      bet: (Math.random() * 500 + 10).toFixed(2),
      cashedAt: null,
    }))
  )
  const intervalRef = useRef(null)
  const startTimeRef = useRef(null)
  const crashRef = useRef(null)

  const runCountdown = useCallback(() => {
    setPhase('waiting')
    setCountdown(5)
    setMultiplier(1.00)
    setCashedOut(false)
    setBetPlaced(false)
    const cp = generateCrashPoint()
    setCrashPoint(cp)
    crashRef.current = cp

    setPlayers(Array.from({ length: Math.floor(Math.random() * 8 + 5) }, (_, i) => ({
      name: ['CryptoKing', 'Dragon88', 'MoonBet', 'LuckyAce', 'WhaleBet', 'GoldFish', 'NightOwl', 'SunRider', 'RocketBoy', 'DiamondH'][i % 10],
      bet: (Math.random() * 500 + 10).toFixed(2),
      cashedAt: null,
    })))

    let count = 5
    const cdInterval = setInterval(() => {
      count -= 1
      setCountdown(count)
      if (count <= 0) {
        clearInterval(cdInterval)
        startCrash()
      }
    }, 1000)
  }, [])

  const startCrash = useCallback(() => {
    setPhase('running')
    startTimeRef.current = Date.now()

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const mult = Math.pow(Math.E, elapsed * 0.07 * Math.log(1.12) * 10)
      const rounded = +Math.max(1, mult).toFixed(2)
      setMultiplier(rounded)

      setPlayers(prev => prev.map(p => {
        if (!p.cashedAt && Math.random() < 0.01) {
          return { ...p, cashedAt: rounded }
        }
        return p
      }))

      if (rounded >= crashRef.current) {
        clearInterval(intervalRef.current)
        setMultiplier(crashRef.current)
        setPhase('crashed')
        setHistory(h => [crashRef.current, ...h.slice(0, 19)])
        setTimeout(runCountdown, 3000)
      }
    }, 50)
  }, [runCountdown])

  useEffect(() => {
    runCountdown()
    return () => clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    if (phase === 'running' && betPlaced && !cashedOut && useAutoCashout && multiplier >= autoCashout) {
      handleCashout()
    }
  }, [multiplier, phase, betPlaced, cashedOut, useAutoCashout, autoCashout])

  const placeBetHandler = () => {
    if (phase !== 'waiting' || betPlaced || bet <= 0 || bet > balance) return
    if (!placeBet(bet)) return
    setBetPlaced(true)
  }

  const handleCashout = useCallback(() => {
    if (!betPlaced || cashedOut || phase !== 'running') return
    const payout = +(bet * multiplier).toFixed(2)
    addWin(payout)
    setCashedOut(true)
    addBetHistory({ id: Date.now(), game: 'Crash', bet: bet.toFixed(2), mult: multiplier.toFixed(2), payout: payout.toFixed(2), won: true, time: Date.now() })
    addNotification(`🚀 Cashed out at ${multiplier.toFixed(2)}x! Won $${payout.toFixed(2)}`, 'win')
  }, [betPlaced, cashedOut, phase, bet, multiplier, addWin, addBetHistory, addNotification])

  useEffect(() => {
    if (phase === 'crashed' && betPlaced && !cashedOut) {
      addBetHistory({ id: Date.now(), game: 'Crash', bet: bet.toFixed(2), mult: '0.00', payout: '0.00', won: false, time: Date.now() })
      addNotification(`💥 Crashed at ${crashRef.current}x! Lost $${bet.toFixed(2)}`, 'loss')
    }
  }, [phase])

  const multColor = phase === 'crashed' ? 'text-red-400' : multiplier >= 2 ? 'text-vault-green' : 'text-white'

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
          <TrendingUp size={20} className="text-green-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Crash</h1>
          <p className="text-xs text-gray-500">VaultBet Original</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {history.slice(0, 8).map((v, i) => (
            <span key={i} className={`badge bg-vault-card border border-vault-border font-bold text-xs ${HISTORY_COLORS(v)}`}>
              {v.toFixed(2)}×
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="panel space-y-4">
            <BetInput value={bet} onChange={setBet} disabled={phase !== 'waiting' || betPlaced} />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Auto Cashout</label>
                <button
                  onClick={() => setUseAutoCashout(v => !v)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${useAutoCashout ? 'bg-vault-green' : 'bg-vault-border'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${useAutoCashout ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1.01"
                  step="0.1"
                  value={autoCashout}
                  onChange={e => setAutoCashout(parseFloat(e.target.value) || 2)}
                  disabled={!useAutoCashout}
                  className="input-field"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">×</span>
              </div>
            </div>

            {phase === 'waiting' ? (
              <button
                onClick={placeBetHandler}
                disabled={betPlaced || bet <= 0 || bet > balance}
                className={`w-full font-bold py-3 rounded-xl transition-all ${
                  betPlaced ? 'bg-vault-green/20 text-vault-green border border-vault-green/30 cursor-default' : 'btn-primary'
                }`}
              >
                {betPlaced ? `✓ Bet Placed $${bet.toFixed(2)}` : `Bet $${bet.toFixed(2)}`}
              </button>
            ) : phase === 'running' ? (
              <button
                onClick={handleCashout}
                disabled={!betPlaced || cashedOut}
                className={`w-full font-bold py-3 rounded-xl transition-all ${
                  !betPlaced ? 'bg-vault-panel text-gray-600 cursor-default border border-vault-border' :
                  cashedOut ? 'bg-vault-green/20 text-vault-green border border-vault-green/30' :
                  'btn-gold animate-pulse'
                }`}
              >
                {!betPlaced ? 'Waiting for next round...' :
                 cashedOut ? `✓ Cashed out $${(bet * multiplier).toFixed(2)}` :
                 `Cash Out $${(bet * multiplier).toFixed(2)}`}
              </button>
            ) : (
              <button
                onClick={placeBetHandler}
                disabled={betPlaced}
                className="btn-primary w-full py-3"
              >
                {betPlaced ? '✓ Queued for next round' : 'Bet for Next Round'}
              </button>
            )}
          </div>

          {/* Player list */}
          <div className="panel">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Players ({players.length})</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {players.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1">
                  <span className="text-gray-400 truncate">{p.name}</span>
                  <span className="text-gray-300">${p.bet}</span>
                  {p.cashedAt ? (
                    <span className="text-vault-green font-bold">{p.cashedAt.toFixed(2)}×</span>
                  ) : phase === 'crashed' ? (
                    <span className="text-red-400">💥</span>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Graph */}
        <div className={`panel flex flex-col items-center justify-center min-h-80 relative overflow-hidden transition-all duration-300 ${
          phase === 'crashed' ? 'border-red-500/50 bg-red-900/5' : ''
        }`}>
          {phase === 'waiting' ? (
            <div className="text-center">
              <div className="text-6xl font-black text-gray-600 mb-2">{countdown}s</div>
              <p className="text-gray-500">Next round starting...</p>
              <div className="flex gap-1 justify-center mt-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`w-8 h-1 rounded-full transition-all duration-1000 ${i < 5 - countdown ? 'bg-vault-green' : 'bg-vault-border'}`} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className={`font-black transition-all duration-100 ${
                phase === 'crashed' ? 'text-7xl text-red-400' : `text-8xl ${multColor}`
              }`}>
                {multiplier.toFixed(2)}×
              </div>
              {phase === 'crashed' ? (
                <div className="mt-4">
                  <div className="text-red-400 font-bold text-xl flex items-center gap-2 justify-center">
                    <TrendingDown size={24} /> CRASHED
                  </div>
                  <p className="text-gray-500 text-sm mt-1">Next round in 3s...</p>
                </div>
              ) : cashedOut ? (
                <div className="mt-4 text-vault-green font-bold text-lg">
                  ✓ Cashed out at {multiplier.toFixed(2)}×
                </div>
              ) : betPlaced ? (
                <div className="mt-4">
                  <div className="text-vault-green font-semibold">
                    Current profit: ${(bet * multiplier - bet).toFixed(2)}
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-gray-500 text-sm">Place your bet!</div>
              )}

              {/* Animated rocket */}
              {phase === 'running' && (
                <div className="mt-8 text-5xl animate-bounce">🚀</div>
              )}
            </div>
          )}

          {/* Background grid lines */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="absolute border-t border-white w-full" style={{ top: `${i * 12.5}%` }} />
            ))}
            {[...Array(8)].map((_, i) => (
              <div key={i} className="absolute border-l border-white h-full" style={{ left: `${i * 12.5}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
