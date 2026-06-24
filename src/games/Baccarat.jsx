import { useState, useCallback } from 'react'
import { CreditCard } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import BetInput from '../components/UI/BetInput'

const SUITS = ['♠', '♥', '♦', '♣']
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const RED_SUITS = ['♥', '♦']

function createDeck() {
  return SUITS.flatMap(suit => VALUES.map(val => ({ suit, val }))).sort(() => Math.random() - 0.5)
}

function cardPoints(card) {
  if (['10', 'J', 'Q', 'K'].includes(card.val)) return 0
  if (card.val === 'A') return 1
  return parseInt(card.val)
}

function handPoints(hand) {
  return hand.reduce((a, c) => a + cardPoints(c), 0) % 10
}

function needsThirdCard(hand, isPlayer, otherTotal) {
  const total = handPoints(hand)
  if (isPlayer) {
    return total <= 5
  } else {
    // Banker drawing rules
    const playerThird = otherTotal
    if (total <= 2) return true
    if (total === 3) return playerThird !== 8
    if (total === 4) return playerThird >= 2 && playerThird <= 7
    if (total === 5) return playerThird >= 4 && playerThird <= 7
    if (total === 6) return playerThird === 6 || playerThird === 7
    return false
  }
}

function BacCard({ card }) {
  if (!card) return <div className="w-12 h-16 rounded-lg border border-dashed border-vault-border opacity-30" />
  const isRed = RED_SUITS.includes(card.suit)
  return (
    <div className="w-12 h-16 rounded-lg border border-gray-200 bg-white flex flex-col justify-between p-1 shadow-md select-none">
      <div className={`text-[10px] font-black leading-none ${isRed ? 'text-red-600' : 'text-black'}`}>
        <div>{card.val}</div>
        <div>{card.suit}</div>
      </div>
      <div className={`text-base font-black self-center ${isRed ? 'text-red-600' : 'text-black'}`}>{card.suit}</div>
    </div>
  )
}

