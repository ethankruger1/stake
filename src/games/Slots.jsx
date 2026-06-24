import { useState, useCallback, useRef } from 'react'
import { Layers } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import BetInput from '../components/UI/BetInput'

const SYMBOLS = [
  { icon: '7️⃣', name: 'seven', mult: 50, weight: 1 },
  { icon: '💎', name: 'diamond', mult: 20, weight: 2 },
  { icon: '🔔', name: 'bell', mult: 10, weight: 4 },
  { icon: '🍒', name: 'cherry', mult: 5, weight: 8 },
  { icon: '🍋', name: 'lemon', mult: 3, weight: 10 },
  { icon: '🍇', name: 'grape', mult: 2, weight: 12 },
  { icon: '⭐', name: 'star', mult: 8, weight: 5 },
  { icon: '🃏', name: 'wild', mult: 0, weight: 3 },
]

const REEL_SIZE = 5

function weightedRandom() {
  const totalWeight = SYMBOLS.reduce((a, s) => a + s.weight, 0)
  let r = Math.random() * totalWeight
  for (const sym of SYMBOLS) {
    r -= sym.weight
    if (r <= 0) return sym
  }
  return SYMBOLS[SYMBOLS.length - 1]
}

function generateReels() {
  return Array.from({ length: 3 }, () =>
    Array.from({ length: REEL_SIZE }, weightedRandom)
  )
}

function checkWins(grid) {
  const winLines = []
  const rows = 3
  const cols = grid.length

  // Horizontal lines (3 rows × 3 cols visible window = row 1, 2, 3)
  for (let row = 0; row < rows; row++) {
    const rowSymbols = grid.map(reel => reel[row + 1])
    const first = rowSymbols[0]
    if (rowSymbols.every(s => s.name === first.name || s.name === 'wild' || first.name === 'wild')) {
      const nonWild = rowSymbols.find(s => s.name !== 'wild') || first
      winLines.push({ row, symbols: rowSymbols, mult: nonWild.mult, line: row })
    }
  }

  return winLines
}

