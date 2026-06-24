import { useState, useCallback } from 'react'
import { Zap } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import BetInput from '../components/UI/BetInput'

export default function Limbo() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [bet, setBet] = useState(1)
  const [target, setTarget] = useState(2.00)
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState(null)
  const [displayMult, setDisplayMult] = useState(null)
  const [history, setHistory] = useState([])

  const winChance = Math.min(99, +(99 / target).toFixed(2))
  const payout = +(bet * target).toFixed(2)

  const roll = useCallback(async () => {
    if (bet <= 0 || bet > balance || rolling) return
    if (!placeBet(bet)) return
    setRolling(true)
    setResult(null)
    setDisplayMult(null)

    // Count-up animation
    let frame = 0
    const frames = 20
    const animInterval = setInterval(() => {
      setDisplayMult(+(1 + Math.random() * 15).toFixed(2))
      frame++
      if (frame >= frames) clearInterval(animInterval)
    }, 40)

    await new Promise(r => setTimeout(r, 900))
    clearInterval(animInterval)

    const r = Math.random()
    const mult = +(Math.max(1.00, 99 / (r * 99 + 1))).toFixed(2)
    const won = mult >= target

    setDisplayMult(mult)

    if (won) {
      const winAmount = +(bet * target).toFixed(2)
      addWin(winAmount)
      addNotification(`⚡ ${mult.toFixed(2)}× ≥ ${target}× — Won $${winAmount.toFixed(2)}!`, 'win')
      addBetHistory({ id: Date.now(), game: 'Limbo', bet: bet.toFixed(2), mult: mult.toFixed(2), payout: winAmount.toFixed(2), won: true, time: Date.now() })
      setResult({ mult, won: true, winAmount })
    } else {
      addNotification(`⚡ ${mult.toFixed(2)}× < ${target}× — Lost $${bet.toFixed(2)}`, 'loss')
      addBetHistory({ id: Date.now(), game: 'Limbo', bet: bet.toFixed(2), mult: mult.toFixed(2), payout: '0.00', won: false, time: Date.now() })
      setResult({ mult, won: false })
    }

    setHistory(h => [{ mult, won }, ...h.slice(0, 19)])
    setRolling(false)
  }, [bet, balance, rolling, target, placeBet, addWin, addBetHistory, addNotification])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
          <Zap size={20} className="text-yellow-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Limbo</h1>
          <p className="text-xs text-gray-500">VaultBet Original</p>
        </div>
        <div className="ml-auto flex gap-1 flex-wrap justify-end">
          {history.slice(0, 8).map((h, i) => (
            <span key={i} className={`badge font-bold text-xs ${h.won ? 'bg-vault-green/20 text-vault-green' : 'bg-red-900/30 text-red-400'}`}>
              {h.mult.toFixed(2)}×
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px,1fr] gap-6">
        <div className="panel space-y-4">
          <BetInput value={bet} onChange={setBet} disabled={rolling} />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Target Multiplier</label>
              <span className="text-xs text-gray-500">Win: {winChance.toFixed(2)}%</span>
            </div>
            <div className="relative">
              <input
                type="number" min="1.01" max="1000000" step="0.1"
                value={target}
                onChange={e => setTarget(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
                disabled={rolling}
                className="input-field font-bold text-lg"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">×</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[1.5, 2, 5, 10].map(t => (
              <button key={t} onClick={() => setTarget(t)} className={`py-2 rounded-lg text-sm font-bold transition-all ${target === t ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' : 'bg-vault-bg border border-vault-border text-gray-400 hover:text-white'}`}>
                {t}×
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="panel bg-vault-bg">
              <div className="text-xs text-gray-500">Win Chance</div>
              <div className="font-bold text-white">{winChance.toFixed(2)}%</div>
            </div>
            <div className="panel bg-vault-bg">
              <div className="text-xs text-gray-500">Profit on Win</div>
              <div className="font-bold text-vault-green">${(bet * target - bet).toFixed(2)}</div>
            </div>
          </div>

          <button onClick={roll} disabled={rolling || bet <= 0 || bet > balance} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {rolling ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Rolling...</> : <><Zap size={16} /> Roll</>}
          </button>
        </div>

        <div className="panel flex flex-col items-center justify-center min-h-72 gap-4">
          <div className={`text-9xl font-black tabular-nums transition-all duration-100 ${
            rolling ? 'text-yellow-500/70 animate-pulse' :
            result?.won ? 'text-vault-green' : result ? 'text-red-400' : 'text-gray-700'
          }`}>
            {displayMult !== null ? `${displayMult.toFixed(2)}×` : '—'}
          </div>

          {!rolling && result && (
            <div className={`text-center ${result.won ? 'text-vault-green' : 'text-red-400'}`}>
              <div className="text-xl font-bold">
                {result.won ? `✓ ${result.mult.toFixed(2)}× ≥ ${target}× — Won $${result.winAmount?.toFixed(2)}!` : `✗ ${result.mult.toFixed(2)}× < ${target}×`}
              </div>
            </div>
          )}

          {!result && !rolling && (
            <p className="text-gray-600 text-sm">Set your target multiplier and roll!</p>
          )}

          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Target: <span className="text-yellow-400 font-bold">{target}×</span></span>
              <span>Win chance: {winChance.toFixed(2)}%</span>
            </div>
            <div className="h-2 bg-vault-bg rounded-full overflow-hidden border border-vault-border">
              <div className="h-full bg-vault-green/40 rounded-full transition-all" style={{ width: `${winChance}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
