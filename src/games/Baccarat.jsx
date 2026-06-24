import { useState, useCallback } from 'react'
import { CreditCard, RefreshCw } from 'lucide-react'
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

function needsThirdCard(hand, isPlayer, playerThirdVal) {
  const total = handPoints(hand)
  if (isPlayer) return total <= 5
  if (total <= 2) return true
  if (total === 3) return playerThirdVal !== 8
  if (total === 4) return playerThirdVal >= 2 && playerThirdVal <= 7
  if (total === 5) return playerThirdVal >= 4 && playerThirdVal <= 7
  if (total === 6) return playerThirdVal === 6 || playerThirdVal === 7
  return false
}

const CHIP_VALUES = [1, 5, 25, 100, 500]
const CHIP_COLORS = { 1: '#6b7280', 5: '#ef4444', 25: '#3b82f6', 100: '#a855f7', 500: '#f59e0b' }

function BacCard({ card, delay = 0 }) {
  if (!card) {
    return (
      <div className="w-16 h-22 rounded-xl border-2 border-dashed border-white/10 bg-white/5"
        style={{ minHeight: '88px' }} />
    )
  }
  const isRed = RED_SUITS.includes(card.suit)
  const color = isRed ? '#dc2626' : '#1f2937'

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white flex flex-col justify-between shadow-xl select-none relative overflow-hidden"
      style={{
        width: '64px', minHeight: '88px',
        padding: '6px',
        animation: `bacDeal 0.35s cubic-bezier(0.34,1.4,0.64,1) ${delay}ms both`,
      }}>
      <style>{`
        @keyframes bacDeal {
          from { transform: translateY(-40px) rotate(-8deg) scale(0.7); opacity: 0; }
          to   { transform: translateY(0) rotate(0) scale(1); opacity: 1; }
        }
      `}</style>
      <div className="leading-tight font-black text-xs" style={{ color, fontFamily: 'Georgia, serif' }}>
        <div>{card.val}</div>
        <div>{card.suit}</div>
      </div>
      <div className="text-2xl font-black self-center" style={{ color, fontFamily: 'Georgia, serif' }}>
        {card.suit}
      </div>
    </div>
  )
}

