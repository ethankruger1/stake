import { useState, useCallback } from 'react'
import { Dices } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import BetInput from '../components/UI/BetInput'

function DiceFace({ value, rolling, won, lost }) {
  const dots = {
    1: [[50,50]],
    2: [[25,25],[75,75]],
    3: [[25,25],[50,50],[75,75]],
    4: [[25,25],[75,25],[25,75],[75,75]],
    5: [[25,25],[75,25],[50,50],[25,75],[75,75]],
    6: [[25,22],[75,22],[25,50],[75,50],[25,78],[75,78]],
  }

  const dv = Math.max(1, Math.min(6, Math.round((value / 100) * 6) || 1))
  const positions = dots[dv] || dots[1]

  return (
    <svg viewBox="0 0 100 100" className={`w-28 h-28 transition-all duration-300 ${rolling ? 'animate-spin' : ''}`}>
      <defs>
        <linearGradient id="diceGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={won ? '#16a34a' : lost ? '#991b1b' : '#1e2438'} />
          <stop offset="100%" stopColor={won ? '#14532d' : lost ? '#7f1d1d' : '#0f1520'} />
        </linearGradient>
        <filter id="diceShadow">
          <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor={won ? '#22c55e' : lost ? '#ef4444' : '#000'} floodOpacity="0.4"/>
        </filter>
      </defs>
      <rect x="5" y="5" width="90" height="90" rx="18" fill="url(#diceGrad)"
        stroke={won ? '#22c55e' : lost ? '#ef4444' : '#2a3348'} strokeWidth="2"
        filter="url(#diceShadow)" />
      {/* Shine */}
      <rect x="12" y="10" width="35" height="18" rx="8" fill="white" opacity="0.06" />
      {/* Dots */}
      {positions.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="8"
          fill={won ? '#4ade80' : lost ? '#f87171' : '#4a5568'}
          style={{ filter: won || lost ? `drop-shadow(0 0 3px ${won ? '#22c55e' : '#ef4444'})` : 'none' }}
        />
      ))}
    </svg>
  )
}

const QUICK_CHANCES = [
  { label: '×2', chance: 49.5 },
  { label: '×3', chance: 33 },
  { label: '×5', chance: 19.8 },
  { label: '×10', chance: 9.9 },
  { label: '×50', chance: 1.98 },
]

