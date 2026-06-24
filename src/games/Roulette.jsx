import { useState, useCallback, useRef } from 'react'
import { CircleDot } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import BetInput from '../components/UI/BetInput'

const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
const WHEEL_ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26]

function getColor(n) {
  if (n === 0) return 'green'
  return RED_NUMBERS.includes(n) ? 'red' : 'black'
}

const BET_TYPES = [
  { label: 'Red', payout: 2, check: n => n > 0 && RED_NUMBERS.includes(n) },
  { label: 'Black', payout: 2, check: n => n > 0 && !RED_NUMBERS.includes(n) },
  { label: 'Even', payout: 2, check: n => n > 0 && n % 2 === 0 },
  { label: 'Odd', payout: 2, check: n => n > 0 && n % 2 !== 0 },
  { label: '1-18', payout: 2, check: n => n >= 1 && n <= 18 },
  { label: '19-36', payout: 2, check: n => n >= 19 && n <= 36 },
  { label: '1st 12', payout: 3, check: n => n >= 1 && n <= 12 },
  { label: '2nd 12', payout: 3, check: n => n >= 13 && n <= 24 },
  { label: '3rd 12', payout: 3, check: n => n >= 25 && n <= 36 },
]

export default function Roulette() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [bet, setBet] = useState(1)
  const [selectedBets, setSelectedBets] = useState({})
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [rotation, setRotation] = useState(0)
  const animRef = useRef(null)

  const totalBet = Object.values(selectedBets).reduce((a, b) => a + b, 0)

  const toggleBet = (label) => {
    if (spinning) return
    setSelectedBets(prev => ({
      ...prev,
      [label]: (prev[label] || 0) + parseFloat(bet) || parseFloat(bet),
    }))
  }

  const clearBets = () => setSelectedBets({})

  const spin = useCallback(async () => {
    if (totalBet <= 0 || totalBet > balance || spinning) return
    if (!placeBet(totalBet)) return
    setSpinning(true)
    setResult(null)

    const targetNum = WHEEL_ORDER[Math.floor(Math.random() * WHEEL_ORDER.length)]
    const idx = WHEEL_ORDER.indexOf(targetNum)
    const degPerSlot = 360 / WHEEL_ORDER.length
    const extraSpins = 5 + Math.floor(Math.random() * 3)
    const targetDeg = extraSpins * 360 + idx * degPerSlot + Math.random() * degPerSlot
    const finalRot = rotation + targetDeg
    setRotation(finalRot)

    await new Promise(r => setTimeout(r, 4000))

    const color = getColor(targetNum)
    let totalPayout = 0

    for (const [betType, betAmount] of Object.entries(selectedBets)) {
      const btConfig = BET_TYPES.find(b => b.label === betType)
      if (btConfig && btConfig.check(targetNum)) {
        totalPayout += betAmount * btConfig.payout
      }
    }

    totalPayout = +totalPayout.toFixed(2)

    if (totalPayout > 0) {
      addWin(totalPayout)
      addNotification(`🎡 ${targetNum} ${color}! Won $${totalPayout.toFixed(2)}!`, 'win')
    } else {
      addNotification(`🎡 ${targetNum} ${color}! Lost $${totalBet.toFixed(2)}`, 'loss')
    }

    addBetHistory({ id: Date.now(), game: 'Roulette', bet: totalBet.toFixed(2), mult: totalPayout > 0 ? (totalPayout / totalBet).toFixed(2) : '0.00', payout: totalPayout.toFixed(2), won: totalPayout > 0, time: Date.now() })
    setResult({ number: targetNum, color, payout: totalPayout })
    setHistory(h => [{ number: targetNum, color }, ...h.slice(0, 19)])
    setSpinning(false)
  }, [totalBet, balance, spinning, selectedBets, rotation, placeBet, addWin, addBetHistory, addNotification])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
          <CircleDot size={20} className="text-red-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Roulette</h1>
          <p className="text-xs text-gray-500">European — Single Zero</p>
        </div>
        <div className="ml-auto flex gap-1 flex-wrap justify-end max-w-xs">
          {history.slice(0, 10).map((h, i) => (
            <span key={i} className={`badge font-bold text-xs ${h.color === 'red' ? 'bg-red-600 text-white' : h.color === 'black' ? 'bg-gray-800 border border-gray-600 text-white' : 'bg-green-700 text-white'}`}>
              {h.number}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-6">
        <div className="panel space-y-4">
          <BetInput value={bet} onChange={setBet} disabled={spinning} />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bets</span>
              {totalBet > 0 && (
                <button onClick={clearBets} className="text-xs text-red-400 hover:text-red-300">Clear All</button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {BET_TYPES.map(({ label, payout }) => {
                const isRed = label === 'Red'
                const isBlack = label === 'Black'
                const hasBet = selectedBets[label] > 0
                return (
                  <button
                    key={label}
                    onClick={() => toggleBet(label)}
                    disabled={spinning}
                    className={`py-2 rounded-lg text-xs font-bold transition-all relative ${
                      isRed ? `${hasBet ? 'ring-2 ring-white' : ''} bg-red-600 hover:bg-red-500 text-white` :
                      isBlack ? `${hasBet ? 'ring-2 ring-white' : ''} bg-gray-800 border border-gray-600 hover:border-gray-400 text-white` :
                      hasBet ? 'bg-vault-green/20 border-vault-green text-vault-green border' : 'bg-vault-bg border border-vault-border text-gray-400 hover:text-white'
                    }`}
                  >
                    {label}
                    <span className="text-[9px] block opacity-60">{payout}:1</span>
                    {hasBet && <span className="absolute -top-1 -right-1 w-4 h-4 bg-vault-gold rounded-full text-black text-[9px] font-black flex items-center justify-center">${selectedBets[label]}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {result && (
            <div className={`panel text-center ${result.payout > 0 ? 'border-vault-green/50 bg-green-900/20' : 'border-red-500/30 bg-red-900/10'}`}>
              <div className={`text-4xl font-black ${result.color === 'red' ? 'text-red-400' : result.color === 'black' ? 'text-white' : 'text-vault-green'}`}>
                {result.number}
              </div>
              <div className="text-sm font-bold capitalize mt-1" style={{ color: result.color === 'red' ? '#ef4444' : result.color === 'black' ? '#9ca3af' : '#3bc117' }}>
                {result.color}
              </div>
              {result.payout > 0 ? (
                <div className="text-vault-green font-black mt-1">+${result.payout.toFixed(2)}</div>
              ) : (
                <div className="text-red-400 mt-1">No win</div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={spin}
              disabled={spinning || totalBet <= 0 || totalBet > balance}
              className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
            >
              {spinning ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Spinning...</> : `Spin ($${totalBet.toFixed(2)})`}
            </button>
          </div>
        </div>

        {/* Wheel Display */}
        <div className="panel flex flex-col items-center justify-center gap-6 min-h-80">
          <div className="relative w-64 h-64">
            <div
              className="w-64 h-64 rounded-full border-4 border-vault-border relative overflow-hidden transition-transform"
              style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 4s cubic-bezier(0.2, 0, 0.1, 1)' : 'none' }}
            >
              {WHEEL_ORDER.map((num, i) => {
                const angle = (i / WHEEL_ORDER.length) * 360
                const color = getColor(num)
                return (
                  <div
                    key={i}
                    className="absolute inset-0 origin-center"
                    style={{ transform: `rotate(${angle}deg)` }}
                  >
                    <div
                      className={`absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1/2 origin-bottom flex items-start justify-center pt-1`}
                    >
                      <div className={`w-7 h-8 text-white text-[9px] font-black flex items-center justify-center ${
                        color === 'red' ? 'bg-red-600' : color === 'green' ? 'bg-green-600' : 'bg-gray-900'
                      }`}>
                        {num}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 bg-vault-bg rounded-full border-2 border-vault-border flex items-center justify-center">
                <CircleDot size={20} className="text-vault-green" />
              </div>
            </div>
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-3 h-6 bg-vault-gold rounded-b-full z-10" />
          </div>

          {result && !spinning && (
            <div className={`text-center text-5xl font-black ${result.color === 'red' ? 'text-red-400' : result.color === 'green' ? 'text-vault-green' : 'text-white'}`}>
              {result.number}
            </div>
          )}

          {spinning && <p className="text-gray-500 text-sm animate-pulse">Spinning...</p>}
          {!spinning && !result && <p className="text-gray-600 text-sm">Place bets and spin!</p>}
        </div>
      </div>
    </div>
  )
}