function ScoreBadge({ score, isWinner, isNatural }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-sm transition-all ${
      isNatural
        ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/40'
        : isWinner
        ? 'bg-vault-green text-black shadow-lg shadow-vault-green/40'
        : 'bg-vault-bg border border-vault-border text-white'
    }`}>
      <span>{score}</span>
      {isNatural && <span className="text-[10px] font-bold">NAT</span>}
      {isWinner && !isNatural && <span className="text-[10px] font-bold">WIN</span>}
    </div>
  )
}

const BET_OPTIONS = [
  { key: 'player', label: 'Player', desc: 'Pays 1:1', color: '#3b82f6', bg: 'bg-blue-500/20', border: 'border-blue-500/50' },
  { key: 'tie',    label: 'Tie',    desc: 'Pays 8:1', color: '#3bc117', bg: 'bg-vault-green/20', border: 'border-vault-green/50' },
  { key: 'banker', label: 'Banker', desc: 'Pays 0.95:1', color: '#ef4444', bg: 'bg-red-500/20', border: 'border-red-500/50' },
]

export default function Baccarat() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [bet, setBet] = useState(5)
  const [betOn, setBetOn] = useState('player')
  const [playerHand, setPlayerHand] = useState([])
  const [bankerHand, setBankerHand] = useState([])
  const [phase, setPhase] = useState('bet')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState({ player: 0, banker: 0, tie: 0 })

  const deal = useCallback(async () => {
    if (bet <= 0 || bet > balance || phase === 'dealing') return
    if (!placeBet(bet)) return
    setPhase('dealing')
    setResult(null)
    setPlayerHand([])
    setBankerHand([])

    const deck = createDeck()
    let d = [...deck]

    // Deal initial 2 cards each
    const card1 = d.shift()
    const card2 = d.shift()
    const card3 = d.shift()
    const card4 = d.shift()

    setPlayerHand([card1])
    await new Promise(r => setTimeout(r, 200))
    setBankerHand([card2])
    await new Promise(r => setTimeout(r, 200))
    setPlayerHand([card1, card3])
    await new Promise(r => setTimeout(r, 200))
    setBankerHand([card2, card4])
    await new Promise(r => setTimeout(r, 500))

    let finalP = [card1, card3]
    let finalB = [card2, card4]
    const pTotal = handPoints(finalP)
    const bTotal = handPoints(finalB)

    if (pTotal < 8 && bTotal < 8) {
      if (needsThirdCard(finalP, true, null)) {
        const thirdP = d.shift()
        finalP = [...finalP, thirdP]
        setPlayerHand(finalP)
        await new Promise(r => setTimeout(r, 450))

        if (needsThirdCard(finalB, false, cardPoints(thirdP))) {
          finalB = [...finalB, d.shift()]
          setBankerHand(finalB)
          await new Promise(r => setTimeout(r, 450))
        }
      } else if (needsThirdCard(finalB, false, null)) {
        finalB = [...finalB, d.shift()]
        setBankerHand(finalB)
        await new Promise(r => setTimeout(r, 450))
      }
    }

    const fp = handPoints(finalP)
    const fb = handPoints(finalB)
    const isNaturalP = (pTotal >= 8 || bTotal >= 8) && fp === pTotal
    const isNaturalB = (pTotal >= 8 || bTotal >= 8) && fb === bTotal

    let winner
    if (fp > fb) winner = 'player'
    else if (fb > fp) winner = 'banker'
    else winner = 'tie'

    const PAYOUTS = { player: 2, banker: 1.95, tie: 9 }
    let payout = 0, wonBet = false

    if (winner === betOn) {
      payout = +(bet * PAYOUTS[betOn]).toFixed(2)
      addWin(payout)
      wonBet = true
    } else if (winner === 'tie' && betOn !== 'tie') {
      payout = bet
      addWin(payout)
    }

    const msg = winner === 'player' ? 'Player Wins!' : winner === 'banker' ? 'Banker Wins!' : "It's a Tie!"
    if (wonBet) addNotification(`🃏 ${msg} Won $${payout.toFixed(2)}!`, 'win')
    else if (winner === 'tie' && betOn !== 'tie') addNotification('🃏 Tie — Bet returned!', 'win')
    else addNotification(`🃏 ${msg} Lost $${bet.toFixed(2)}`, 'loss')

    addBetHistory({ id: Date.now(), game: 'Baccarat', bet: bet.toFixed(2), mult: (payout / bet || 0).toFixed(2), payout: payout.toFixed(2), won: wonBet, time: Date.now() })
    setResult({ winner, fp, fb, payout, wonBet, isNaturalP, isNaturalB })
    setHistory(h => [winner[0].toUpperCase(), ...h.slice(0, 24)])
    setStats(s => ({ ...s, [winner]: s[winner] + 1 }))
    setPhase('done')
  }, [bet, balance, betOn, phase, placeBet, addWin, addBetHistory, addNotification])

  const chosenOpt = BET_OPTIONS.find(o => o.key === betOn)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <CreditCard size={20} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="font-black text-xl">Baccarat</h1>
          <p className="text-xs text-gray-500">Classic Casino · 8 Decks</p>
        </div>
        <div className="ml-auto flex gap-1">
          {history.slice(0, 14).map((h, i) => (
            <span key={i} className={`w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center border ${
              h === 'P' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' :
              h === 'B' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
              'bg-vault-green/20 text-vault-green border-vault-green/40'
            }`}>{h}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
        <div className="panel space-y-4">
          <BetInput value={bet} onChange={setBet} disabled={phase === 'dealing'} />

          {/* Bet selection */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Bet On</label>
            <div className="space-y-2">
              {BET_OPTIONS.map(opt => (
                <button key={opt.key} onClick={() => phase !== 'dealing' && setBetOn(opt.key)}
                  className={`w-full py-3 px-4 rounded-xl border font-bold text-sm transition-all flex items-center justify-between ${
                    betOn === opt.key
                      ? `${opt.bg} ${opt.border} border`
                      : 'bg-vault-bg border-vault-border hover:border-white/20 text-gray-400 hover:text-white'
                  }`}
                  style={{ color: betOn === opt.key ? opt.color : undefined }}>
                  <span>{opt.label}</span>
                  <span className="text-xs opacity-60">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="panel bg-vault-bg py-2.5">
              <div className="text-blue-400 font-black text-xl">{stats.player}</div>
              <div className="text-gray-500 text-xs">Player</div>
            </div>
            <div className="panel bg-vault-bg py-2.5">
              <div className="text-vault-green font-black text-xl">{stats.tie}</div>
              <div className="text-gray-500 text-xs">Tie</div>
            </div>
            <div className="panel bg-vault-bg py-2.5">
              <div className="text-red-400 font-black text-xl">{stats.banker}</div>
              <div className="text-gray-500 text-xs">Banker</div>
            </div>
          </div>

          {/* Result */}
          {result && phase === 'done' && (
            <div className={`rounded-xl p-3 text-center border transition-all ${
              result.wonBet ? 'bg-vault-green/10 border-vault-green/30' :
              result.payout === bet ? 'bg-yellow-500/10 border-yellow-500/30' :
              'bg-red-900/15 border-red-500/20'
            }`}>
              <div className="font-black text-base capitalize">{result.winner} Wins!</div>
              {result.payout > 0 ? (
                <div className={`font-black text-xl mt-0.5 ${result.wonBet ? 'text-vault-green' : 'text-yellow-400'}`}>
                  {result.wonBet ? `+$${(result.payout - bet).toFixed(2)}` : 'Bet Returned'}
                </div>
              ) : (
                <div className="text-red-400 text-sm mt-0.5">Lost ${bet.toFixed(2)}</div>
              )}
            </div>
          )}

          <button onClick={deal} disabled={phase === 'dealing' || bet <= 0 || bet > balance}
            className="btn-primary w-full py-3 font-black text-lg flex items-center justify-center gap-2">
            {phase === 'dealing'
              ? <><span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Dealing...</>
              : <><RefreshCw size={18} /> {phase === 'done' ? 'Deal Again' : 'Deal Cards'}</>
            }
          </button>
        </div>

        {/* Table */}
        <div className="panel relative overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at center, #1a3a2a 0%, #0f2318 60%, #0b1a12 100%)',
            borderColor: '#2a4a35',
          }}>

          {/* Felt texture */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 0, transparent 8px), repeating-linear-gradient(90deg, #fff 0, #fff 1px, transparent 0, transparent 8px)' }} />

          <div className="relative z-10 space-y-6 p-2">
            {/* Banker hand */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                  <span className="font-black text-red-400 text-sm tracking-wide">BANKER</span>
                  {result?.winner === 'banker' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500 text-white">WINNER</span>
                  )}
                </div>
                {bankerHand.length > 0 && (
                  <ScoreBadge
                    score={handPoints(bankerHand)}
                    isWinner={result?.winner === 'banker'}
                    isNatural={result?.isNaturalB}
                  />
                )}
              </div>
              <div className="flex gap-3 min-h-[96px] items-end">
                {bankerHand.length > 0 ? (
                  bankerHand.map((card, i) => (
                    <BacCard key={i} card={card} delay={i * 150} />
                  ))
                ) : (
                  [0, 1, 2].map(i => <BacCard key={i} card={null} />)
                )}
              </div>
            </div>

            {/* VS divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-white/10" />
              <div className="text-white/30 font-black text-sm tracking-widest">VS</div>
              <div className="flex-1 border-t border-white/10" />
              {result?.winner === 'tie' && (
                <div className="absolute left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-vault-green text-black text-xs font-black">
                  TIE!
                </div>
              )}
            </div>

            {/* Player hand */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                  <span className="font-black text-blue-400 text-sm tracking-wide">PLAYER</span>
                  {result?.winner === 'player' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500 text-white">WINNER</span>
                  )}
                </div>
                {playerHand.length > 0 && (
                  <ScoreBadge
                    score={handPoints(playerHand)}
                    isWinner={result?.winner === 'player'}
                    isNatural={result?.isNaturalP}
                  />
                )}
              </div>
              <div className="flex gap-3 min-h-[96px] items-end">
                {playerHand.length > 0 ? (
                  playerHand.map((card, i) => (
                    <BacCard key={i} card={card} delay={i * 150 + 100} />
                  ))
                ) : (
                  [0, 1, 2].map(i => <BacCard key={i} card={null} />)
                )}
              </div>
            </div>

            {/* Your bet indicator */}
            {phase !== 'bet' && (
              <div className="flex justify-center pt-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 border border-white/10 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chosenOpt?.color }} />
                  <span className="text-gray-300">Bet on <span className="font-bold text-white">{chosenOpt?.label}</span></span>
                  <span className="text-gray-500">·</span>
                  <span className="text-white font-bold">${bet.toFixed(2)}</span>
                </div>
              </div>
            )}

            {phase === 'bet' && (
              <div className="text-center text-white/20 py-4">
                <CreditCard size={36} className="mx-auto mb-2" />
                <p className="text-sm">Select your bet and deal to begin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