const BET_OPTIONS = [
  { key: 'player', label: 'Player', payout: 2, color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/40', desc: '1:1' },
  { key: 'banker', label: 'Banker', payout: 1.95, color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/40', desc: '0.95:1' },
  { key: 'tie', label: 'Tie', payout: 9, color: 'text-vault-green', bg: 'bg-vault-green/20 border-vault-green/40', desc: '8:1' },
]

export default function Baccarat() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [bet, setBet] = useState(5)
  const [betOn, setBetOn] = useState('player')
  const [playerHand, setPlayerHand] = useState([])
  const [bankerHand, setBankerHand] = useState([])
  const [phase, setPhase] = useState('bet') // bet | dealing | done
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState({ player: 0, banker: 0, tie: 0 })

  const deal = useCallback(async () => {
    if (bet <= 0 || bet > balance) return
    if (!placeBet(bet)) return
    setPhase('dealing')
    setResult(null)

    const deck = createDeck()
    let d = [...deck]

    const pHand = [d.shift(), d.shift()]
    const bHand = [d.shift(), d.shift()]

    setPlayerHand(pHand)
    setBankerHand(bHand)
    await new Promise(r => setTimeout(r, 600))

    let finalP = [...pHand]
    let finalB = [...bHand]
    const pTotal = handPoints(finalP)
    const bTotal = handPoints(finalB)

    // Natural
    if (pTotal >= 8 || bTotal >= 8) {
      // Stand
    } else {
      // Player third card
      if (needsThirdCard(finalP, true, null)) {
        const thirdP = d.shift()
        finalP = [...finalP, thirdP]
        setPlayerHand(finalP)
        await new Promise(r => setTimeout(r, 400))

        // Banker third card based on player's third
        if (needsThirdCard(finalB, false, cardPoints(thirdP))) {
          finalB = [...finalB, d.shift()]
          setBankerHand(finalB)
          await new Promise(r => setTimeout(r, 400))
        }
      } else if (needsThirdCard(finalB, false, null)) {
        finalB = [...finalB, d.shift()]
        setBankerHand(finalB)
        await new Promise(r => setTimeout(r, 400))
      }
    }

    const fp = handPoints(finalP)
    const fb = handPoints(finalB)

    let winner, payout = 0, msg
    if (fp > fb) { winner = 'player'; msg = 'Player Wins!' }
    else if (fb > fp) { winner = 'banker'; msg = 'Banker Wins!' }
    else { winner = 'tie'; msg = "It's a Tie!" }

    const option = BET_OPTIONS.find(o => o.key === betOn)
    if (winner === betOn) {
      payout = +(bet * option.payout).toFixed(2)
      addWin(payout)
      addNotification(`🃏 ${msg} Won $${payout.toFixed(2)}!`, 'win')
    } else if (winner === 'tie' && betOn !== 'tie') {
      payout = bet
      addWin(payout)
      addNotification(`🃏 Tie — Bet returned!`, 'win')
    } else {
      addNotification(`🃏 ${msg} Lost $${bet.toFixed(2)}`, 'loss')
    }

    addBetHistory({ id: Date.now(), game: 'Baccarat', bet: bet.toFixed(2), mult: (payout / bet).toFixed(2), payout: payout.toFixed(2), won: payout > bet, time: Date.now() })
    setResult({ winner, msg, fp, fb, payout, won: payout > bet || (payout === bet && winner === 'tie') })
    setHistory(h => [winner[0].toUpperCase(), ...h.slice(0, 19)])
    setStats(s => ({ ...s, [winner]: s[winner] + 1 }))
    setPhase('done')
  }, [bet, balance, betOn, placeBet, addWin, addBetHistory, addNotification])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
          <CreditCard size={20} className="text-green-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Baccarat</h1>
          <p className="text-xs text-gray-500">Classic Casino</p>
        </div>
        <div className="ml-auto flex gap-1">
          {history.slice(0, 15).map((h, i) => (
            <span key={i} className={`w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center ${
              h === 'P' ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50' :
              h === 'B' ? 'bg-red-500/30 text-red-400 border border-red-500/50' :
              'bg-vault-green/30 text-vault-green border border-vault-green/50'
            }`}>{h}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
        <div className="panel space-y-4">
          <BetInput value={bet} onChange={setBet} disabled={phase === 'dealing'} />

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Bet On</label>
            <div className="space-y-2">
              {BET_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => phase !== 'dealing' && setBetOn(opt.key)}
                  className={`w-full py-3 rounded-xl border font-bold text-sm transition-all ${
                    betOn === opt.key ? `${opt.bg} ${opt.color}` : 'bg-vault-bg border-vault-border text-gray-400 hover:text-white'
                  }`}
                >
                  <div>{opt.label}</div>
                  <div className="text-xs opacity-60">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="panel bg-vault-bg"><div className="text-blue-400 font-bold text-lg">{stats.player}</div><div className="text-gray-500">Player</div></div>
            <div className="panel bg-vault-bg"><div className="text-vault-green font-bold text-lg">{stats.tie}</div><div className="text-gray-500">Tie</div></div>
            <div className="panel bg-vault-bg"><div className="text-red-400 font-bold text-lg">{stats.banker}</div><div className="text-gray-500">Banker</div></div>
          </div>

          {result && (
            <div className={`panel text-center ${result.won ? 'border-vault-green/50 bg-green-900/20' : 'border-red-500/30 bg-red-900/10'}`}>
              <div className="font-black text-lg">{result.msg}</div>
              {result.payout > 0 ? <div className="text-vault-green font-black text-xl mt-1">+${result.payout.toFixed(2)}</div> : <div className="text-red-400 mt-1">No win</div>}
            </div>
          )}

          <button onClick={deal} disabled={phase === 'dealing' || bet <= 0 || bet > balance} className="btn-primary w-full py-3">
            {phase === 'dealing' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Dealing...
              </span>
            ) : phase === 'done' ? 'Deal Again' : 'Deal'}
          </button>
        </div>

        <div className="panel space-y-6">
          {/* Banker */}
          <div className={`panel transition-all ${result?.winner === 'banker' ? 'border-red-500/50 bg-red-900/10' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-red-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" /> Banker
              </span>
              {bankerHand.length > 0 && (
                <span className={`text-2xl font-black ${result?.winner === 'banker' ? 'text-red-400' : 'text-white'}`}>
                  {handPoints(bankerHand)}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {[0, 1, 2].map(i => <BacCard key={i} card={bankerHand[i]} />)}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-vault-border" />
            <span className="text-gray-600 font-bold">VS</span>
            <div className="flex-1 border-t border-vault-border" />
          </div>

          {/* Player */}
          <div className={`panel transition-all ${result?.winner === 'player' ? 'border-blue-500/50 bg-blue-900/10' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-blue-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" /> Player
              </span>
              {playerHand.length > 0 && (
                <span className={`text-2xl font-black ${result?.winner === 'player' ? 'text-blue-400' : 'text-white'}`}>
                  {handPoints(playerHand)}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {[0, 1, 2].map(i => <BacCard key={i} card={playerHand[i]} />)}
            </div>
          </div>

          {!result && phase === 'bet' && (
            <div className="text-center text-gray-600">
              <CreditCard size={40} className="mx-auto mb-2 opacity-30" />
              <p>Select a bet and deal to play</p>
            </div>
          )}

          {result?.winner === 'tie' && (
            <div className="text-center text-vault-green font-black text-xl animate-pulse">
              🤝 Tie! Both scored {result.fp}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
