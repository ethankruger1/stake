import { useState, useCallback, useRef, useEffect } from 'react'
import { Layers } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import BetInput from '../components/UI/BetInput'

const SYMBOLS = [
  { id: 'seven',   icon: '7',  label: 'Seven',   mult: 50, weight: 1,  color: '#ef4444' },
  { id: 'diamond', icon: '💎', label: 'Diamond', mult: 20, weight: 2,  color: '#06b6d4' },
  { id: 'bell',    icon: '🔔', label: 'Bell',    mult: 10, weight: 4,  color: '#f59e0b' },
  { id: 'star',    icon: '⭐', label: 'Star',    mult: 8,  weight: 5,  color: '#eab308' },
  { id: 'cherry',  icon: '🍒', label: 'Cherry',  mult: 5,  weight: 8,  color: '#ec4899' },
  { id: 'bar',     icon: 'BAR',label: 'Bar',     mult: 4,  weight: 6,  color: '#94a3b8' },
  { id: 'lemon',   icon: '🍋', label: 'Lemon',  mult: 3,  weight: 10, color: '#eab308' },
  { id: 'grape',   icon: '🍇', label: 'Grape',  mult: 2,  weight: 12, color: '#a855f7' },
  { id: 'wild',    icon: '★',  label: 'Wild',   mult: 0,  weight: 3,  color: '#3bc117' },
]

const TOTAL_WEIGHT = SYMBOLS.reduce((a, s) => a + s.weight, 0)

function weightedRandom() {
  let r = Math.random() * TOTAL_WEIGHT
  for (const sym of SYMBOLS) { r -= sym.weight; if (r <= 0) return sym }
  return SYMBOLS[SYMBOLS.length - 1]
}

function generateReel(size = 20) {
  return Array.from({ length: size }, weightedRandom)
}

function checkWins(grid) {
  // grid[reel][row] - 3 reels, 3 visible rows
  const wins = []
  // 3 horizontal lines
  for (let row = 0; row < 3; row++) {
    const rowSyms = grid.map(reel => reel[row])
    const ids = rowSyms.map(s => s.id === 'wild' ? 'wild' : s.id)
    const base = ids.find(id => id !== 'wild')
    if (!base) { wins.push({ row, syms: rowSyms, mult: 10, type: 'wild' }); continue }
    const match = rowSyms.every(s => s.id === base || s.id === 'wild')
    if (match) {
      const sym = SYMBOLS.find(s => s.id === base)
      wins.push({ row, syms: rowSyms, mult: sym.mult, type: base })
    }
  }
  // Diagonals
  const diag1 = [grid[0][0], grid[1][1], grid[2][2]]
  const diag2 = [grid[0][2], grid[1][1], grid[2][0]]
  for (const [diag, type] of [[diag1, 'diag1'], [diag2, 'diag2']]) {
    const ids = diag.map(s => s.id)
    const base = ids.find(id => id !== 'wild')
    if (!base) continue
    if (diag.every(s => s.id === base || s.id === 'wild')) {
      const sym = SYMBOLS.find(s => s.id === base)
      wins.push({ type, syms: diag, mult: sym.mult * 1.5 | 0 })
    }
  }
  return wins
}

function SymbolCell({ sym, lit, spinning, delay }) {
  if (!sym) return <div className="h-20 flex items-center justify-center" />
  const isNum = sym.id === 'seven'
  const isText = sym.id === 'bar' || sym.id === 'wild'
  return (
    <div className={`h-20 flex items-center justify-center relative transition-all ${lit ? 'scale-110' : ''}`}
      style={{ filter: lit ? `drop-shadow(0 0 10px ${sym.color})` : 'none' }}>
      {isNum ? (
        <span className="text-5xl font-black" style={{ color: sym.color, textShadow: lit ? `0 0 20px ${sym.color}` : 'none' }}>7</span>
      ) : isText ? (
        <span className={`font-black text-xl px-2 py-1 rounded border ${sym.id === 'wild' ? 'text-vault-green border-vault-green/40 bg-vault-green/10' : 'text-gray-300 border-gray-600 bg-gray-800/60'}`}>
          {sym.icon}
        </span>
      ) : (
        <span className="text-4xl leading-none" style={{ filter: lit ? 'brightness(1.3)' : 'none' }}>{sym.icon}</span>
      )}
    </div>
  )
}

