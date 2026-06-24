import { useState, useCallback, useEffect, useRef } from 'react'
import { Spade } from 'lucide-react'
import { useWallet } from '../context/WalletContext'

const SUITS = ['♠', '♥', '♦', '♣']
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const RED_SUITS = new Set(['♥', '♦'])

const CHIPS = [
  { value: 1,   bg: '#52525b', border: '#71717a', label: '$1'   },
  { value: 5,   bg: '#991b1b', border: '#ef4444', label: '$5'   },
  { value: 25,  bg: '#166534', border: '#22c55e', label: '$25'  },
  { value: 100, bg: '#1e40af', border: '#60a5fa', label: '$100' },
  { value: 500, bg: '#6b21a8', border: '#c084fc', label: '$500' },
]

function createDeck() {
  const deck = SUITS.flatMap(s => VALUES.map(v => ({ suit: s, val: v })))
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

function cardValue(card) {
  if (['J', 'Q', 'K'].includes(card.val)) return 10
  if (card.val === 'A') return 11
  return parseInt(card.val)
}

function handTotal(hand) {
  let total = 0, aces = 0
  for (const c of hand) {
    if (c.hidden) continue
    if (c.val === 'A') { aces++; total += 11 }
    else total += cardValue(c)
  }
  while (total > 21 && aces > 0) { total -= 10; aces-- }
  return total
}

function isSoft(hand) {
  let total = 0, aces = 0
  for (const c of hand) {
    if (c.hidden) continue
    if (c.val === 'A') { aces++; total += 11 }
    else total += cardValue(c)
  }
  return aces > 0 && total <= 21
}

// ── Visual components ─────────────────────────────────────────────────────────

function ChipStack({ value }) {
  const relevant = [...CHIPS].reverse().filter(c => c.value <= value)
  const stacks = []
  let rem = value
  for (const chip of relevant) {
    const count = Math.floor(rem / chip.value)
    if (count > 0) { stacks.push({ chip, count: Math.min(count, 5) }); rem %= chip.value }
  }
  return (
    <div className="flex items-end gap-1 h-10">
      {stacks.map(({ chip, count }) =>
        Array.from({ length: count }).map((_, i) => (
          <div key={`${chip.value}-${i}`} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-white text-[8px] font-black shadow-md"
            style={{ backgroundColor: chip.bg, borderColor: chip.border, marginBottom: i * 2 }}>
            {chip.label}
          </div>
        ))
      )}
    </div>
  )
}

function PlayingCard({ card, idx = 0, revealed = true }) {
  const isRed = card && RED_SUITS.has(card.suit)
  const isHidden = card?.hidden || !revealed

  return (
    <div
      className="relative select-none"
      style={{ animation: `dealCard 0.25s ease-out ${idx * 120}ms both` }}
    >
      <style>{`
        @keyframes dealCard {
          from { transform: translateY(-60px) scale(0.8) rotate(-8deg); opacity: 0; }
          to   { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes flipReveal {
          from { transform: rotateY(90deg); opacity: 0; }
          to   { transform: rotateY(0deg); opacity: 1; }
        }
      `}</style>

      {isHidden ? (
        <div className="w-16 h-24 rounded-xl shadow-xl border border-vault-border bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
          <div className="w-10 h-16 rounded-lg border border-blue-600/40 bg-gradient-to-br from-blue-800 to-blue-700 flex items-center justify-center text-blue-500 text-2xl">
            ◆
          </div>
        </div>
      ) : (
        <div
          className="w-16 h-24 rounded-xl bg-white shadow-xl border border-gray-100 flex flex-col justify-between p-1.5 overflow-hidden"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif', animation: revealed && !card.hidden ? 'flipReveal 0.3s ease-out' : 'none' }}
        >
          <div className={`text-sm font-black leading-none ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
            <div className="text-base">{card.val}</div>
            <div className="text-xs">{card.suit}</div>
          </div>
          <div className={`text-2xl text-center font-normal leading-none ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
            {card.suit}
          </div>
          <div className={`text-sm font-black leading-none self-end rotate-180 ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
            <div className="text-base">{card.val}</div>
            <div className="text-xs">{card.suit}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreBadge({ score, bust, blackjack, soft }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-black border transition-all ${
      bust ? 'bg-red-500/20 border-red-500/50 text-red-400' :
      blackjack ? 'bg-vault-green/20 border-vault-green/50 text-vault-green' :
      score === 21 ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' :
      'bg-vault-panel border-vault-border text-white'
    }`}>
      {soft && !bust && !blackjack && <span className="text-xs text-gray-400">soft </span>}
      {score}
      {bust && <span className="text-xs">BUST</span>}
      {blackjack && <span className="text-xs">BJ!</span>}
    </span>
  )
}

function HandArea({ hand, label, active, winner, loser, push }) {
  const score = handTotal(hand)
  const bust = score > 21
  const bj = score === 21 && hand.length === 2
  const soft = isSoft(hand) && score < 21

  return (
    <div className={`relative rounded-2xl border-2 p-4 transition-all duration-300 ${
      winner ? 'border-vault-green bg-vault-green/5 shadow-lg shadow-vault-green/10' :
      loser  ? 'border-red-500/40 bg-red-500/5' :
      push   ? 'border-yellow-500/40 bg-yellow-500/5' :
      active ? 'border-vault-green/40 bg-vault-green/3' :
      'border-vault-border bg-vault-panel/30'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</span>
        {hand.length > 0 && <ScoreBadge score={score} bust={bust} blackjack={bj} soft={soft} />}
      </div>
      <div className="flex flex-wrap gap-2 min-h-[96px] items-center">
        {hand.map((card, i) => (
          <PlayingCard key={i} card={card} idx={i} />
        ))}
        {hand.length === 0 && (
          <div className="flex gap-2">
            {[0,1].map(i => (
              <div key={i} className="w-16 h-24 rounded-xl border-2 border-dashed border-vault-border/30 opacity-40" />
            ))}
          </div>
        )}
      </div>
      {winner && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-vault-green text-black text-xs font-black px-3 py-0.5 rounded-full">WIN</div>}
      {loser  && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-black px-3 py-0.5 rounded-full">LOSE</div>}
      {push   && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-black px-3 py-0.5 rounded-full">PUSH</div>}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Blackjack() {
  const { balance, placeBet, addWin, addBetHistory, addNotification } = useWallet()
  const [betAmount, setBetAmount] = useState(0)
  const [deck, setDeck] = useState([])
  const [playerHand, setPlayerHand] = useState([])
  const [dealerHand, setDealerHand] = useState([])
  const [phase, setPhase] = useState('bet') // bet | playing | resolving | done
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState({ w: 0, l: 0, p: 0 })
  const [doubled, setDoubled] = useState(false)
  const [insurance, setInsurance] = useState(null) // null | 'offered' | true | false
  const [insurancePaid, setInsurancePaid] = useState(false)
  const deckRef = useRef([])

  const addChip = (val) => {
    if (phase !== 'bet' && phase !== 'done') return
    if (betAmount + val > balance) return
    setBetAmount(b => b + val)
  }
  const clearBet = () => setBetAmount(0)

  const resolveGame = useCallback((pHand, dHand, currentBet) => {
    const pScore = handTotal(pHand)
    const dScore = handTotal(dHand)
    const pBJ = pScore === 21 && pHand.filter(c => !c.hidden).length === 2
    const dBJ = dScore === 21 && dHand.length === 2

    let outcome, payout = 0

    if (pScore > 21)         { outcome = 'lose' }
    else if (dBJ && pBJ)     { outcome = 'push'; payout = currentBet }
    else if (dBJ)            { outcome = 'lose' }
    else if (pBJ)            { outcome = 'win';  payout = +(currentBet * 2.5).toFixed(2) }
    else if (dScore > 21)    { outcome = 'win';  payout = +(currentBet * 2).toFixed(2) }
    else if (pScore > dScore){ outcome = 'win';  payout = +(currentBet * 2).toFixed(2) }
    else if (pScore < dScore){ outcome = 'lose' }
    else                     { outcome = 'push'; payout = currentBet }

    if (payout > 0) addWin(payout)
    const mult = payout ? (payout / currentBet).toFixed(2) : '0.00'
    addBetHistory({ id: Date.now(), game: 'Blackjack', bet: currentBet.toFixed(2), mult, payout: payout.toFixed(2), won: outcome === 'win', time: Date.now() })

    if (outcome === 'win')  addNotification(`🃏 You win! +$${payout.toFixed(2)}`, 'win')
    if (outcome === 'lose') addNotification(`😔 Dealer wins. -$${currentBet.toFixed(2)}`, 'loss')
    if (outcome === 'push') addNotification(`🤝 Push! Bet returned.`, 'win')

    setResult({ outcome, payout })
    setStats(s => ({ ...s, [outcome === 'win' ? 'w' : outcome === 'lose' ? 'l' : 'p']: s[outcome === 'win' ? 'w' : outcome === 'lose' ? 'l' : 'p'] + 1 }))
    setHistory(h => [outcome[0].toUpperCase(), ...h.slice(0, 24)])
    setPhase('done')
  }, [addWin, addBetHistory, addNotification])

  const runDealer = useCallback((pHand, dHand, d, currentBet) => {
    setPhase('resolving')
    const revealedDealer = dHand.map(c => ({ ...c, hidden: false }))

    const drawUntil17 = (hand, deck) => {
      let h = [...hand], dk = [...deck]
      while (handTotal(h) < 17 || (handTotal(h) === 17 && isSoft(h))) {
        h.push(dk.shift())
      }
      return { hand: h, deck: dk }
    }

    const { hand: finalDealer, deck: remaining } = drawUntil17(revealedDealer, d)
    setDealerHand(finalDealer)
    setDeck(remaining)
    deckRef.current = remaining
    setTimeout(() => resolveGame(pHand, finalDealer, currentBet), 600)
  }, [resolveGame])

  const deal = useCallback(() => {
    if (betAmount <= 0 || betAmount > balance) return
    if (!placeBet(betAmount)) return

    const newDeck = createDeck()
    const pHand = [newDeck.shift(), newDeck.shift()]
    const dHand = [newDeck.shift(), { ...newDeck.shift(), hidden: true }]

    setDeck(newDeck)
    deckRef.current = newDeck
    setPlayerHand(pHand)
    setDealerHand(dHand)
    setPhase('playing')
    setResult(null)
    setDoubled(false)
    setInsurance(null)
    setInsurancePaid(false)

    // Check for blackjack
    const pScore = handTotal(pHand)
    if (pScore === 21) {
      // Check if dealer ace for insurance
      const revealed = dHand.map(c => ({ ...c, hidden: false }))
      const dScore = handTotal(revealed)
      runDealer(pHand, dHand, newDeck, betAmount)
      return
    }

    // Offer insurance if dealer shows Ace
    if (dHand[0].val === 'A') {
      setInsurance('offered')
    }
  }, [betAmount, balance, placeBet, runDealer])

  const takeInsurance = useCallback((take) => {
    setInsurance(take)
    if (take) {
      const insCost = betAmount / 2
      if (insCost <= balance && placeBet(insCost)) {
        setInsurancePaid(true)
      }
    }
  }, [betAmount, balance, placeBet])

  const hit = useCallback(() => {
    if (phase !== 'playing') return
    const d = [...deckRef.current]
    const card = d.shift()
    deckRef.current = d
    setDeck(d)
    const newHand = [...playerHand, card]
    setPlayerHand(newHand)
    const score = handTotal(newHand)
    if (score >= 21) runDealer(newHand, dealerHand, d, betAmount * (doubled ? 2 : 1))
  }, [phase, playerHand, dealerHand, betAmount, doubled, runDealer])

  const stand = useCallback(() => {
    if (phase !== 'playing') return
    runDealer(playerHand, dealerHand, deckRef.current, betAmount * (doubled ? 2 : 1))
  }, [phase, playerHand, dealerHand, betAmount, doubled, runDealer])

  const double = useCallback(() => {
    if (phase !== 'playing' || playerHand.length !== 2 || betAmount > balance) return
    if (!placeBet(betAmount)) return
    setDoubled(true)
    const d = [...deckRef.current]
    const card = d.shift()
    deckRef.current = d
    setDeck(d)
    const newHand = [...playerHand, card]
    setPlayerHand(newHand)
    runDealer(newHand, dealerHand, d, betAmount * 2)
  }, [phase, playerHand, dealerHand, betAmount, balance, placeBet, runDealer])

  const newHand = () => {
    setBetAmount(0)
    setPlayerHand([])
    setDealerHand([])
    setResult(null)
    setPhase('bet')
    setInsurance(null)
  }

  const pScore = handTotal(playerHand)
  const dScore = handTotal(dealerHand.map(c => ({ ...c, hidden: false })))
  const canSplit = playerHand.length === 2 && cardValue(playerHand[0]) === cardValue(playerHand[1])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <Spade size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-black text-xl">Blackjack</h1>
          <p className="text-xs text-gray-500">Vegas Rules · Dealer hits soft 17 · Blackjack pays 3:2</p>
        </div>
        {/* Stats */}
        <div className="ml-auto flex items-center gap-3">
          <div className="flex gap-1 items-center">
            {history.slice(0, 15).map((h, i) => (
              <div key={i} className={`w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center ${
                h === 'W' ? 'bg-vault-green text-black' : h === 'L' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
              }`}>{h}</div>
            ))}
          </div>
          <div className="panel bg-vault-bg py-1.5 px-3 text-xs flex gap-3">
            <span className="text-vault-green font-bold">{stats.w}W</span>
            <span className="text-gray-600">·</span>
            <span className="text-red-400 font-bold">{stats.l}L</span>
            <span className="text-gray-600">·</span>
            <span className="text-yellow-400 font-bold">{stats.p}P</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="relative rounded-3xl bg-gradient-to-b from-green-950 via-green-900 to-green-950 border-4 border-green-800 p-6 shadow-2xl mb-4 overflow-hidden">
        {/* Felt texture */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ffffff 0, #ffffff 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />

        {/* Table label */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-green-700 text-xs font-bold tracking-[0.3em] uppercase opacity-60 whitespace-nowrap">
          ♠ VaultBet Blackjack ♠
        </div>

        {/* Dealer */}
        <HandArea
          hand={dealerHand}
          label="Dealer"
          active={phase === 'resolving'}
          winner={result?.outcome === 'lose'}
          loser={result?.outcome === 'win'}
          push={result?.outcome === 'push'}
        />

        <div className="flex items-center justify-center my-4 gap-4">
          <div className="flex-1 border-t border-green-700/40" />
          {phase === 'done' && result && (
            <div className={`px-6 py-2 rounded-full font-black text-lg shadow-2xl ${
              result.outcome === 'win'  ? 'bg-vault-green text-black' :
              result.outcome === 'lose' ? 'bg-red-600 text-white' :
              'bg-yellow-500 text-black'
            }`}>
              {result.outcome === 'win'  ? `+$${result.payout.toFixed(2)}` :
               result.outcome === 'lose' ? `-$${betAmount.toFixed(2)}` : 'PUSH'}
            </div>
          )}
          <div className="flex-1 border-t border-green-700/40" />
        </div>

        {/* Player */}
        <HandArea
          hand={playerHand}
          label={`Your Hand${doubled ? ' (Doubled)' : ''}`}
          active={phase === 'playing'}
          winner={result?.outcome === 'win'}
          loser={result?.outcome === 'lose'}
          push={result?.outcome === 'push'}
        />
      </div>

      {/* Insurance offer */}
      {insurance === 'offered' && (
        <div className="panel border-yellow-500/40 bg-yellow-900/20 flex items-center justify-between mb-4">
          <div>
            <div className="font-bold text-yellow-400">Insurance?</div>
            <div className="text-xs text-gray-400">Dealer shows Ace. Pay ${(betAmount / 2).toFixed(2)} to insure against Blackjack. Pays 2:1.</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => takeInsurance(false)} className="btn-secondary text-sm px-4 py-2">No Thanks</button>
            <button onClick={() => takeInsurance(true)} disabled={betAmount / 2 > balance} className="btn-gold text-sm px-4 py-2">Take Insurance</button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chip Betting */}
        <div className="panel space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Place Your Bet</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-black text-lg">${betAmount.toFixed(2)}</span>
              {betAmount > 0 && <button onClick={clearBet} disabled={phase !== 'bet' && phase !== 'done'} className="text-xs text-red-400 hover:text-red-300">Clear</button>}
            </div>
          </div>

          {betAmount > 0 && (
            <div className="flex justify-center py-1">
              <ChipStack value={betAmount} />
            </div>
          )}

          <div className="flex items-center justify-center gap-2 flex-wrap">
            {CHIPS.map(chip => (
              <button
                key={chip.value}
                onClick={() => addChip(chip.value)}
                disabled={(phase !== 'bet' && phase !== 'done') || betAmount + chip.value > balance}
                className="relative w-14 h-14 rounded-full border-4 font-black text-white text-xs transition-all hover:scale-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                style={{ backgroundColor: chip.bg, borderColor: chip.border }}
              >
                <div className="absolute inset-1 rounded-full border border-white/20 flex items-center justify-center">
                  {chip.label}
                </div>
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-600 text-center">
            Balance: <span className="text-gray-400">${balance.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="panel flex flex-col gap-3 justify-center">
          {phase === 'bet' || phase === 'done' ? (
            <>
              {phase === 'done' && (
                <button onClick={newHand} className="btn-secondary w-full py-2.5">
                  New Hand
                </button>
              )}
              <button
                onClick={deal}
                disabled={betAmount <= 0 || betAmount > balance}
                className="btn-primary w-full py-4 text-lg font-black flex items-center justify-center gap-2"
              >
                <Spade size={20} /> Deal
              </button>
            </>
          ) : phase === 'playing' ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={hit} className="btn-primary py-3 text-base font-black">Hit</button>
                <button onClick={stand} className="btn-secondary py-3 text-base font-black">Stand</button>
              </div>
              <button
                onClick={double}
                disabled={playerHand.length !== 2 || betAmount > balance}
                className="btn-gold w-full py-2.5 font-bold disabled:opacity-30"
              >
                Double Down (+${betAmount.toFixed(2)})
              </button>
              {canSplit && (
                <button disabled className="btn-secondary w-full py-2 text-sm opacity-40 cursor-not-allowed">
                  Split (coming soon)
                </button>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-4">
              <div className="w-6 h-6 border-2 border-vault-green border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Dealer playing...
            </div>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2">
            <div className="panel bg-vault-bg py-2">
              <div className="text-gray-500">Your Score</div>
              <div className={`font-black text-lg ${pScore > 21 ? 'text-red-400' : pScore === 21 ? 'text-vault-green' : 'text-white'}`}>
                {playerHand.length ? pScore : '—'}
              </div>
            </div>
            <div className="panel bg-vault-bg py-2">
              <div className="text-gray-500">Bet</div>
              <div className="font-black text-lg text-white">${betAmount.toFixed(2)}</div>
            </div>
            <div className="panel bg-vault-bg py-2">
              <div className="text-gray-500">Win</div>
              <div className="font-black text-lg text-vault-green">${(betAmount * 2).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
