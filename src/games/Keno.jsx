import { useState, useCallback } from 'react'
import { Grid3x3 } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import BetInput from '../components/UI/BetInput'

const TOTAL = 40
const DRAW_COUNT = 10

const PAYOUT_TABLE = {
  1: [0, 3.8],
  2: [0, 0, 12],
  3: [0, 0, 3, 26],
  4: [0, 0, 1, 5, 50],
  5: [0, 0, 1.5, 4, 20, 300],
  6: [0, 0, 1, 2, 7, 50, 700],
  7: [0, 0, 0, 2, 5, 20, 100, 1000],
  8: [0, 0, 0, 1, 4, 12, 50, 300, 2000],
  9: [0, 0, 0, 1, 2, 8, 30, 100, 500, 4000],
  10: [0, 0, 0, 1, 2, 4, 15, 50, 200, 1000, 10000],
}

export default function Keno() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [bet, setBet] = useState(1)
  const [selected, setSelected] = useState(new Set())
  const [drawn, setDrawn] = useState([])
  const [playing, setPlaying] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])

  const toggleNumber = (n) => {
    if (playing) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else if (next.size < 10) next.add(n)
      return next
    })
  }

  const pickCount = selected.size
  const payoutRow = PAYOUT_TABLE[pickCount] || []

  const play = useCallback(async () => {
    if (selected.size === 0 || bet <= 0 || bet > balance || playing) return
    if (!placeBet(bet)) return
    setPlaying(true)
    setDrawn([])
    setResult(null)

    const allNums = Array.from({ length: TOTAL }, (_, i) => i + 1)
    const shuffled = allNums.sort(() => Math.random() - 0.5)
    const drawnNums = shuffled.slice(0, DRAW_COUNT)

    for (let i = 0; i < drawnNums.length; i++) {
      await new Promise(r => setTimeout(r, 150))
      setDrawn(prev => [...prev, drawnNums[i]])
    }

    await new Promise(r => setTimeout(r, 300))

    const matches = drawnNums.filter(n => selected.has(n)).length
    const mult = payoutRow[matches] || 0
    const payout = +(bet * mult).toFixed(2)

    if (payout > 0) addWin(payout)
    addBetHistory({ id: Date.now(), game: 'Keno', bet: bet.toFixed(2), mult: mult.toFixed(2), payout: payout.toFixed(2), won: payout > 0, time: Date.now() })
    if (payout > bet) addNotification(`🎯 ${matches}/${pickCount} matches! Won $${payout.toFixed(2)}!`, 'win')
    else if (payout > 0) addNotification(`🎯 ${matches}/${pickCount} matches — $${payout.toFixed(2)} back`, 'win')
    else addNotification(`🎯 ${matches}/${pickCount} matches — Lost $${bet.toFixed(2)}`, 'loss')

    setResult({ matches, mult, payout, drawn: drawnNums })
    setHistory(h => [{ matches, pickCount }, ...h.slice(0, 9)])
    setPlaying(false)
  }, [selected, bet, balance, playing, payoutRow, placeBet, addWin, addBetHistory, addNotification])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
          <Grid3x3 size={20} className="text-pink-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Keno</h1>
          <p className="text-xs text-gray-500">VaultBet Original — Pick 1-10 Numbers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-6">
        <div className="panel space-y-4">
          <BetInput value={bet} onChange={setBet} disabled={playing} />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Selected: {pickCount}/10</span>
              <button onClick={() => setSelected(new Set())} disabled={playing} className="text-xs text-red-400 hover:text-red-300">Clear</button>
            </div>
            <div className="flex flex-wrap gap-1">
              {[...selected].map(n => (
                <span key={n} className="badge bg-pink-500/20 text-pink-400 border border-pink-500/30">{n}</span>
              ))}
            </div>
          </div>

          {pickCount > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Payout Table</label>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {payoutRow.map((mult, matches) => mult > 0 && (
                  <div key={matches} className={`flex justify-between text-xs panel py-1.5 bg-vault-bg ${result && result.matches === matches ? 'border-vault-green/50 bg-vault-green/5' : ''}`}>
                    <span className="text-gray-400">{matches} match{matches !== 1 ? 'es' : ''}</span>
                    <span className={`font-bold ${mult >= 100 ? 'text-red-400' : mult >= 10 ? 'text-purple-400' : mult >= 3 ? 'text-yellow-400' : 'text-vault-green'}`}>{mult}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result && (
            <div className={`panel text-center ${result.payout > bet ? 'border-vault-green/50 bg-green-900/20' : result.payout > 0 ? 'border-yellow-500/30 bg-yellow-900/10' : 'border-red-500/30 bg-red-900/10'}`}>
              <div className="text-lg font-black">{result.matches}/{pickCount} matches</div>
              {result.payout > 0 ? (
                <div className="text-vault-green font-black text-xl mt-1">+${result.payout.toFixed(2)}</div>
              ) : (
                <div className="text-red-400 mt-1">No win</div>
              )}
            </div>
          )}

          <button onClick={play} disabled={playing || selected.size === 0 || bet <= 0 || bet > balance} className="btn-primary w-full py-3">
            {playing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Drawing...
              </span>
            ) : `Play ($${bet.toFixed(2)})`}
          </button>
        </div>

        {/* Number grid */}
        <div className="panel">
          <div className="grid grid-cols-8 gap-1.5">
            {Array.from({ length: TOTAL }, (_, i) => i + 1).map(n => {
              const isSelected = selected.has(n)
              const isDrawn = drawn.includes(n)
              const isMatch = isSelected && isDrawn
              return (
                <button
                  key={n}
                  onClick={() => toggleNumber(n)}
                  disabled={playing}
                  className={`aspect-square rounded-lg text-sm font-bold transition-all duration-200 ${
                    isMatch ? 'bg-vault-green text-black scale-110 shadow-lg shadow-vault-green/30' :
                    isDrawn ? 'bg-red-500/30 border border-red-500/50 text-red-300' :
                    isSelected ? 'bg-pink-500/30 border border-pink-500/60 text-pink-300 scale-105' :
                    'bg-vault-bg border border-vault-border text-gray-400 hover:border-pink-500/40 hover:text-white'
                  }`}
                >
                  {n}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-pink-500/30 border border-pink-500/60" /> Selected</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50" /> Drawn</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-vault-green" /> Match!</div>
          </div>
        </div>
      </div>
    </div>
  )
}