function Reel({ symbols, offset, spinning, winRows, reelIdx }) {
  const visible = [symbols[(offset) % symbols.length], symbols[(offset + 1) % symbols.length], symbols[(offset + 2) % symbols.length]]
  return (
    <div className="flex-1 bg-vault-bg rounded-xl overflow-hidden border border-vault-border relative">
      <div className={`transition-all duration-500 ${spinning ? 'blur-[2px]' : ''}`}>
        {visible.map((sym, row) => {
          const lit = winRows.some(w => w.row === row || w.type === 'diag1' || w.type === 'diag2')
          return (
            <div key={row} className={`border-b last:border-b-0 border-vault-border/50 ${lit && !spinning ? 'bg-vault-green/5' : ''}`}>
              <SymbolCell sym={sym} lit={lit && !spinning} spinning={spinning} delay={reelIdx * 100} />
            </div>
          )
        })}
      </div>
      {/* Spinning overlay */}
      {spinning && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-vault-green/40 border-t-vault-green rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

export default function Slots() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [bet, setBet] = useState(1)
  const [reels] = useState(() => [generateReel(), generateReel(), generateReel()])
  const [offsets, setOffsets] = useState([0, 6, 12])
  const [spinning, setSpinning] = useState([false, false, false])
  const [wins, setWins] = useState([])
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [autoSpin, setAutoSpin] = useState(false)
  const autoRef = useRef(false)
  const [lines, setLines] = useState(5) // 3 horizontal + 2 diagonal

  const getGrid = (offs) => reels.map((reel, i) => [reel[offs[i] % reel.length], reel[(offs[i]+1) % reel.length], reel[(offs[i]+2) % reel.length]])

  const spin = useCallback(async () => {
    if (spinning.some(Boolean) || bet <= 0 || bet > balance) return
    if (!placeBet(bet)) return
    setWins([])
    setResult(null)
    setSpinning([true, true, true])

    const newOffsets = reels.map(r => Math.floor(Math.random() * r.length))

    // Stop reels one by one with delay
    for (let i = 0; i < 3; i++) {
      await new Promise(r => setTimeout(r, 500 + i * 300))
      setOffsets(prev => { const n = [...prev]; n[i] = newOffsets[i]; return n })
      setSpinning(prev => { const n = [...prev]; n[i] = false; return n })
    }

    await new Promise(r => setTimeout(r, 200))

    const grid = reels.map((reel, i) => [reel[newOffsets[i] % reel.length], reel[(newOffsets[i]+1) % reel.length], reel[(newOffsets[i]+2) % reel.length]])
    const winLines = checkWins(grid)
    const totalMult = winLines.reduce((a, w) => a + w.mult, 0)
    const payout = +(bet * totalMult).toFixed(2)

    setWins(winLines)

    if (payout > 0) {
      addWin(payout)
      const topWin = winLines.reduce((a, b) => a.mult > b.mult ? a : b, winLines[0])
      addNotification(`🎰 ${winLines.length} line win${winLines.length > 1 ? 's' : ''}! ${totalMult}× — $${payout.toFixed(2)}!`, 'win')
    } else {
      addNotification(`🎰 No win this spin`, 'loss')
    }
    addBetHistory({ id: Date.now(), game: 'Slots', bet: bet.toFixed(2), mult: totalMult.toFixed(2), payout: payout.toFixed(2), won: payout > 0, time: Date.now() })
    setResult({ payout, totalMult, wins: winLines })
    setHistory(h => [{ won: payout > 0, mult: totalMult }, ...h.slice(0, 19)])

    if (autoRef.current) setTimeout(() => { if (autoRef.current) spin() }, 600)
  }, [spinning, bet, balance, reels, placeBet, addWin, addBetHistory, addNotification])

  const toggleAuto = () => {
    autoRef.current = !autoSpin
    setAutoSpin(!autoSpin)
    if (!autoSpin && !spinning.some(Boolean)) spin()
  }

  const currentGrid = getGrid(offsets)

  const PAYTABLE = [...SYMBOLS].filter(s => s.mult > 0).sort((a, b) => b.mult - a.mult)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
          <Layers size={20} className="text-yellow-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Slots</h1>
          <p className="text-xs text-gray-500">3-Reel · 5 Win Lines · Wilds Active</p>
        </div>
        <div className="ml-auto flex gap-1">
          {history.slice(0, 12).map((h, i) => (
            <div key={i} className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border ${h.won ? 'bg-vault-green/20 border-vault-green/40 text-vault-green' : 'bg-vault-border border-vault-border/50 text-gray-600'}`}>
              {h.won ? h.mult : '×'}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-6">
        <div className="space-y-4">
          <div className="panel space-y-4">
            <BetInput value={bet} onChange={setBet} disabled={spinning.some(Boolean) || autoSpin} />

            {/* Paytable */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Pay Table</label>
              <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                {PAYTABLE.map(sym => (
                  <div key={sym.id} className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-vault-hover/30 transition-colors">
                    <div className="flex items-center gap-2">
                      {sym.id === 'seven' ? <span className="font-black text-red-400 text-lg w-8 text-center">7</span>
                       : sym.id === 'bar' ? <span className="text-xs font-black text-gray-300 w-8 text-center bg-gray-800 rounded px-1 py-0.5">BAR</span>
                       : sym.id === 'wild' ? <span className="font-black text-vault-green text-lg w-8 text-center">★</span>
                       : <span className="text-xl w-8 text-center">{sym.icon}</span>}
                      <span className="text-gray-400 text-xs">{sym.label}</span>
                    </div>
                    <span className="font-black text-xs" style={{ color: sym.mult >= 20 ? '#ef4444' : sym.mult >= 10 ? '#a855f7' : sym.mult >= 5 ? '#f59e0b' : '#6b7280' }}>
                      {sym.mult}×
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm py-1 px-2 rounded border-t border-vault-border mt-1 pt-2">
                  <span className="text-gray-500 text-xs">Diagonal line</span>
                  <span className="font-black text-xs text-vault-green">×1.5 bonus</span>
                </div>
              </div>
            </div>

            {result && (
              <div className={`panel text-center ${result.payout > 0 ? 'border-vault-green/40 bg-vault-green/5' : 'border-vault-border'}`}>
                {result.payout > 0 ? (
                  <>
                    <div className="text-vault-green font-black text-2xl">+${result.payout.toFixed(2)}</div>
                    <div className="text-xs text-gray-400">{result.wins.length} line win · {result.totalMult}×</div>
                  </>
                ) : (
                  <div className="text-gray-500 text-sm">No winning lines</div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button onClick={spin} disabled={spinning.some(Boolean) || autoSpin || bet <= 0 || bet > balance}
                className="btn-primary py-3 font-black text-base flex items-center justify-center gap-1">
                {spinning.some(Boolean) ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : '🎰'} Spin
              </button>
              <button onClick={toggleAuto} disabled={spinning.some(Boolean) && !autoSpin}
                className={`py-3 rounded-xl font-bold transition-all ${autoSpin ? 'btn-red' : 'btn-secondary'}`}>
                {autoSpin ? 'Stop' : 'Auto'}
              </button>
            </div>
          </div>
        </div>

        {/* Machine */}
        <div className="panel">
          {/* Machine frame */}
          <div className="relative rounded-2xl border-2 border-vault-border bg-gradient-to-b from-vault-panel to-vault-bg p-4 mb-4 overflow-hidden">
            {/* Top decoration */}
            <div className="flex items-center justify-center mb-3 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-vault-green shadow-lg shadow-vault-green/50" />
              <span className="text-xs font-black text-gray-500 tracking-[0.3em] uppercase mx-3">VaultBet Slots</span>
              <div className="w-3 h-3 rounded-full bg-vault-green shadow-lg shadow-vault-green/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
            </div>

            {/* Reels */}
            <div className="flex gap-2">
              {reels.map((reel, i) => (
                <Reel key={i} symbols={reel} offset={offsets[i]} spinning={spinning[i]} winRows={spinning.some(Boolean) ? [] : wins} reelIdx={i} />
              ))}
            </div>

            {/* Win lines overlay */}
            {!spinning.some(Boolean) && wins.length > 0 && (
              <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 pointer-events-none">
                {wins.map((w, i) => (
                  <div key={i} className="px-3 py-1 rounded-full text-xs font-black animate-bounce"
                    style={{ backgroundColor: '#3bc11720', color: '#3bc117', border: '1px solid #3bc11740', animationDelay: `${i * 100}ms` }}>
                    {w.type === 'diag1' || w.type === 'diag2' ? '⟋' : `Row ${w.row + 1}`} — {w.mult}×
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Win lines diagram */}
          <div className="grid grid-cols-5 gap-2 text-center">
            {[
              { label: 'Line 1', desc: '⎯⎯⎯', color: '#ef4444' },
              { label: 'Line 2', desc: '⎯⎯⎯', color: '#f59e0b' },
              { label: 'Line 3', desc: '⎯⎯⎯', color: '#3b82f6' },
              { label: 'Diag /', desc: '⟋', color: '#a855f7' },
              { label: 'Diag \\', desc: '⟍', color: '#22c55e' },
            ].map((line, i) => {
              const isActive = !spinning.some(Boolean) && wins.some((w, wi) =>
                (i < 3 && w.row === i) || (i === 3 && w.type === 'diag2') || (i === 4 && w.type === 'diag1')
              )
              return (
                <div key={i} className={`panel bg-vault-bg py-2 transition-all ${isActive ? 'border-opacity-100 shadow-lg' : 'opacity-50'}`}
                  style={{ borderColor: isActive ? line.color : undefined }}>
                  <div className="text-lg font-black" style={{ color: line.color }}>{line.desc}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{line.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
