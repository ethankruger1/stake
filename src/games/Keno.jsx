import { useState, useCallback } from 'react'
import { Grid3x3, Shuffle, Zap } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import BetInput from '../components/UI/BetInput'

const TOTAL = 40
const DRAW_COUNT = 10

const PAYOUT_TABLE = {
  1:  [0, 3.8],
  2:  [0, 0, 12],
  3:  [0, 0, 3, 26],
  4:  [0, 0, 1, 5, 50],
  5:  [0, 0, 1.5, 4, 20, 300],
  6:  [0, 0, 1, 2, 7, 50, 700],
  7:  [0, 0, 0, 2, 5, 20, 100, 1000],
  8:  [0, 0, 0, 1, 4, 12, 50, 300, 2000],
  9:  [0, 0, 0, 1, 2, 8, 30, 100, 500, 4000],
  10: [0, 0, 0, 1, 2, 4, 15, 50, 200, 1000, 10000],
}

function multColor(mult) {
  if (mult >= 1000) return 'text-purple-400'
  if (mult >= 100) return 'text-red-400'
  if (mult >= 20) return 'text-orange-400'
  if (mult >= 5) return 'text-yellow-400'
  return 'text-vault-green'
}

export default function Keno() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [bet, setBet] = useState(1)
  const [selected, setSelected] = useState(new Set())
  const [drawn, setDrawn] = useState([])
  const [drawing, setDrawing] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])

  const pickCount = selected.size
  const payoutRow = PAYOUT_TABLE[pickCount] || []

  const toggleNumber = (n) => {
    if (drawing) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(n)) { next.delete(n) }
      else if (next.size < 10) { next.add(n) }
      return next
    })
  }

  const autoPick = () => {
    if (drawing) return
    const count = pickCount > 0 ? pickCount : 5
    const nums = Array.from({ length: TOTAL }, (_, i) => i + 1)
    const shuffled = nums.sort(() => Math.random() - 0.5)
    setSelected(new Set(shuffled.slice(0, count)))
  }

  const play = useCallback(async () => {
    if (selected.size === 0 || bet <= 0 || bet > balance || drawing) return
    if (!placeBet(bet)) return
    setDrawing(true)
    setDrawn([])
    setResult(null)

    const allNums = Array.from({ length: TOTAL }, (_, i) => i + 1)
    const shuffled = allNums.sort(() => Math.random() - 0.5)
    const drawnNums = shuffled.slice(0, DRAW_COUNT)

    for (let i = 0; i < drawnNums.length; i++) {
      await new Promise(r => setTimeout(r, 180))
      setDrawn(prev => [...prev, drawnNums[i]])
    }

    await new Promise(r => setTimeout(r, 400))

    const matches = drawnNums.filter(n => selected.has(n)).length
    const mult = payoutRow[matches] || 0
    const payout = +(bet * mult).toFixed(2)

    if (payout > 0) addWin(payout)
    addBetHistory({ id: Date.now(), game: 'Keno', bet: bet.toFixed(2), mult: mult.toFixed(2), payout: payout.toFixed(2), won: payout > 0, time: Date.now() })
    if (payout > bet) addNotification(`🎯 ${matches}/${pickCount} matches! Won $${payout.toFixed(2)}!`, 'win')
    else if (payout > 0) addNotification(`🎯 ${matches}/${pickCount} — $${payout.toFixed(2)} back`, 'win')
    else addNotification(`🎯 ${matches}/${pickCount} matches — Lost $${bet.toFixed(2)}`, 'loss')

    setResult({ matches, mult, payout, drawn: drawnNums })
    setHistory(h => [{ matches, pickCount, won: payout > bet }, ...h.slice(0, 9)])
    setDrawing(false)
  }, [selected, bet, balance, drawing, payoutRow, placeBet, addWin, addBetHistory, addNotification])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
          <Grid3x3 size={20} className="text-pink-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Keno</h1>
          <p className="text-xs text-gray-500">VaultBet Original · Pick 1–10 Numbers</p>
        </div>
        <div className="ml-auto flex gap-1.5">
          {history.slice(0, 8).map((h, i) => (
            <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black border ${
              h.won ? 'bg-vault-green/20 border-vault-green/40 text-vault-green' : 'bg-red-900/20 border-red-500/20 text-red-400'
            }`}>
              {h.matches}/{h.pickCount}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-6">
        <div className="panel space-y-4">
          <BetInput value={bet} onChange={setBet} disabled={drawing} />

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={autoPick} disabled={drawing}
              className="py-2 rounded-xl border border-vault-border bg-vault-bg text-xs font-bold text-gray-400 hover:text-pink-400 hover:border-pink-500/30 transition-all flex items-center justify-center gap-1.5">
              <Shuffle size={12} /> Auto Pick
            </button>
            <button onClick={() => !drawing && setSelected(new Set())} disabled={drawing}
              className="py-2 rounded-xl border border-vault-border bg-vault-bg text-xs font-bold text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-all">
              Clear All
            </button>
          </div>

          {/* Selected count */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Selected: <span className="text-pink-400">{pickCount}</span>/10
              </span>
            </div>
            <div className="h-1.5 bg-vault-bg rounded-full overflow-hidden border border-vault-border">
              <div className="h-full bg-pink-500 rounded-full transition-all duration-300"
                style={{ width: `${(pickCount / 10) * 100}%` }} />
            </div>
          </div>

          {/* Payout table */}
          {pickCount > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Payout Table</label>
              <div className="space-y-1 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
                {payoutRow.map((mult, matches) => {
                  if (mult <= 0) return null
                  const isWin = result && result.matches === matches
                  return (
                    <div key={matches}
                      className={`flex items-center justify-between text-xs rounded-lg px-2.5 py-1.5 border transition-all ${
                        isWin
                          ? 'bg-vault-green/15 border-vault-green/40'
                          : 'bg-vault-bg border-vault-border/60'
                      }`}>
                      <span className="text-gray-400">{matches}/{pickCount} match{matches !== 1 ? 'es' : ''}</span>
                      <span className={`font-black ${isWin ? 'text-vault-green' : multColor(mult)}`}>{mult}×</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Result card */}
          {result && !drawing && (
            <div className={`rounded-xl p-3 text-center border ${
              result.payout > bet ? 'bg-vault-green/10 border-vault-green/30' :
              result.payout > 0 ? 'bg-yellow-500/10 border-yellow-500/30' :
              'bg-red-900/15 border-red-500/20'
            }`}>
              <div className="text-sm text-gray-400">{result.matches} / {pickCount} matches</div>
              {result.payout > 0 ? (
                <div className="text-vault-green font-black text-2xl mt-0.5">+${result.payout.toFixed(2)}</div>
              ) : (
                <div className="text-red-400 font-black text-lg mt-0.5">No Win</div>
              )}
              {result.mult > 0 && (
                <div className="text-xs text-gray-500 mt-0.5">{result.mult}× multiplier</div>
              )}
            </div>
          )}

          <button onClick={play} disabled={drawing || selected.size === 0 || bet <= 0 || bet > balance}
            className="btn-primary w-full py-3 font-black text-lg flex items-center justify-center gap-2">
            {drawing ? (
              <><span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Drawing...</>
            ) : (
              <><Zap size={18} /> {result ? 'Play Again' : `Bet $${bet.toFixed(2)}`}</>
            )}
          </button>
        </div>

        {/* Number Grid */}
        <div className="panel">
          <style>{`
            @keyframes ballPop {
              0%   { transform: scale(0.4); opacity: 0; }
              60%  { transform: scale(1.2); }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>

          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: TOTAL }, (_, i) => i + 1).map(n => {
              const isSelected = selected.has(n)
              const isDrawn = drawn.includes(n)
              const isMatch = isSelected && isDrawn
              const isMissed = !isSelected && isDrawn

              return (
                <button
                  key={isDrawn ? `${n}-drawn` : n}
                  onClick={() => toggleNumber(n)}
                  disabled={drawing}
                  className={`aspect-square rounded-xl font-black text-sm transition-colors duration-150 relative ${
                    isMatch
                      ? 'text-black'
                      : isMissed
                      ? 'text-orange-300 border border-orange-500/40 bg-orange-500/10'
                      : isSelected
                      ? 'text-pink-200 border-2 border-pink-500/60 bg-pink-500/20 hover:border-pink-400'
                      : 'bg-vault-bg border border-vault-border text-gray-500 hover:border-pink-500/30 hover:text-gray-200'
                  }`}
                  style={{
                    animation: isDrawn ? 'ballPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' : undefined,
                    backgroundColor: isMatch ? '#3bc117' : undefined,
                    boxShadow: isMatch ? '0 0 14px #3bc11766' : undefined,
                  }}>
                  {n}
                </button>
              )
            })}
          </div>

          {/* Draw progress */}
          {drawing && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Drawing balls...</span>
                <span>{drawn.length} / {DRAW_COUNT}</span>
              </div>
              <div className="h-1.5 bg-vault-bg rounded-full overflow-hidden border border-vault-border">
                <div className="h-full bg-pink-500 rounded-full transition-all duration-200"
                  style={{ width: `${(drawn.length / DRAW_COUNT) * 100}%` }} />
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-pink-500/20 border-2 border-pink-500/60" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-vault-green" style={{ boxShadow: '0 0 8px #3bc11766' }} />
              <span>Match!</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-orange-500/10 border border-orange-500/40" />
              <span>Drawn (not selected)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
