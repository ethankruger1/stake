import { useState, useCallback } from 'react'
import { Dices, ArrowRight } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import BetInput from '../components/UI/BetInput'

export default function Dice() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [bet, setBet] = useState(1)
  const [target, setTarget] = useState(50)
  const [mode, setMode] = useState('under') // over | under
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])

  const winChance = mode === 'under' ? target : 100 - target
  const multiplier = +(99 / winChance).toFixed(4)

  const roll = useCallback(async () => {
    if (bet <= 0 || bet > balance || rolling) return
    if (!placeBet(bet)) return

    setRolling(true)
    setResult(null)

    await new Promise(r => setTimeout(r, 400))

    const rolled = +(Math.random() * 100).toFixed(2)
    const won = mode === 'under' ? rolled < target : rolled > target

    if (won) {
      const payout = +(bet * multiplier).toFixed(2)
      addWin(payout)
      addNotification(`🎲 Rolled ${rolled.toFixed(2)} — Won $${payout.toFixed(2)}!`, 'win')
      addBetHistory({ id: Date.now(), game: 'Dice', bet: bet.toFixed(2), mult: multiplier.toFixed(2), payout: payout.toFixed(2), won: true, time: Date.now() })
      setResult({ value: rolled, won: true, payout })
    } else {
      addNotification(`🎲 Rolled ${rolled.toFixed(2)} — Lost $${bet.toFixed(2)}`, 'loss')
      addBetHistory({ id: Date.now(), game: 'Dice', bet: bet.toFixed(2), mult: '0.00', payout: '0.00', won: false, time: Date.now() })
      setResult({ value: rolled, won: false })
    }

    setHistory(h => [{ value: rolled, won }, ...h.slice(0, 19)])
    setRolling(false)
  }, [bet, balance, rolling, mode, target, multiplier, placeBet, addWin, addBetHistory, addNotification])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <Dices size={20} className="text-blue-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Dice</h1>
          <p className="text-xs text-gray-500">VaultBet Original</p>
        </div>
        <div className="ml-auto flex gap-1 flex-wrap justify-end">
          {history.slice(0, 10).map((h, i) => (
            <span key={i} className={`badge font-bold text-xs ${h.won ? 'bg-vault-green/20 text-vault-green' : 'bg-red-900/30 text-red-400'}`}>
              {h.value.toFixed(1)}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px,1fr] gap-6">
        {/* Controls */}
        <div className="panel space-y-4">
          <BetInput value={bet} onChange={setBet} disabled={rolling} />

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {['under', 'over'].map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`py-2 rounded-lg font-semibold text-sm capitalize transition-all ${
                    mode === m ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'bg-vault-bg border border-vault-border text-gray-400 hover:text-white'
                  }`}
                >
                  Roll {m === 'under' ? 'Under' : 'Over'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Target: {target}</label>
              <span className="text-xs text-gray-500">Win: {winChance.toFixed(2)}%</span>
            </div>
            <input
              type="range" min="2" max="98" value={target}
              onChange={e => setTarget(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="panel bg-vault-bg">
              <div className="text-xs text-gray-500">Win Chance</div>
              <div className="font-bold text-white">{winChance.toFixed(2)}%</div>
            </div>
            <div className="panel bg-vault-bg">
              <div className="text-xs text-gray-500">Multiplier</div>
              <div className="font-bold text-vault-green">{multiplier.toFixed(4)}×</div>
            </div>
            <div className="panel bg-vault-bg">
              <div className="text-xs text-gray-500">Profit</div>
              <div className="font-bold text-white">${(bet * multiplier - bet).toFixed(2)}</div>
            </div>
          </div>

          <button onClick={roll} disabled={rolling || bet <= 0 || bet > balance} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {rolling ? (
              <>
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Rolling...
              </>
            ) : (
              <>
                <Dices size={16} />
                Roll Dice
              </>
            )}
          </button>
        </div>

        {/* Display */}
        <div className="panel flex flex-col items-center justify-center min-h-72 gap-6">
          {/* Result number */}
          <div className={`text-8xl font-black transition-all duration-300 ${
            rolling ? 'animate-pulse text-gray-600' :
            result ? (result.won ? 'text-vault-green' : 'text-red-400') : 'text-gray-700'
          }`}>
            {rolling ? '??' : result ? result.value.toFixed(2) : '—'}
          </div>

          {result && !rolling && (
            <div className={`text-center ${result.won ? 'text-vault-green' : 'text-red-400'}`}>
              <div className="text-xl font-bold">
                {result.won ? `✓ Won $${result.payout?.toFixed(2)}` : '✗ Lost'}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {mode === 'under' ? `Rolled ${result.value.toFixed(2)} < ${target}` : `Rolled ${result.value.toFixed(2)} > ${target}`}
              </div>
            </div>
          )}

          {/* Slider visualization */}
          <div className="w-full max-w-sm">
            <div className="relative h-8 bg-vault-bg rounded-full overflow-hidden border border-vault-border">
              <div
                className={`absolute top-0 left-0 h-full transition-all duration-300 ${mode === 'under' ? 'bg-vault-green/20' : 'bg-vault-bg'}`}
                style={{ width: `${target}%` }}
              />
              <div
                className={`absolute top-0 right-0 h-full transition-all duration-300 ${mode === 'over' ? 'bg-vault-green/20' : 'bg-vault-bg'}`}
                style={{ width: `${100 - target}%` }}
              />
              {/* Target line */}
              <div className="absolute top-0 h-full w-0.5 bg-white/50" style={{ left: `${target}%` }} />
              {/* Result dot */}
              {result && !rolling && (
                <div
                  className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-all duration-500 ${result.won ? 'bg-vault-green' : 'bg-red-400'}`}
                  style={{ left: `${result.value}%`, marginLeft: -6 }}
                />
              )}
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1 px-1">
              <span>0</span>
              <span>{target} (target)</span>
              <span>100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
