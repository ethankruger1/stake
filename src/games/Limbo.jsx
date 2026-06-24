import { useState, useCallback, useRef } from 'react'
import { Zap, Target } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import BetInput from '../components/UI/BetInput'

const QUICK_TARGETS = [1.5, 2, 3, 5, 10, 100]

export default function Limbo() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [bet, setBet] = useState(1)
  const [target, setTarget] = useState(2.0)
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState(null)
  const [displayMult, setDisplayMult] = useState(null)
  const [history, setHistory] = useState([])
  const animRef = useRef(null)

  const winChance = Math.min(99, +(99 / target).toFixed(2))
  const potentialPayout = +(bet * target).toFixed(2)

  const roll = useCallback(async () => {
    if (bet <= 0 || bet > balance || rolling) return
    if (!placeBet(bet)) return
    setRolling(true)
    setResult(null)

    // Cascading number animation: starts fast random, slows toward result
    const r = Math.random()
    const finalMult = +(Math.max(1.00, 99 / (r * 99 + 1))).toFixed(2)
    const won = finalMult >= target

    let frame = 0
    const totalFrames = 28
    const animate = () => {
      if (frame < totalFrames) {
        const progress = frame / totalFrames
        // Ease out: early frames show random big numbers, later frames converge to result
        const maxVal = progress > 0.6 ? finalMult * 2 : 99
        const minVal = progress > 0.7 ? finalMult * 0.5 : 1
        const rand = +(minVal + Math.random() * (maxVal - minVal)).toFixed(2)
        setDisplayMult(rand)
        frame++
        animRef.current = setTimeout(animate, 30 + frame * 2)
      } else {
        setDisplayMult(finalMult)
      }
    }
    animate()

    await new Promise(res => setTimeout(res, 900))
    clearTimeout(animRef.current)
    setDisplayMult(finalMult)

    if (won) {
      const winAmount = +(bet * target).toFixed(2)
      addWin(winAmount)
      addNotification(`⚡ ${finalMult.toFixed(2)}× ≥ ${target}× — Won $${winAmount.toFixed(2)}!`, 'win')
      addBetHistory({ id: Date.now(), game: 'Limbo', bet: bet.toFixed(2), mult: finalMult.toFixed(2), payout: winAmount.toFixed(2), won: true, time: Date.now() })
      setResult({ mult: finalMult, won: true, winAmount })
    } else {
      addNotification(`⚡ ${finalMult.toFixed(2)}× < ${target}× — Lost $${bet.toFixed(2)}`, 'loss')
      addBetHistory({ id: Date.now(), game: 'Limbo', bet: bet.toFixed(2), mult: finalMult.toFixed(2), payout: '0.00', won: false, time: Date.now() })
      setResult({ mult: finalMult, won: false })
    }

    setHistory(h => [{ mult: finalMult, won }, ...h.slice(0, 19)])
    setRolling(false)
  }, [bet, balance, rolling, target, placeBet, addWin, addBetHistory, addNotification])

  const multColor = () => {
    if (rolling) return '#9ca3af'
    if (!result) return '#374151'
    return result.won ? '#3bc117' : '#ef4444'
  }

  const multGlow = () => {
    if (!result || rolling) return 'none'
    return result.won ? '0 0 60px #22c55e66, 0 0 120px #22c55e33' : '0 0 60px #ef444466'
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
          <Zap size={20} className="text-yellow-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Limbo</h1>
          <p className="text-xs text-gray-500">VaultBet Original · Roll Over Your Target</p>
        </div>
        <div className="ml-auto flex gap-1.5 flex-wrap justify-end max-w-xs">
          {history.slice(0, 8).map((h, i) => (
            <span key={i} className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
              h.won ? 'bg-vault-green/15 border-vault-green/30 text-vault-green' : 'bg-red-900/20 border-red-500/20 text-red-400'
            }`}>
              {h.mult.toFixed(2)}×
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px,1fr] gap-6">
        <div className="panel space-y-4">
          <BetInput value={bet} onChange={setBet} disabled={rolling} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target size={11} /> Target Multiplier
              </label>
              <span className="text-xs text-yellow-400 font-semibold">{winChance.toFixed(2)}% win</span>
            </div>
            <div className="relative">
              <input
                type="number" min="1.01" max="1000000" step="0.1"
                value={target}
                onChange={e => setTarget(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
                disabled={rolling}
                className="input-field font-black text-xl pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400 font-black text-lg">×</span>
            </div>
          </div>

          {/* Quick targets */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Quick Targets</label>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_TARGETS.map(t => (
                <button key={t} onClick={() => !rolling && setTarget(t)}
                  disabled={rolling}
                  className={`py-2 rounded-xl text-sm font-bold transition-all ${
                    target === t
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                      : 'bg-vault-bg border border-vault-border text-gray-400 hover:text-yellow-400 hover:border-yellow-500/30'
                  }`}>
                  {t}×
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="panel bg-vault-bg text-center py-3">
              <div className="text-xs text-gray-500 mb-0.5">Win Chance</div>
              <div className="font-black text-white">{winChance.toFixed(2)}%</div>
            </div>
            <div className="panel bg-vault-bg text-center py-3">
              <div className="text-xs text-gray-500 mb-0.5">Profit if Win</div>
              <div className="font-black text-vault-green">+${(bet * target - bet).toFixed(2)}</div>
            </div>
          </div>

          <button onClick={roll} disabled={rolling || bet <= 0 || bet > balance}
            className="btn-primary w-full py-3 font-black text-lg flex items-center justify-center gap-2">
            {rolling
              ? <><span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Rolling...</>
              : <><Zap size={18} /> Roll</>
            }
          </button>
        </div>

        {/* Display */}
        <div className="panel flex flex-col items-center justify-center gap-5 min-h-72 relative overflow-hidden">
          {/* Background pulse on result */}
          {result && !rolling && (
            <div className={`absolute inset-0 opacity-[0.06] transition-all pointer-events-none ${result.won ? 'bg-vault-green' : 'bg-red-500'}`} />
          )}

          <style>{`
            @keyframes multPop {
              0%   { transform: scale(0.8); }
              50%  { transform: scale(1.08); }
              100% { transform: scale(1); }
            }
            @keyframes floatRocket {
              0%, 100% { transform: translateY(0); }
              50%       { transform: translateY(-8px); }
            }
          `}</style>

          {/* Rocket icon */}
          <div style={{ animation: rolling ? 'floatRocket 0.5s ease-in-out infinite' : 'none' }}
            className="text-4xl">
            🚀
          </div>

          {/* Main multiplier */}
          <div
            className="text-8xl font-black tabular-nums leading-none transition-colors duration-200"
            style={{
              color: multColor(),
              textShadow: multGlow(),
              animation: result && !rolling ? 'multPop 0.4s cubic-bezier(0.34,1.56,0.64,1)' : undefined,
              fontVariantNumeric: 'tabular-nums',
            }}>
            {displayMult !== null ? `${displayMult.toFixed(2)}×` : '—'}
          </div>

          {/* Target indicator bar */}
          <div className="w-full max-w-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">1×</span>
              <span className="text-yellow-400 font-bold flex items-center gap-1">
                <Target size={10} /> Target: {target}×
              </span>
              <span className="text-gray-500">1000×</span>
            </div>
            <div className="h-3 bg-vault-bg rounded-full overflow-hidden border border-vault-border relative">
              {/* Win zone */}
              <div className="absolute top-0 right-0 h-full bg-vault-green/20 rounded-r-full transition-all"
                style={{ width: `${Math.min(98, winChance)}%` }} />
              {/* Target line */}
              <div className="absolute top-0 h-full w-0.5 bg-yellow-400/80"
                style={{ left: `${Math.min(98, 100 - winChance)}%` }} />
              {/* Result dot */}
              {result && !rolling && displayMult !== null && (
                <div
                  className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-vault-bg transition-all duration-500 ${result.won ? 'bg-vault-green' : 'bg-red-400'}`}
                  style={{
                    left: `calc(${Math.min(98, Math.max(2, 100 - (99 / displayMult)))}% - 8px)`,
                    boxShadow: result.won ? '0 0 8px #22c55e' : '0 0 8px #ef4444',
                  }} />
              )}
            </div>
          </div>

          {/* Result text */}
          {!rolling && result && (
            <div className={`text-center font-bold ${result.won ? 'text-vault-green' : 'text-red-400'}`}>
              {result.won ? (
                <div className="text-lg">✓ {result.mult.toFixed(2)}× ≥ {target}× — Won <span className="text-white">${result.winAmount?.toFixed(2)}</span></div>
              ) : (
                <div className="text-lg">✗ {result.mult.toFixed(2)}× &lt; {target}× — Lost <span className="text-white">${bet.toFixed(2)}</span></div>
              )}
            </div>
          )}

          {!result && !rolling && (
            <p className="text-gray-600 text-sm">Set your multiplier target and roll!</p>
          )}
        </div>
      </div>
    </div>
  )
}