function Reel({ symbols, spinning, spinDelay }) {
  const visible = symbols.slice(1, 4)
  return (
    <div className="flex-1 bg-vault-bg border border-vault-border rounded-xl overflow-hidden">
      <div className={`transition-all duration-500 ${spinning ? 'blur-sm scale-y-105' : ''}`}
        style={{ transitionDelay: `${spinDelay}ms` }}>
        {visible.map((sym, i) => (
          <div
            key={i}
            className={`h-20 flex items-center justify-center text-4xl border-b border-vault-border last:border-b-0 ${
              i === 1 ? 'bg-vault-panel/50' : ''
            }`}
          >
            {sym.icon}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Slots() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [bet, setBet] = useState(1)
  const [reels, setReels] = useState(() => generateReels())
  const [spinning, setSpinning] = useState(false)
  const [wins, setWins] = useState([])
  const [result, setResult] = useState(null)
  const [autoSpin, setAutoSpin] = useState(false)
  const [history, setHistory] = useState([])
  const autoRef = useRef(false)

  const spin = useCallback(async (auto = false) => {
    if (spinning || bet <= 0 || bet > balance) return
    if (!placeBet(bet)) return
    setSpinning(true)
    setWins([])
    setResult(null)

    const newReels = generateReels()
    await new Promise(r => setTimeout(r, 100))
    setReels(newReels)
    await new Promise(r => setTimeout(r, 600))

    const winLines = checkWins(newReels)
    const totalMult = winLines.reduce((a, w) => a + w.mult, 0)
    const payout = +(bet * totalMult).toFixed(2)

    setWins(winLines.map(w => w.line))

    if (payout > 0) {
      addWin(payout)
      addNotification(`🎰 ${winLines.map(w => `${w.mult}×`).join(' + ')} — Won $${payout.toFixed(2)}!`, 'win')
    } else {
      addNotification(`🎰 No win`, 'loss')
    }

    addBetHistory({ id: Date.now(), game: 'Slots', bet: bet.toFixed(2), mult: totalMult.toFixed(2), payout: payout.toFixed(2), won: payout > 0, time: Date.now() })
    setResult({ payout, totalMult, winLines })
    setHistory(h => [{ won: payout > 0, mult: totalMult }, ...h.slice(0, 19)])
    setSpinning(false)

    if (autoRef.current) {
      setTimeout(() => { if (autoRef.current) spin(true) }, 800)
    }
  }, [spinning, bet, balance, placeBet, addWin, addBetHistory, addNotification])

  const toggleAuto = () => {
    autoRef.current = !autoSpin
    setAutoSpin(!autoSpin)
    if (!autoSpin && !spinning) spin(true)
  }

  const PAYTABLE = SYMBOLS.filter(s => s.mult > 0).sort((a, b) => b.mult - a.mult)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
          <Layers size={20} className="text-yellow-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Slots</h1>
          <p className="text-xs text-gray-500">5-Reel Classic — 3 Win Lines</p>
        </div>
        <div className="ml-auto flex gap-1">
          {history.slice(0, 10).map((h, i) => (
            <div key={i} className={`w-5 h-5 rounded-full border-2 ${h.won ? 'border-vault-green bg-vault-green/20' : 'border-vault-border bg-vault-bg'}`} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-6">
        <div className="panel space-y-4">
          <BetInput value={bet} onChange={setBet} disabled={spinning || autoSpin} />

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Pay Table</label>
            <div className="space-y-1.5">
              {PAYTABLE.map(sym => (
                <div key={sym.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{sym.icon}{sym.icon}{sym.icon}</span>
                  </div>
                  <span className={`font-black ${sym.mult >= 20 ? 'text-red-400' : sym.mult >= 10 ? 'text-purple-400' : sym.mult >= 5 ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {sym.mult}×
                  </span>
                </div>
              ))}
            </div>
          </div>

          {result && (
            <div className={`panel text-center ${result.payout > 0 ? 'border-vault-green/50 bg-green-900/20' : 'border-red-500/30'}`}>
              {result.payout > 0 ? (
                <>
                  <div className="text-vault-green font-black text-2xl">+${result.payout.toFixed(2)}</div>
                  <div className="text-xs text-gray-400 mt-1">{result.winLines.length} line win!</div>
                </>
              ) : (
                <div className="text-gray-500">No win this spin</div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => spin()}
              disabled={spinning || autoSpin || bet <= 0 || bet > balance}
              className="btn-primary py-3 flex items-center justify-center gap-1"
            >
              {spinning ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : '🎰'} Spin
            </button>
            <button
              onClick={toggleAuto}
              disabled={spinning && !autoSpin}
              className={`py-3 rounded-xl font-bold text-sm transition-all ${autoSpin ? 'btn-red' : 'btn-secondary'}`}
            >
              {autoSpin ? 'Stop Auto' : 'Auto Spin'}
            </button>
          </div>
        </div>

        {/* Slot machine display */}
        <div className="panel">
          {/* Win lines indicators */}
          <div className="flex gap-1 mb-3">
            {[0, 1, 2].map(line => (
              <div key={line} className={`flex-1 h-1 rounded-full transition-colors ${wins.includes(line) ? 'bg-vault-green animate-pulse' : 'bg-vault-border'}`} />
            ))}
          </div>

          {/* Reels */}
          <div className="flex gap-2 mb-3">
            {reels.map((reel, i) => (
              <Reel key={i} symbols={reel} spinning={spinning} spinDelay={i * 100} />
            ))}
          </div>

          {/* Win line highlights */}
          <div className="space-y-1">
            {[0, 1, 2].map(line => (
              <div key={line} className={`h-0.5 rounded-full transition-all ${wins.includes(line) ? 'bg-vault-green opacity-100' : 'bg-vault-border/30'}`} />
            ))}
          </div>

          {/* Win announcement */}
          {result?.payout > 0 && !spinning && (
            <div className="mt-4 text-center">
              <div className="text-vault-green font-black text-3xl animate-bounce">
                🎉 WIN! ${result.payout.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