export default function Dice() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [bet, setBet] = useState(1)
  const [target, setTarget] = useState(50.5)
  const [mode, setMode] = useState('under')
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])

  const winChance = +(mode === 'under' ? target : 100 - target).toFixed(2)
  const multiplier = +(99 / winChance).toFixed(4)
  const profit = +(bet * multiplier - bet).toFixed(2)

  const roll = useCallback(async () => {
    if (bet <= 0 || bet > balance || rolling) return
    if (!placeBet(bet)) return
    setRolling(true)
    setResult(null)

    await new Promise(r => setTimeout(r, 600))

    const rolled = +(Math.random() * 99.99).toFixed(2)
    const won = mode === 'under' ? rolled < target : rolled > target

    if (won) {
      const payout = +(bet * multiplier).toFixed(2)
      addWin(payout)
      addNotification(`🎲 ${rolled.toFixed(2)} — Won $${payout.toFixed(2)}!`, 'win')
      addBetHistory({ id: Date.now(), game: 'Dice', bet: bet.toFixed(2), mult: multiplier.toFixed(2), payout: payout.toFixed(2), won: true, time: Date.now() })
      setResult({ value: rolled, won: true, payout })
    } else {
      addNotification(`🎲 ${rolled.toFixed(2)} — Lost`, 'loss')
      addBetHistory({ id: Date.now(), game: 'Dice', bet: bet.toFixed(2), mult: '0.00', payout: '0.00', won: false, time: Date.now() })
      setResult({ value: rolled, won: false })
    }
    setHistory(h => [{ v: rolled, won }, ...h.slice(0, 24)])
    setRolling(false)
  }, [bet, balance, rolling, mode, target, multiplier, placeBet, addWin, addBetHistory, addNotification])

  const sliderPct = mode === 'under' ? (target / 100) * 100 : ((100 - target) / 100) * 100

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <Dices size={20} className="text-blue-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Dice</h1>
          <p className="text-xs text-gray-500">VaultBet Original · Provably Fair</p>
        </div>
        <div className="ml-auto flex gap-1 flex-wrap max-w-xs justify-end">
          {history.slice(0, 14).map((h, i) => (
            <span key={i} className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${h.won ? 'bg-vault-green/15 border-vault-green/30 text-vault-green' : 'bg-red-900/20 border-red-500/20 text-red-400'}`}>
              {h.v.toFixed(1)}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-6">
        <div className="panel space-y-5">
          <BetInput value={bet} onChange={setBet} disabled={rolling} />

          {/* Mode */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Direction</label>
            <div className="grid grid-cols-2 gap-2">
              {['under','over'].map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`py-2.5 rounded-xl font-bold text-sm transition-all ${mode===m ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-inner' : 'bg-vault-bg border border-vault-border text-gray-400 hover:text-white'}`}>
                  Roll {m === 'under' ? '⬇ Under' : '⬆ Over'}
                </button>
              ))}
            </div>
          </div>

          {/* Target slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Target: <span className="text-white">{target.toFixed(2)}</span></label>
              <span className="text-xs text-blue-400 font-semibold">Win {winChance}%</span>
            </div>
            <div className="relative">
              <input type="range" min="1" max="99" step="0.5" value={mode === 'under' ? target : 100 - target}
                onChange={e => setTarget(mode === 'under' ? +e.target.value : 100 - +e.target.value)}
                disabled={rolling}
                className="w-full h-3 rounded-full appearance-none cursor-pointer disabled:opacity-40"
                style={{ background: `linear-gradient(to right, #3b82f680 0%, #3b82f680 ${winChance}%, #1e2438 ${winChance}%, #1e2438 100%)` }}
              />
            </div>
          </div>

          {/* Quick bets */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Quick Select</label>
            <div className="grid grid-cols-5 gap-1">
              {QUICK_CHANCES.map(({ label, chance }) => (
                <button key={label} onClick={() => { setTarget(mode === 'under' ? chance : 100 - chance) }}
                  className="py-1.5 rounded-lg text-xs font-bold bg-vault-bg border border-vault-border text-gray-400 hover:text-blue-400 hover:border-blue-500/30 transition-all">
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="panel bg-vault-bg py-2.5">
              <div className="text-[10px] text-gray-500 mb-0.5">Win Chance</div>
              <div className="font-black text-white text-sm">{winChance}%</div>
            </div>
            <div className="panel bg-vault-bg py-2.5">
              <div className="text-[10px] text-gray-500 mb-0.5">Multiplier</div>
              <div className="font-black text-vault-green text-sm">{multiplier.toFixed(2)}×</div>
            </div>
            <div className="panel bg-vault-bg py-2.5">
              <div className="text-[10px] text-gray-500 mb-0.5">Profit</div>
              <div className="font-black text-white text-sm">${profit.toFixed(2)}</div>
            </div>
          </div>

          <button onClick={roll} disabled={rolling || bet <= 0 || bet > balance}
            className="btn-primary w-full py-3 font-black text-lg flex items-center justify-center gap-2">
            {rolling
              ? <><span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Rolling…</>
              : <><Dices size={20} /> Roll Dice</>}
          </button>
        </div>

        {/* Display */}
        <div className="panel flex flex-col items-center justify-center gap-6 min-h-80">
          <DiceFace
            value={result ? result.value : 50}
            rolling={rolling}
            won={!rolling && result?.won}
            lost={!rolling && result && !result.won}
          />

          {/* Number display */}
          <div className={`text-7xl font-black tabular-nums transition-all duration-200 ${
            rolling ? 'text-gray-600 animate-pulse' :
            result?.won ? 'text-vault-green drop-shadow-[0_0_20px_#22c55e]' :
            result ? 'text-red-400' : 'text-gray-700'
          }`}>
            {rolling ? '??' : result ? result.value.toFixed(2) : '—'}
          </div>

          {result && !rolling && (
            <div className={`text-center font-bold ${result.won ? 'text-vault-green' : 'text-red-400'}`}>
              <div className="text-xl">
                {result.won ? `✓ Won $${result.payout?.toFixed(2)}` : '✗ Lost'}
              </div>
              <div className="text-sm text-gray-400 font-normal mt-1">
                Rolled <span className="font-bold text-white">{result.value.toFixed(2)}</span>
                {mode === 'under' ? ` < ${target.toFixed(2)}` : ` > ${target.toFixed(2)}`}
              </div>
            </div>
          )}

          {/* Track bar */}
          <div className="w-full max-w-sm">
            <div className="relative h-10 bg-vault-bg rounded-xl overflow-hidden border border-vault-border">
              {/* Win zone */}
              <div className={`absolute top-0 h-full opacity-25 transition-all duration-300 ${mode === 'under' ? 'left-0 bg-vault-green' : 'right-0 bg-vault-green'}`}
                style={{ width: `${winChance}%` }} />
              {/* Target line */}
              <div className="absolute top-0 h-full w-0.5 bg-blue-400/60"
                style={{ left: `${mode === 'under' ? target : 100 - target}%` }} />
              {/* Result dot */}
              {result && !rolling && (
                <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg transition-all duration-500 ${result.won ? 'bg-vault-green shadow-vault-green/50' : 'bg-red-400 shadow-red-400/50'}`}
                  style={{ left: `calc(${result.value}% - 8px)` }} />
              )}
              {/* Labels */}
              <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
                <span className="text-xs text-gray-600 font-mono">0</span>
                <span className="text-xs text-blue-400 font-bold">{mode === 'under' ? `< ${target.toFixed(2)}` : `> ${target.toFixed(2)}`}</span>
                <span className="text-xs text-gray-600 font-mono">100</span>
              </div>
            </div>
          </div>

          {!result && !rolling && (
            <p className="text-gray-600 text-sm">Place a bet to roll the dice</p>
          )}
        </div>
      </div>
    </div>
  )
}
