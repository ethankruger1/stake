import { useState, useCallback, useRef } from 'react'
import { CircleDot, Trash2 } from 'lucide-react'
import { useWallet } from '../context/WalletContext'

const RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36])

function getColor(n) {
  if (n === 0) return 'green'
  return RED_NUMS.has(n) ? 'red' : 'black'
}

const CHIP_VALUES = [0.5, 1, 5, 25, 100, 500]
const CHIP_COLORS = { 0.5:'#6b7280', 1:'#a16207', 5:'#991b1b', 25:'#166534', 100:'#1e40af', 500:'#6b21a8' }

const NUMBERS = [
  [3,6,9,12,15,18,21,24,27,30,33,36],
  [2,5,8,11,14,17,20,23,26,29,32,35],
  [1,4,7,10,13,16,19,22,25,28,31,34],
]

function numBg(n) {
  if (n === 0) return 'bg-green-700 hover:bg-green-600 border-green-500'
  return RED_NUMS.has(n)
    ? 'bg-red-800 hover:bg-red-700 border-red-600'
    : 'bg-gray-900 hover:bg-gray-800 border-gray-700'
}

export default function Roulette() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [chipValue, setChipValue] = useState(1)
  const [bets, setBets] = useState({}) // key -> amount
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [rotation, setRotation] = useState(0)
  const [ballAngle, setBallAngle] = useState(0)
  const [winningBets, setWinningBets] = useState(new Set())

  const totalBet = Object.values(bets).reduce((a, b) => a + b, 0)

  const addBet = (key) => {
    if (spinning) return
    setBets(prev => ({ ...prev, [key]: (prev[key] || 0) + chipValue }))
  }

  const clearBets = () => { setBets({}); setWinningBets(new Set()) }

  function calcPayout(num, betMap) {
    let total = 0
    const color = getColor(num)
    const row = num === 0 ? null : NUMBERS.findIndex(r => r.includes(num))
    const col = Math.ceil(num / 3)
    const dozen = num === 0 ? null : Math.ceil(num / 12)

    for (const [key, amt] of Object.entries(betMap)) {
      if (key === `n${num}`) { total += amt * 36; continue }
      if (key === 'red' && color === 'red') { total += amt * 2; continue }
      if (key === 'black' && color === 'black') { total += amt * 2; continue }
      if (key === 'even' && num > 0 && num % 2 === 0) { total += amt * 2; continue }
      if (key === 'odd'  && num > 0 && num % 2 !== 0) { total += amt * 2; continue }
      if (key === 'low'  && num >= 1 && num <= 18) { total += amt * 2; continue }
      if (key === 'high' && num >= 19)              { total += amt * 2; continue }
      if (key === 'd1' && dozen === 1) { total += amt * 3; continue }
      if (key === 'd2' && dozen === 2) { total += amt * 3; continue }
      if (key === 'd3' && dozen === 3) { total += amt * 3; continue }
      if (key === 'c1' && col % 3 === 1) { total += amt * 3; continue }
      if (key === 'c2' && col % 3 === 2) { total += amt * 3; continue }
      if (key === 'c3' && col % 3 === 0) { total += amt * 3; continue }
      if (key === `row${row}` && row === NUMBERS.findIndex(r => r.includes(num))) { total += amt * 3; continue }
    }
    return +total.toFixed(2)
  }

  const spin = useCallback(async () => {
    if (totalBet <= 0 || totalBet > balance || spinning) return
    if (!placeBet(totalBet)) return
    setSpinning(true)
    setResult(null)
    setWinningBets(new Set())

    const num = Math.floor(Math.random() * 37)
    const extraSpins = 5 + Math.floor(Math.random() * 4)
    const finalDeg = rotation + extraSpins * 360 + Math.random() * 360
    setRotation(finalDeg)
    setBallAngle(prev => prev - finalDeg * 2.3)

    await new Promise(r => setTimeout(r, 4200))

    const payout = calcPayout(num, bets)
    const color = getColor(num)

    const wins = new Set(Object.keys(bets).filter(key => {
      if (key === `n${num}`) return true
      if (key === 'red' && color === 'red') return true
      if (key === 'black' && color === 'black') return true
      if (key === 'even' && num > 0 && num % 2 === 0) return true
      if (key === 'odd'  && num > 0 && num % 2 !== 0) return true
      if (key === 'low'  && num >= 1 && num <= 18) return true
      if (key === 'high' && num >= 19) return true
      const dozen = Math.ceil(num / 12)
      if (key === `d${dozen}`) return true
      return false
    }))
    setWinningBets(wins)

    if (payout > 0) {
      addWin(payout)
      addNotification(`🎡 ${num} ${color}! Won $${payout.toFixed(2)}!`, 'win')
    } else {
      addNotification(`🎡 ${num} ${color} — No win`, 'loss')
    }
    addBetHistory({ id: Date.now(), game: 'Roulette', bet: totalBet.toFixed(2), mult: payout > 0 ? (payout/totalBet).toFixed(2) : '0.00', payout: payout.toFixed(2), won: payout > 0, time: Date.now() })
    setResult({ num, color, payout })
    setHistory(h => [{ num, color }, ...h.slice(0, 24)])
    setSpinning(false)
  }, [totalBet, balance, spinning, bets, rotation, placeBet, addWin, addBetHistory, addNotification])

  const BetSpot = ({ betKey, label, extra = '', payout: p, slim }) => {
    const amt = bets[betKey] || 0
    const isWin = winningBets.has(betKey)
    return (
      <button onClick={() => addBet(betKey)} disabled={spinning}
        className={`relative border text-center transition-all select-none cursor-pointer ${slim ? 'py-1 px-0.5' : 'py-2 px-1'}
          ${isWin ? 'border-vault-gold bg-yellow-500/20 shadow-lg shadow-yellow-500/20' : 'border-vault-border hover:border-vault-green/40 hover:bg-vault-hover/50'}
          ${extra} rounded`}>
        <div className={`text-xs font-bold leading-tight ${isWin ? 'text-yellow-400' : 'text-gray-300'}`}>{label}</div>
        {p && <div className="text-[8px] text-gray-600">{p}</div>}
        {amt > 0 && (
          <div className="absolute -top-2 -right-1 min-w-[20px] h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white px-1"
            style={{ backgroundColor: CHIP_COLORS[chipValue] }}>
            ${amt}
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
          <CircleDot size={20} className="text-red-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Roulette</h1>
          <p className="text-xs text-gray-500">European — 37 numbers · Single zero</p>
        </div>
        <div className="ml-auto flex gap-1 flex-wrap">
          {history.slice(0, 14).map((h, i) => (
            <span key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border ${
              h.color === 'red' ? 'bg-red-700 border-red-500 text-white' :
              h.color === 'black' ? 'bg-gray-800 border-gray-600 text-white' :
              'bg-green-700 border-green-500 text-white'
            }`}>{h.num}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr,280px] gap-5">
        {/* Betting table */}
        <div className="panel space-y-3">
          {/* Chip selector */}
          <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-vault-border">
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Chip:</span>
            {CHIP_VALUES.map(v => (
              <button key={v} onClick={() => setChipValue(v)}
                className={`w-11 h-11 rounded-full border-2 font-black text-white text-xs transition-all hover:scale-110 ${chipValue === v ? 'scale-110 ring-2 ring-white/40 shadow-lg' : 'opacity-70'}`}
                style={{ backgroundColor: CHIP_COLORS[v], borderColor: chipValue === v ? 'white' : CHIP_COLORS[v] }}>
                ${v}
              </button>
            ))}
            <button onClick={clearBets} disabled={spinning} className="ml-auto flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 disabled:opacity-40 border border-red-500/20 hover:border-red-500/40 rounded-lg px-3 py-1.5 transition-colors">
              <Trash2 size={12} /> Clear
            </button>
            {totalBet > 0 && <span className="text-sm font-bold text-white">Total: ${totalBet.toFixed(2)}</span>}
          </div>

          {/* Zero */}
          <div className="flex gap-1">
            <button onClick={() => addBet('n0')} disabled={spinning}
              className={`relative w-16 flex items-center justify-center py-8 rounded border-2 font-black text-xl transition-all cursor-pointer select-none
                ${winningBets.has('n0') ? 'border-yellow-400 bg-yellow-500/20 text-yellow-400' : 'border-green-600 bg-green-900/60 text-white hover:bg-green-800/60'}`}>
              0
              {(bets['n0'] || 0) > 0 && (
                <div className="absolute -top-2 -right-1 min-w-[22px] h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white px-1"
                  style={{ backgroundColor: CHIP_COLORS[chipValue] }}>${bets['n0']}</div>
              )}
            </button>

            {/* Number grid */}
            <div className="flex-1 grid grid-cols-12 gap-0.5">
              {NUMBERS.map((row, ri) =>
                row.map((num, ci) => {
                  const key = `n${num}`
                  const isWin = winningBets.has(key)
                  const isRed = RED_NUMS.has(num)
                  return (
                    <button key={num} onClick={() => addBet(key)} disabled={spinning}
                      className={`relative aspect-[2/3] flex items-center justify-center rounded border font-black text-sm transition-all cursor-pointer select-none
                        ${isWin ? 'border-yellow-400 shadow-lg shadow-yellow-400/30' : ''}
                        ${isRed
                          ? `bg-red-800/80 border-red-700 text-white hover:bg-red-700 ${isWin ? 'bg-yellow-500/30 border-yellow-400' : ''}`
                          : `bg-gray-900/80 border-gray-700 text-white hover:bg-gray-800 ${isWin ? 'bg-yellow-500/30 border-yellow-400' : ''}`
                        }`}>
                      {num}
                      {(bets[key] || 0) > 0 && (
                        <div className="absolute -top-1.5 -right-0.5 min-w-[18px] h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white px-0.5"
                          style={{ backgroundColor: CHIP_COLORS[chipValue] }}>${bets[key]}</div>
                      )}
                    </button>
                  )
                })
              )}
            </div>

            {/* Row bets */}
            <div className="flex flex-col gap-0.5 w-10">
              {[0,1,2].map(ri => (
                <BetSpot key={ri} betKey={`row${ri}`} label={`2:1`} extra="flex-1 bg-vault-panel/50" slim />
              ))}
            </div>
          </div>

          {/* Dozens */}
          <div className="grid grid-cols-3 gap-1">
            {[['d1','1st 12','3:1'],['d2','2nd 12','3:1'],['d3','3rd 12','3:1']].map(([k,l,p]) => (
              <BetSpot key={k} betKey={k} label={l} payout={p} extra="bg-vault-panel/50" />
            ))}
          </div>

          {/* Columns */}
          <div className="grid grid-cols-3 gap-1">
            {[['c1','Col 1','3:1'],['c2','Col 2','3:1'],['c3','Col 3','3:1']].map(([k,l,p]) => (
              <BetSpot key={k} betKey={k} label={l} payout={p} extra="bg-vault-panel/50" />
            ))}
          </div>

          {/* Outside bets */}
          <div className="grid grid-cols-6 gap-1">
            {[
              ['low','1-18','2:1','bg-vault-panel/50'],
              ['even','Even','2:1','bg-vault-panel/50'],
              ['red','Red','2:1','bg-red-900/60 border-red-700'],
              ['black','Black','2:1','bg-gray-900/80 border-gray-700'],
              ['odd','Odd','2:1','bg-vault-panel/50'],
              ['high','19-36','2:1','bg-vault-panel/50'],
            ].map(([k,l,p,ex]) => (
              <BetSpot key={k} betKey={k} label={l} payout={p} extra={ex} />
            ))}
          </div>

          {/* Spin button */}
          <button onClick={spin} disabled={spinning || totalBet <= 0 || totalBet > balance}
            className="btn-primary w-full py-3 font-black text-lg flex items-center justify-center gap-2 mt-2">
            {spinning
              ? <><span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Spinning...</>
              : `Spin — $${totalBet.toFixed(2)}`}
          </button>
        </div>

        {/* Wheel */}
        <div className="space-y-4">
          <div className="panel flex flex-col items-center gap-4 py-6">
            <div className="relative w-52 h-52">
              {/* Wheel */}
              <div className="w-52 h-52 rounded-full border-4 border-vault-border overflow-hidden relative"
                style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 4.2s cubic-bezier(0.15,0,0.1,1)' : 'none' }}>
                {Array.from({ length: 37 }, (_, i) => {
                  const angle = (i / 37) * 360
                  const num = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26][i]
                  const c = getColor(num)
                  return (
                    <div key={i} className="absolute inset-0 origin-center" style={{ transform: `rotate(${angle}deg)` }}>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[104px] origin-bottom flex items-start justify-center pt-0.5">
                        <div className={`w-5 h-7 flex items-center justify-center text-[8px] font-black text-white ${c==='red'?'bg-red-700':c==='green'?'bg-green-700':'bg-gray-900'}`}>
                          {num}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Ball */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-44 h-44 rounded-full"
                  style={{ transform: `rotate(${ballAngle}deg)`, transition: spinning ? 'transform 4.2s cubic-bezier(0.1,0,0.05,1)' : 'none' }}>
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-lg shadow-white/50 border border-gray-200" />
                </div>
              </div>
              {/* Center */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-vault-bg border-2 border-vault-border flex items-center justify-center">
                  <CircleDot size={16} className="text-vault-green" />
                </div>
              </div>
              {/* Pointer */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[16px] border-l-transparent border-r-transparent border-b-white drop-shadow z-20" />
            </div>

            {/* Result */}
            {result && !spinning && (
              <div className={`text-center rounded-xl px-6 py-3 border ${
                result.color === 'red' ? 'bg-red-900/30 border-red-500/40' :
                result.color === 'green' ? 'bg-green-900/30 border-green-500/40' :
                'bg-gray-900/80 border-gray-600/40'
              }`}>
                <div className={`text-5xl font-black ${result.color === 'red' ? 'text-red-400' : result.color === 'green' ? 'text-vault-green' : 'text-white'}`}>
                  {result.num}
                </div>
                <div className="capitalize text-sm font-bold text-gray-400 mt-1">{result.color}</div>
                {result.payout > 0
                  ? <div className="text-vault-green font-black text-lg mt-1">+${result.payout.toFixed(2)}</div>
                  : <div className="text-gray-500 text-sm mt-1">No win</div>}
              </div>
            )}
            {spinning && <div className="text-gray-500 text-sm animate-pulse">Ball is rolling…</div>}
            {!spinning && !result && <div className="text-gray-600 text-sm">Place chips and spin!</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
